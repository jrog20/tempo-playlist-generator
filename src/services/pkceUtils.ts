// PKCE utility functions for Spotify authentication

// Generate a random string for the code verifier
export function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
}

// Base64-urlencode (RFC 4648 §5)
function base64UrlEncode(str: ArrayBuffer) {
  const uint8 = new Uint8Array(str);
  return btoa(String.fromCharCode(...Array.from(uint8)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate a code challenge from a code verifier
export async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
} 