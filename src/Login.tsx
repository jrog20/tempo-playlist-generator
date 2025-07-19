import React from 'react';
import { generateCodeVerifier, generateCodeChallenge } from './services/pkceUtils';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'demo-client-id';
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'https://jrog20.github.io/tempo-playlist-generator/';
const scope = 'playlist-read-private playlist-read-collaborative user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-read';

async function handleLogin() {
  // Check if we have valid environment variables
  if (!process.env.REACT_APP_SPOTIFY_CLIENT_ID) {
    alert('Spotify API not configured. This is a demo version.');
    return;
  }
  
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  console.log('Setting code verifier:', codeVerifier);
  sessionStorage.setItem('spotify_code_verifier', codeVerifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

const Login: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <h1 className="text-3xl font-bold mb-6">Tempo Playlist Generator</h1>
    <p className="text-gray-300 mb-6 text-center max-w-md">
      Create the perfect playlist that maintains the same rhythm and energy as your favorite song
    </p>
    <button
      className="px-6 py-3 bg-green-500 rounded-lg text-lg font-semibold hover:bg-green-600 transition"
      onClick={handleLogin}
    >
      Log in with Spotify
    </button>
    {!process.env.REACT_APP_SPOTIFY_CLIENT_ID && (
      <p className="text-yellow-400 mt-4 text-sm">
        Demo mode - Spotify API not configured
      </p>
    )}
  </div>
);

export default Login; 