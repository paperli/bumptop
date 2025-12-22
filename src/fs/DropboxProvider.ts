/**
 * Dropbox File System Provider
 * Implements OAuth 2.0 + PKCE authentication and file operations
 */

import { FileEntry, FileContentHandle, FileSystemProvider } from '../types'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '../utils/oauth'
import { getToken, storeToken, clearToken, storeUserInfo, getUserInfo, hasValidToken, storeOAuthState, getOAuthState, getCodeVerifier, clearOAuthState } from '../utils/tokenStorage'
import { useAuthStore } from '../store/authStore'

// Use Vite proxy during development to bypass CORS
const API_URL = import.meta.env.DEV ? '/api/dropbox/2' : 'https://api.dropboxapi.com/2'
const CONTENT_URL = import.meta.env.DEV ? '/content/dropbox/2' : 'https://content.dropboxapi.com/2'
// OAuth endpoints are at root level (no /2/)
const OAUTH_URL = import.meta.env.DEV ? '/api/dropbox' : 'https://api.dropboxapi.com'

interface DropboxFileMetadata {
  '.tag': 'file' | 'folder'
  name: string
  path_lower: string
  path_display: string
  id: string
  client_modified?: string
  server_modified?: string
  size?: number
}

interface DropboxListFolderResponse {
  entries: DropboxFileMetadata[]
  cursor: string
  has_more: boolean
}

interface DropboxUserAccount {
  account_id: string
  email: string
  name: {
    display_name: string
  }
}

export class DropboxProvider implements FileSystemProvider {
  id = 'dropbox'
  label = 'Dropbox'

  /**
   * Check if user is authenticated with valid token
   */
  isAuthenticated(): boolean {
    return hasValidToken()
  }

