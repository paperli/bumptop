/**
 * Token Storage Service
 * Manages OAuth access tokens in sessionStorage with expiration
 *
 * SECURITY: Tokens are never logged to console
 */

const TOKEN_KEY = 'dropbox_access_token'
const TOKEN_EXPIRY_KEY = 'dropbox_token_expiry'
const USER_INFO_KEY = 'dropbox_user_info'
const OAUTH_STATE_KEY = 'dropbox_oauth_state'
const CODE_VERIFIER_KEY = 'dropbox_code_verifier'

interface UserInfo {
  accountId: string
  email: string
  displayName: string
}

/**
 * Store access token with expiration timestamp
 * @param accessToken - OAuth access token
 * @param expiresIn - Token lifetime in seconds (from Dropbox API)
 */
export function storeToken(accessToken: string, expiresIn: number): void {
  const expiryTime = Date.now() + (expiresIn * 1000)

  sessionStorage.setItem(TOKEN_KEY, accessToken)
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString())

  console.log('[TokenStorage] Token stored successfully (expires in', expiresIn, 'seconds)')
}

/**
 * Retrieve access token if valid
 * Returns null if token is expired or missing
 * Uses 5-minute buffer for expiration check
 */
export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY)

  if (!token || !expiryStr) {
    return null
  }

  const expiryTime = parseInt(expiryStr, 10)
  const bufferMs = 5 * 60 * 1000 // 5 minutes buffer

  if (Date.now() + bufferMs >= expiryTime) {
    console.log('[TokenStorage] Token expired or expiring soon, clearing')
    clearToken()
    return null
  }

  return token
}

/**
 * Check if a valid token exists
 */
export function hasValidToken(): boolean {
  return getToken() !== null
}

/**
 * Clear stored token and expiration
 */
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
  console.log('[TokenStorage] Token cleared')
}

/**
 * Store user information
 */
export function storeUserInfo(user: UserInfo): void {
  sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
  console.log('[TokenStorage] User info stored:', user.displayName)
}

/**
 * Retrieve stored user information
 */
export function getUserInfo(): UserInfo | null {
  const userStr = sessionStorage.getItem(USER_INFO_KEY)

  if (!userStr) {
    return null
  }

  try {
    return JSON.parse(userStr) as UserInfo
  } catch (e) {
    console.error('[TokenStorage] Failed to parse user info:', e)
    return null
  }
}

/**
 * Clear user information
 */
export function clearUserInfo(): void {
  sessionStorage.removeItem(USER_INFO_KEY)
  console.log('[TokenStorage] User info cleared')
}

/**
 * Store OAuth state parameters (for CSRF protection)
 */
export function storeOAuthState(state: string, codeVerifier: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
  console.log('[TokenStorage] OAuth state stored')
}

/**
 * Get OAuth state parameter
 */
export function getOAuthState(): string | null {
  return sessionStorage.getItem(OAUTH_STATE_KEY)
}

/**
 * Get code verifier
 */
export function getCodeVerifier(): string | null {
  return sessionStorage.getItem(CODE_VERIFIER_KEY)
}

/**
 * Clear OAuth state (after successful token exchange)
 */
export function clearOAuthState(): void {
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  console.log('[TokenStorage] OAuth state cleared')
}

/**
 * Clear all stored data (token + user info + OAuth state)
 */
export function clearAll(): void {
  clearToken()
  clearUserInfo()
  clearOAuthState()
}
