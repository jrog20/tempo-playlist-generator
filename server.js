const express = require('express');
const app = express();
const PORT = process.env.PORT || 5002;

// Allow CORS from local frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});

app.options('/spotify-proxy/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.sendStatus(200);
});

// Proxy GET requests to any Spotify API endpoint
app.get('/spotify-proxy/*', async (req, res) => {
  console.log('--- /spotify-proxy/* route hit ---');
  console.log('Proxy received headers:', req.headers); // <-- Add this line
  // Remove '/spotify-proxy/' from the start of the path
  const spotifyPathWithQuery = req.originalUrl.replace(/^\/spotify-proxy\//, '');
  const spotifyUrl = `https://api.spotify.com/${spotifyPathWithQuery}`;
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    console.log('About to fetch from Spotify:', spotifyUrl, 'with header:', authHeader);
    const spotifyRes = await fetch(spotifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });
    const data = await spotifyRes.text();
    console.log('Spotify response status:', spotifyRes.status);
    console.log('Spotify response body:', data);
    res.status(spotifyRes.status);
    res.set('Content-Type', spotifyRes.headers.get('content-type') || 'application/json');
    res.send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

app.get('/test', (req, res) => {
  console.log('--- /test route hit ---');
  res.send('Test route working');
});

console.log('>>> THIS IS THE CORRECT server.js STARTING <<<');
app.listen(PORT, () => {
  console.log(`Spotify proxy server running on port ${PORT}`);
});