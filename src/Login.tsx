import React from 'react';
import { generateCodeVerifier, generateCodeChallenge } from './services/pkceUtils';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI!;
const scope = 'playlist-read-private playlist-read-collaborative user-read-private user-read-email';

async function handleLogin() {
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
    <h1 className="text-3xl font-bold mb-6">Login with Spotify</h1>
    <button
      className="px-6 py-3 bg-green-500 rounded-lg text-lg font-semibold hover:bg-green-600 transition"
      onClick={handleLogin}
    >
      Log in with Spotify
    </button>
  </div>
);

export default Login; 