const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: 'https://jrog20.github.io',
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
    
    // Try Last.fm API for tag-based estimation (fallback)
    try {
      console.log('Trying Last.fm API for tag-based estimation...');
      const lastfmResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(song)}&api_key=fec31c2387c9a084582de7f15c50fd8e&format=json`
      );
      
      if (lastfmResponse.ok) {
        const data = await lastfmResponse.json();
        console.log('Last.fm response tags:', data.track?.toptags?.tag);
        
        if (data.track && data.track.toptags && data.track.toptags.tag) {
          const tags = data.track.toptags.tag.map(tag => tag.name.toLowerCase());
          console.log('Processing tags:', tags);
          
          // More sophisticated tempo estimation based on tags and genres
          if (tags.includes('fast') || tags.includes('upbeat') || tags.includes('dance') || tags.includes('electronic') || tags.includes('edm')) {
            return res.json({ tempo: 140, source: 'lastfm-tags' });
          }
          if (tags.includes('slow') || tags.includes('ballad') || tags.includes('acoustic') || tags.includes('country') || tags.includes('folk')) {
            return res.json({ tempo: 80, source: 'lastfm-tags' });
          }
          if (tags.includes('hip-hop') || tags.includes('rap') || tags.includes('trap')) {
            return res.json({ tempo: 150, source: 'lastfm-tags' });
          }
          if (tags.includes('rock') || tags.includes('alternative') || tags.includes('indie')) {
            return res.json({ tempo: 130, source: 'lastfm-tags' });
          }
          if (tags.includes('pop') || tags.includes('electropop') || tags.includes('synth-pop')) {
            return res.json({ tempo: 125, source: 'lastfm-tags' });
          }
          if (tags.includes('r&b') || tags.includes('soul') || tags.includes('blues')) {
            return res.json({ tempo: 110, source: 'lastfm-tags' });
          }
          if (tags.includes('jazz') || tags.includes('lounge')) {
            return res.json({ tempo: 90, source: 'lastfm-tags' });
          }
          if (tags.includes('classical') || tags.includes('orchestral')) {
            return res.json({ tempo: 70, source: 'lastfm-tags' });
          }
          
          // If we have tags but none match our conditions, use a weighted average
          if (tags.length > 0) {
            console.log('Using weighted tag-based estimation');
            // Calculate tempo based on tag presence
            let tempoSum = 0;
            let tagCount = 0;
            
            tags.forEach(tag => {
              if (tag.includes('fast') || tag.includes('upbeat')) {
                tempoSum += 140;
                tagCount++;
              } else if (tag.includes('slow') || tag.includes('ballad')) {
                tempoSum += 80;
                tagCount++;
              } else if (tag.includes('pop')) {
                tempoSum += 125;
                tagCount++;
              } else if (tag.includes('rock')) {
                tempoSum += 130;
                tagCount++;
              } else if (tag.includes('hip-hop') || tag.includes('rap')) {
                tempoSum += 150;
                tagCount++;
              }
            });
            
            if (tagCount > 0) {
              const estimatedTempo = Math.round(tempoSum / tagCount);
              return res.json({ tempo: estimatedTempo, source: 'lastfm-weighted-tags' });
            }
          }
        }
      }
    } catch (error) {
      console.log('Last.fm API failed:', error.message);
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