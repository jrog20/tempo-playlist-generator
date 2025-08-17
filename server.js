const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://jrog20.github.io',
  credentials: true
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
    
    // Try AcousticBrainz API first (real BPM data)
    try {
      console.log('Trying AcousticBrainz API...');
      
      // Step 1: Get MusicBrainz ID for the track
      const musicbrainzResponse = await fetch(
        `https://musicbrainz.org/ws/2/recording/?query=artist:"${encodeURIComponent(artist)}" AND recording:"${encodeURIComponent(song)}"&fmt=json`
      );
      
      console.log('MusicBrainz response status:', musicbrainzResponse.status);
      
      if (musicbrainzResponse.ok) {
        const mbData = await musicbrainzResponse.json();
        console.log('MusicBrainz found recordings:', mbData.recordings?.length || 0);
        
        if (mbData.recordings && mbData.recordings.length > 0) {
          // Get the first (most relevant) recording
          const recording = mbData.recordings[0];
          const mbid = recording.id;
          console.log('Found MusicBrainz ID:', mbid);
          
          // Step 2: Get acoustic analysis data using the MBID
          const acousticResponse = await fetch(
            `https://acousticbrainz.org/api/v1/${mbid}/low-level`
          );
          
          console.log('AcousticBrainz response status:', acousticResponse.status);
          
          if (acousticResponse.ok) {
            const data = await acousticResponse.json();
            console.log('AcousticBrainz response data:', JSON.stringify(data, null, 2));
            
            if (data.rhythm && data.rhythm.bpm) {
              console.log(`Found real BPM from AcousticBrainz: ${data.rhythm.bpm}`);
              return res.json({ 
                tempo: Math.round(data.rhythm.bpm), 
                source: 'acousticbrainz',
                confidence: data.rhythm.bpm_confidence || 0.5
              });
            }
          } else {
            console.log('AcousticBrainz API returned status:', acousticResponse.status);
          }
        } else {
          console.log('No recordings found in MusicBrainz');
        }
      } else {
        console.log('MusicBrainz API returned status:', musicbrainzResponse.status);
      }
    } catch (error) {
      console.log('AcousticBrainz API failed:', error.message);
    }
    
    // Try Musixmatch API as backup (requires API key)
    try {
      console.log('Trying Musixmatch API...');
      // You can get a free API key from https://developer.musixmatch.com/
      const musixmatchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/matcher.track.get?q_track=${encodeURIComponent(song)}&q_artist=${encodeURIComponent(artist)}&apikey=YOUR_MUSIXMATCH_API_KEY`
      );
      
      if (musixmatchResponse.ok) {
        const data = await musixmatchResponse.json();
        console.log('Musixmatch response:', data);
        
        if (data.message && data.message.body && data.message.body.track && data.message.body.track.tempo) {
          const tempo = data.message.body.track.tempo;
          console.log(`Found real BPM from Musixmatch: ${tempo}`);
          return res.json({ 
            tempo: Math.round(tempo), 
            source: 'musixmatch'
          });
        }
      }
    } catch (error) {
      console.log('Musixmatch API failed:', error.message);
    }
    
    // Try OpenAI LLM for BPM estimation (primary fallback)
    console.log('Trying OpenAI LLM for BPM estimation...');
    const aiResult = await getBpmAndGenreFromOpenAI(song, artist);
    if (aiResult.bpm) {
      console.log(`Found BPM from OpenAI LLM: ${aiResult.bpm}`);
      return res.json({ tempo: aiResult.bpm, genre: aiResult.genre, source: 'openai', raw: aiResult.raw });
    }
    
    // Fallback: Estimate tempo based on artist/song characteristics
    const artistLower = artist.toLowerCase();
    const songLower = song.toLowerCase();
    
    console.log('Using artist-based heuristics...');
    
    // Simple heuristics for tempo estimation
    if (artistLower.includes('swift') || artistLower.includes('taylor')) {
      // Taylor Swift songs are typically 120-140 BPM
      return res.json({ tempo: 130, source: 'heuristic' });
    }
    if (artistLower.includes('beyonce') || artistLower.includes('rihanna')) {
      // Pop/R&B songs are typically 120-130 BPM
      return res.json({ tempo: 125, source: 'heuristic' });
    }
    if (artistLower.includes('drake') || artistLower.includes('post malone')) {
      // Hip-hop songs are typically 140-160 BPM
      return res.json({ tempo: 150, source: 'heuristic' });
    }
    if (artistLower.includes('ed sheeran') || artistLower.includes('coldplay')) {
      // Acoustic/pop songs are typically 100-120 BPM
      return res.json({ tempo: 110, source: 'heuristic' });
    }
    if (artistLower.includes('p!nk') || artistLower.includes('pink')) {
      // P!nk songs are typically 120-140 BPM (pop/rock)
      return res.json({ tempo: 130, source: 'heuristic' });
    }
    if (artistLower.includes('chris stapleton') || artistLower.includes('zach bryan')) {
      // Country songs are typically 80-120 BPM
      return res.json({ tempo: 100, source: 'heuristic' });
    }
    if (artistLower.includes('victoria monet')) {
      // R&B/pop songs are typically 120-130 BPM
      return res.json({ tempo: 125, source: 'heuristic' });
    }
    
    // Default fallback
    console.log('Using default tempo: 120 BPM');
    return res.json({ tempo: 120, source: 'default' });
    
  } catch (error) {
    console.error('Tempo API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});