  /**
   * Initiate OAuth 2.0 + PKCE sign-in flow
   * Redirects to Dropbox authorization page
   */
  async signIn(): Promise<void> {
    console.log('[DropboxProvider] Starting sign-in flow')

    // Check configuration
    const appKey = import.meta.env.VITE_DROPBOX_APP_KEY
    const redirectUri = import.meta.env.VITE_DROPBOX_REDIRECT_URI

    if (!appKey || !redirectUri) {
      const error = 'Dropbox configuration missing. Please set VITE_DROPBOX_APP_KEY and VITE_DROPBOX_REDIRECT_URI in .env'
      console.error('[DropboxProvider]', error)
      useAuthStore.getState().setAuthError(error)
      throw new Error(error)
    }

    try {
      // Generate PKCE parameters
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()

      // Store OAuth state for validation in callback (both in authStore and sessionStorage)
      useAuthStore.getState().setOAuthState(verifier, state)
      storeOAuthState(state, verifier) // Persist to sessionStorage for redirect
      useAuthStore.getState().setAuthenticating(true)

      // Build authorization URL
      const authUrl = new URL('https://www.dropbox.com/oauth2/authorize')
      authUrl.searchParams.set('client_id', appKey)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('code_challenge', challenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('token_access_type', 'offline') // Request offline access

      console.log('[DropboxProvider] Redirecting to Dropbox authorization...')

      // Redirect to Dropbox
      window.location.href = authUrl.toString()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start sign-in'
      console.error('[DropboxProvider] Sign-in error:', error)
      useAuthStore.getState().setAuthError(errorMessage)
      throw error
    }
  }

  /**
   * Sign out and clear all stored data
   */
  async signOut(): Promise<void> {
    console.log('[DropboxProvider] Signing out')
    useAuthStore.getState().signOut()
  }

  /**
   * Exchange authorization code for access token
   * Called from OAuth callback handler
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<void> {
    console.log('[DropboxProvider] Exchanging code for token')

    const appKey = import.meta.env.VITE_DROPBOX_APP_KEY
    const redirectUri = import.meta.env.VITE_DROPBOX_REDIRECT_URI

    try {
      const response = await fetch(`${OAUTH_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
          client_id: appKey,
          redirect_uri: redirectUri,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error_description || 'Token exchange failed')
      }

      const data = await response.json()

      // Store token (expires_in is in seconds)
      storeToken(data.access_token, data.expires_in)

      // Fetch and store user info
      await this.fetchUserInfo()

      console.log('[DropboxProvider] ✓ Token exchange successful')
    } catch (error) {
      console.error('[DropboxProvider] Token exchange error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Token exchange failed'
      useAuthStore.getState().setAuthError(errorMessage)
      throw error
    }
  }

  /**
   * Fetch user account information
   */
  async fetchUserInfo(): Promise<void> {
    console.log('[DropboxProvider] Fetching user info')

    try {
      const response = await this.fetchWithAuth(`${API_URL}/users/get_current_account`, {
        method: 'POST',
        body: 'null', // Dropbox API requires 'null' string for empty body
      })

      const user: DropboxUserAccount = await response.json()

      // Store in both tokenStorage and authStore
      const userInfo = {
        accountId: user.account_id,
        email: user.email,
        displayName: user.name.display_name,
      }

      storeUserInfo(userInfo)
      useAuthStore.getState().setUserInfo(userInfo.accountId, userInfo.email, userInfo.displayName)

      console.log('[DropboxProvider] ✓ User info fetched:', userInfo.displayName)
    } catch (error) {
      console.error('[DropboxProvider] Failed to fetch user info:', error)
      throw error
    }
  }

  /**
   * List files in the configured root folder (e.g., /Desktop)
   * Handles pagination automatically
   */
  async listFixedFolder(): Promise<FileEntry[]> {
    const rootPath = import.meta.env.VITE_DROPBOX_ROOT_PATH || '/Desktop'
    console.log('[DropboxProvider] Listing folder:', rootPath)

    try {
      const allFiles: FileEntry[] = []
      let cursor: string | null = null
      let hasMore = true

      // Initial request
      let response = await this.fetchWithAuth(`${API_URL}/files/list_folder`, {
        method: 'POST',
        body: JSON.stringify({
          path: rootPath,
          recursive: false,
          include_deleted: false,
        }),
      })

      let data: DropboxListFolderResponse = await response.json()
      allFiles.push(...this.parseFileEntries(data.entries))
      hasMore = data.has_more
      cursor = data.cursor

      // Handle pagination
      while (hasMore) {
        console.log('[DropboxProvider] Fetching more files (pagination)...')

        response = await this.fetchWithAuth(`${API_URL}/files/list_folder/continue`, {
          method: 'POST',
          body: JSON.stringify({ cursor }),
        })

        data = await response.json()
        allFiles.push(...this.parseFileEntries(data.entries))
        hasMore = data.has_more
        cursor = data.cursor
      }

      console.log(`[DropboxProvider] ✓ Listed ${allFiles.length} files from ${rootPath}`)
      console.log('[DropboxProvider] File types:', {
        images: allFiles.filter(f => f.kind === 'image').length,
        videos: allFiles.filter(f => f.kind === 'video').length,
        audio: allFiles.filter(f => f.kind === 'audio').length,
        text: allFiles.filter(f => f.kind === 'text').length,
      })

      return allFiles
    } catch (error) {
      console.error('[DropboxProvider] Failed to list folder:', error)

      if (error instanceof Error && error.message.includes('not_found')) {
        throw new Error(`Folder "${rootPath}" not found in Dropbox. Please create it or update VITE_DROPBOX_ROOT_PATH in .env`)
      }

      throw error
    }
  }

  /**
   * Download file content and return as blob URL
   */
  async getFileContent(entry: FileEntry): Promise<FileContentHandle> {
    console.log(`[DropboxProvider] Downloading file: ${entry.name}`, {
      path: entry.path,
      mimeType: entry.mimeType,
      kind: entry.kind,
    })

    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      const downloadUrl = `${CONTENT_URL}/files/download`
      console.log(`[DropboxProvider] Fetching from: ${downloadUrl}`)

      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({ path: entry.path }),
        },
      })

      console.log(`[DropboxProvider] Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[DropboxProvider] Download failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText,
        })
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      }

      // Create blob from response with correct MIME type
      const arrayBuffer = await response.arrayBuffer()
      console.log(`[DropboxProvider] Downloaded ${arrayBuffer.byteLength} bytes`)

      const blob = new Blob([arrayBuffer], { type: entry.mimeType })
      const url = URL.createObjectURL(blob)

      console.log(`[DropboxProvider] ✓ Created blob URL:`, {
        fileName: entry.name,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        mimeType: blob.type,
        blobUrl: url,
      })

      // Warn about large files
      if (blob.size > 50 * 1024 * 1024) {
        console.warn(`[DropboxProvider] Large file (${(blob.size / 1024 / 1024).toFixed(1)} MB): ${entry.name}`)
      }

      return {
        url,
        mimeType: entry.mimeType,
      }
    } catch (error) {
      console.error('[DropboxProvider] Download error:', error)
      throw error
    }
  }

  /**
   * Parse Dropbox file metadata into FileEntry format
   */
  private parseFileEntries(entries: DropboxFileMetadata[]): FileEntry[] {
    return entries
      .filter(entry => entry['.tag'] === 'file') // Only files, not folders
      .map(entry => {
        const mimeType = this.inferMimeType(entry.name)
        const kind = this.inferFileKind(mimeType)

        return {
          id: entry.id,
          name: entry.name,
          path: entry.path_display,
          kind,
          mimeType,
          sizeBytes: entry.size || 0,
          modifiedAt: entry.server_modified || entry.client_modified || new Date().toISOString(),
          thumbnailUrl: this.getThumbnailUrl(kind),
        }
      })
  }

  /**
   * Infer MIME type from file extension
   */
  private inferMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || ''

    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',

      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',

      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac',

      // Text
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'css': 'text/css',
      'html': 'text/html',
      'xml': 'application/xml',
      'csv': 'text/csv',
    }

    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * Infer file kind from MIME type
   */
  private inferFileKind(mimeType: string): 'image' | 'video' | 'audio' | 'text' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript')) return 'text'

    // Default to text for unknown types
    return 'text'
  }

  /**
   * Get thumbnail URL for file kind
   */
  private getThumbnailUrl(kind: string): string {
    const thumbnails: Record<string, string> = {
      image: '/mock-assets/images/placeholder-1.svg',
      video: '/mock-assets/videos/video-thumb.svg',
      audio: '/mock-assets/audio/audio-thumb.svg',
      text: '/mock-assets/text/text-thumb.svg',
    }

    return thumbnails[kind] || '/mock-assets/text/text-thumb.svg'
  }

  /**
   * Fetch with authentication and error handling
   */
  private async fetchWithAuth(url: string, options: RequestInit): Promise<Response> {
    const token = getToken()

    if (!token) {
      console.error('[DropboxProvider] No valid token available')
      useAuthStore.getState().signOut()
      throw new Error('Not authenticated')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    // Handle errors
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        console.error('[DropboxProvider] 401 Unauthorized - token expired')
        clearToken()
        useAuthStore.getState().signOut()
        throw new Error('Session expired. Please sign in again.')
      }

      if (response.status === 429) {
        // Rate limited
        throw new Error('Too many requests. Please wait a moment and try again.')
      }

      if (response.status === 409) {
        // Dropbox-specific error (e.g., path not found)
        const errorData = await response.json()
        const errorSummary = errorData.error_summary || 'Dropbox API error'
        throw new Error(errorSummary)
      }

      // Other errors
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response
  }
}
