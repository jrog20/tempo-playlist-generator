import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI!;

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.ok) throw new Error('Failed to get access token');
  return response.json();
}

const Callback: React.FC = () => {
  console.log('Callback component rendered');
  const navigate = useNavigate();
  const location = useLocation();
  const { setAccessToken } = useAuth();
  
  useEffect(() => {
    console.log('Callback useEffect rendered');
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    if (error) {
      alert('Spotify login failed: ' + error);
      navigate('/login');
      return;
    }
    if (!code) {
      alert('No code found in callback');
      navigate('/login');
      return;
    }
    const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      alert('No PKCE code verifier found');
      navigate('/login');
      return;
    }
    console.log('Code:', code);
    console.log('Code verifier:', codeVerifier);
    exchangeCodeForToken(code, codeVerifier)
      .then(data => {
        setAccessToken(data.access_token);
        // Optionally store refresh_token and expires_in
        navigate('/');
      })
      .catch(() => {
        alert('Failed to authenticate with Spotify');
        navigate('/login');
      });
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Logging you in with Spotify...</h1>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
};

export default Callback; 