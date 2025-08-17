const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
// dotenv is not needed in production since Railway provides environment variables
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Spotify client credentials token management
let spotifyToken = null;
let tokenExpiry = 0;

async function getSpotifyClientToken() {
  // Check if we have a valid token
  if (spotifyToken && Date.now() < tokenExpiry) {
    return spotifyToken;
  }

  try {
    console.log('Getting new Spotify client credentials token...');
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Spotify credentials not configured');
      return null;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (response.ok) {
      const data = await response.json();
      spotifyToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
      console.log('Spotify client token obtained successfully');
      return spotifyToken;
    } else {
      console.error('Failed to get Spotify client token:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error getting Spotify client token:', error);
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: ['https://jrog20.github.io', 'https://jrog20.github.io/tempo-playlist-generator', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Proxy endpoint for Spotify audio features
app.get('/api/spotify/audio-features/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }
    
    const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Spotify audio features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getBpmAndGenreFromOpenAI(song, artist) {
  const prompt = `You are a music expert with deep knowledge of song tempos and genres. 

Analyze the song "${song}" by "${artist}" and provide:
1. The BPM (beats per minute) - be as accurate as possible based on the song's rhythm and style
2. The primary genre of the song

Consider these BPM ranges for different styles:
- Ballads/Slow songs: 60-80 BPM
- Medium tempo pop/rock: 90-120 BPM  
- Upbeat pop/dance: 120-140 BPM
- Fast dance/electronic: 140-160 BPM
- Hip-hop/rap: 80-100 BPM (typically)
- Country: 80-120 BPM
- Jazz: 60-200 BPM (varies widely)
- Classical: 40-200 BPM (varies widely)

Respond in exactly this format:
BPM: <number>
Genre: <genre>

Example: For "Shape of You" by Ed Sheeran, you would respond:
BPM: 96
Genre: pop

Be precise and consider the artist's typical style and the song's characteristics.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.1, // Low temperature for more consistent results
    });
    const text = completion.choices[0].message.content;
    console.log('OpenAI response:', text);
    
    // Parse response
    const bpmMatch = text.match(/BPM[:\s]+(\d+)/i);
    const genreMatch = text.match(/Genre[:\s]+([A-Za-z0-9 ,&-]+)/i);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : null;
    const genre = genreMatch ? genreMatch[1].trim() : null;
    
    console.log('Parsed BPM:', bpm, 'Genre:', genre);
    return { bpm, genre, raw: text };
  } catch (err) {
    console.error('OpenAI API error:', err);
    return { bpm: null, genre: null, raw: null };
  }
}

// Proxy endpoint for external tempo APIs
app.get('/api/tempo/:artist/:song', async (req, res) => {
  try {
    const { artist, song } = req.params;
    
    console.log(`Looking for tempo data for: ${song} by ${artist}`);
    
    // Note: AcousticBrainz and Musixmatch APIs removed as they don't work reliably
    
    // Try Spotify Audio Analysis as primary fallback
    console.log('Trying Spotify Audio Analysis...');
    try {
      // Get a valid Spotify client token
      const token = await getSpotifyClientToken();
      if (!token) {
        console.log('Could not get Spotify client token, skipping Audio Analysis');
        throw new Error('No Spotify token available');
      }

      // First, search for the track to get its ID
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
          const trackId = searchData.tracks.items[0].id;
          console.log(`Found track ID: ${trackId}`);
          
          // Now get audio analysis
          const analysisResponse = await fetch(
            `https://api.spotify.com/v1/audio-analysis/${trackId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            console.log('Spotify Audio Analysis response:', analysisData);
            
            if (analysisData.track && analysisData.track.tempo) {
              const tempo = Math.round(analysisData.track.tempo);
              const confidence = analysisData.track.tempo_confidence || 0;
              console.log(`Found BPM from Spotify Audio Analysis: ${tempo} (confidence: ${confidence})`);
              return res.json({ 
                tempo: tempo, 
                source: 'spotify_audio_analysis',
                confidence: confidence
              });
            }
          } else {
            console.log('Spotify Audio Analysis failed:', analysisResponse.status);
          }
        } else {
          console.log('No tracks found in Spotify search');
        }
      } else {
        console.log('Spotify search failed:', searchResponse.status);
      }
    } catch (error) {
      console.log('Spotify Audio Analysis error:', error.message);
    }
    
    // Try OpenAI LLM for BPM estimation (secondary fallback)
    console.log('Trying OpenAI LLM for BPM estimation...');
    const aiResult = await getBpmAndGenreFromOpenAI(song, artist);
    if (aiResult.bpm) {
      console.log(`Found BPM from OpenAI LLM: ${aiResult.bpm}`);
      return res.json({ tempo: aiResult.bpm, genre: aiResult.genre, source: 'openai', raw: aiResult.raw });
    }
    
    // Default fallback
    console.log('All BPM sources failed, using default tempo: 120 BPM');
    return res.json({ tempo: 120, source: 'default' });
    
  } catch (error) {
    console.error('Tempo API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dedicated OpenAI BPM endpoint
app.post('/api/openai/tempo', async (req, res) => {
  try {
    const { song, artist } = req.body;
    console.log(`OpenAI BPM API called for "${song}" by "${artist}"`);
    
    if (!song || !artist) {
      return res.status(400).json({ error: 'Song and artist are required' });
    }
    
    const aiResult = await getBpmAndGenreFromOpenAI(song, artist);
    if (aiResult.bpm) {
      console.log(`Found BPM from OpenAI LLM: ${aiResult.bpm}`);
      return res.json({ 
        bpm: aiResult.bpm, 
        genre: aiResult.genre, 
        source: 'openai', 
        raw: aiResult.raw 
      });
    } else {
      console.log('OpenAI LLM failed to return BPM');
      return res.status(500).json({ error: 'Failed to get BPM from OpenAI' });
    }
    
  } catch (error) {
    console.error('OpenAI BPM API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});