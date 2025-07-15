import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'demo-client-id';
const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'https://jrog20.github.io/tempo-playlist-generator/#/callback';

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  if (!process.env.REACT_APP_SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify API not configured');
  }
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
  const navigate = useNavigate();
  const location = useLocation();
  const { setAccessToken } = useAuth();

  useEffect(() => {
    // Try to get code and error from query string
    let urlParams = new URLSearchParams(location.search);
    let code = urlParams.get('code');
    let error = urlParams.get('error');

    // If not found, try to get code and error from hash fragment
    if ((!code || !error) && location.hash) {
      // Remove leading # or #/
      const hash = location.hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(hash);
      if (!code) code = hashParams.get('code');
      if (!error) error = hashParams.get('error');
    }

    console.log('PKCE Debug - code:', code);
    console.log('PKCE Debug - error:', error);

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
    console.log('PKCE Debug - codeVerifier:', codeVerifier);
    if (!codeVerifier) {
      alert('No PKCE code verifier found');
      navigate('/login');
      return;
    }
    exchangeCodeForToken(code, codeVerifier)
      .then(data => {
        console.log('PKCE Debug - token exchange response:', data);
        setAccessToken(data.access_token);
        navigate('/');
      })
      .catch((err) => {
        console.error('PKCE Debug - token exchange error:', err);
        alert('Failed to authenticate with Spotify');
        navigate('/login');
      });
  }, [location, navigate, setAccessToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Logging you in with Spotify...</h1>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
};

export default Callback; 