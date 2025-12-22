/**
 * OAuth 2.0 + PKCE Helper Utilities
 * Implements RFC 7636 (PKCE) for secure authorization code flow
 */

/**
 * Base64URL encoding (RFC 4648 §5)
 * Converts binary data to URL-safe base64 string
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
    .replace(/\+/g, '-')  // Replace + with -
    .replace(/\//g, '_')  // Replace / with _
    .replace(/=/g, '')    // Remove padding
}

/**
 * Generate cryptographically secure random string for PKCE code_verifier
 * @param length - Length of verifier (43-128 chars), default 128
 * @returns URL-safe random string
 */
export function generateCodeVerifier(length: number = 128): string {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters')
  }

  // Generate random bytes
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)

  // Convert to base64url string
  const base64Url = base64UrlEncode(randomBytes.buffer)

  // Truncate or pad to exact length
  return base64Url.slice(0, length)
}

/**
 * Generate PKCE code_challenge from code_verifier
 * Uses S256 method: BASE64URL(SHA256(code_verifier))
 * @param verifier - The code verifier string
 * @returns Promise resolving to base64url-encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Convert verifier to bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)

  // SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Base64URL encode
  return base64UrlEncode(hashBuffer)
}

/**
 * Generate random state parameter for CSRF protection
 * @returns Random string for state parameter
 */
export function generateState(): string {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return base64UrlEncode(randomBytes.buffer)
}
