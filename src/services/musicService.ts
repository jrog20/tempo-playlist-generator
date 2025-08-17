import { PlaylistRequest, PlaylistResponse, Song } from '../types';

// Helper: Get access token from storage
function getSpotifyAccessToken() {
  return localStorage.getItem('spotify_access_token');
}

// Search for a track on Spotify by name and artist
export async function searchSpotifyTrack(songName: string, artistName: string) {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: About to search for track:', songName, 'by', artistName);
  console.log('DEBUG: Search access token being used:', accessToken.substring(0, 20) + '...');
  
  const q = `${songName} artist:${artistName}`;
  const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Search response status:', response.status);
  
  if (!response.ok) throw new Error('Failed to search track');
  const data = await response.json();
  return data.tracks.items[0] || null;
}

// Get audio features (including tempo) for a track by Spotify ID
export async function getSpotifyAudioFeatures(trackId: string) {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: About to fetch audio features for trackId:', trackId);
  console.log('DEBUG: Access token being used:', accessToken.substring(0, 20) + '...');
  
      // Try backend proxy first (might work around 403 issues)
    try {
      const proxyResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://tempo-playlist-generator-production.up.railway.app'}/api/spotify/audio-features/${trackId}`, {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
    });
    
    console.log('DEBUG: Proxy audio features response status:', proxyResponse.status);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log('data in getSpotifyAudioFeatures (via proxy):', data);
      return data;
    }
    
    console.log('DEBUG: Proxy failed, trying direct Spotify API...');
  } catch (error) {
    console.log('DEBUG: Proxy not available, trying direct Spotify API...');
  }
  
  // Fallback to direct Spotify API
  const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Audio features response status:', response.status);
  console.log('DEBUG: Audio features response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to get audio features:', response.status, errorBody);
    console.error('DEBUG: Full error response body:', errorBody);
    // Don't clear token for 403 errors in development mode - we expect them
    // if (response.status === 401 || response.status === 403) {
    //   localStorage.removeItem('spotify_access_token');
    //   window.location.href = '/#/login';
    // }
    throw new Error('Failed to get audio features');
  }
  const data = await response.json();
  console.log('data in getSpotifyAudioFeatures:', data); 
  return data;
}

// Search for tracks by tempo and genre (approximate, using recommendations endpoint)
export async function searchSimilarTracks(seedTrackId: string, targetTempo: number, genre?: string, limit = 30) {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  const params = new URLSearchParams({
    seed_tracks: seedTrackId,
    target_tempo: targetTempo.toString(),
    limit: limit.toString(),
  });
  if (genre) params.append('seed_genres', genre);
  const response = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to get recommendations');
  const data = await response.json();
  return data.tracks;
}

// Fetch user's playlists
export async function fetchSpotifyPlaylists() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  const response = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
}

// Get song preview URL
export function getPreviewUrl(spotifyId: string): string {
  return `https://open.spotify.com/track/${spotifyId}`;
}

// Test function to check if token works with other endpoints
export async function testSpotifyToken() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing token with /me endpoint...');
  
  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: /me endpoint response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: /me endpoint failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: /me endpoint success:', data.display_name);
  return true;
}

// Test function to check if recommendations endpoint works
export async function testRecommendationsEndpoint() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing recommendations endpoint...');
  
  // Use a more reliable track ID for testing - "Shape of You" by Ed Sheeran
  const testTrackId = '7qiZfU4dY1lWllzX7mPBI3'; // This is the correct ID for Shape of You
  const params = new URLSearchParams({
    seed_tracks: testTrackId,
    limit: '1'
  });
  
  const response = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Recommendations response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: Recommendations failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: Recommendations success:', data.tracks?.length || 0, 'tracks returned');
  return true;
}

// Test function to check if audio features endpoint works
export async function testAudioFeaturesEndpoint() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing audio features endpoint...');
  
  // Use a reliable track ID for testing - "Shape of You" by Ed Sheeran
  const testTrackId = '7qiZfU4dY1lWllzX7mPBI3'; // This is the correct ID for Shape of You
  
  const response = await fetch(`https://api.spotify.com/v1/audio-features/${testTrackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Audio features test response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: Audio features test failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: Audio features test success:', data);
  return true;
}

// Test function to check if track analysis endpoint works
export async function testTrackAnalysisEndpoint() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing track analysis endpoint...');
  
  // Use a reliable track ID for testing - "Shape of You" by Ed Sheeran
  const testTrackId = '7qiZfU4dY1lWllzX7mPBI3';
  
  const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${testTrackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Track analysis test response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: Track analysis test failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: Track analysis test success:', data);
  return true;
}

// Test function to check if several tracks audio features endpoint works
export async function testSeveralTracksAudioFeatures() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing several tracks audio features endpoint...');
  
  // Use multiple track IDs
  const trackIds = ['7qiZfU4dY1lWllzX7mPBI3', '4iV5W9uYEdYUVa79Axb7Rh'];
  
  const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Several tracks audio features response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: Several tracks audio features failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: Several tracks audio features success:', data);
  return true;
}

// Test function to check if user's saved tracks endpoint works
export async function testUserSavedTracks() {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  console.log('DEBUG: Testing user saved tracks endpoint...');
  
  const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=1', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: User saved tracks response status:', response.status);
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('DEBUG: User saved tracks failed:', response.status, errorBody);
    return false;
  }
  
  const data = await response.json();
  console.log('DEBUG: User saved tracks success:', data);
  return true;
}

// Save playlist to user's Spotify account
export async function savePlaylistToSpotify(playlistName: string, songs: Song[], description?: string): Promise<string | null> {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  
  try {
    console.log('DEBUG: Saving playlist to Spotify:', playlistName, 'with', songs.length, 'songs');
    
    // Step 1: Get current user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!userResponse.ok) {
      console.error('DEBUG: Failed to get user info:', userResponse.status);
      throw new Error('Failed to get user information');
    }
    
    const userData = await userResponse.json();
    const userId = userData.id;
    console.log('DEBUG: User ID:', userId);
    
    // Step 2: Create the playlist
    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: playlistName,
        description: description || `Generated playlist with ${songs.length} songs`,
        public: false, // Make it private by default
      }),
    });
    
    if (!createPlaylistResponse.ok) {
      console.error('DEBUG: Failed to create playlist:', createPlaylistResponse.status);
      const errorText = await createPlaylistResponse.text();
      console.error('DEBUG: Create playlist error:', errorText);
      throw new Error('Failed to create playlist');
    }
    
    const playlistData = await createPlaylistResponse.json();
    const playlistId = playlistData.id;
    const playlistUrl = playlistData.external_urls.spotify;
    console.log('DEBUG: Created playlist with ID:', playlistId);
    console.log('DEBUG: Playlist URL:', playlistUrl);
    
    // Step 3: Add songs to the playlist
    const trackUris = songs.map(song => `spotify:track:${song.spotifyId}`).filter(uri => uri !== 'spotify:track:');
    
    if (trackUris.length === 0) {
      console.log('DEBUG: No valid track URIs to add');
      return playlistUrl;
    }
    
    // Spotify API allows max 100 tracks per request, so we might need to batch
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });
      
      if (!addTracksResponse.ok) {
        console.error('DEBUG: Failed to add tracks batch:', addTracksResponse.status);
        const errorText = await addTracksResponse.text();
        console.error('DEBUG: Add tracks error:', errorText);
        throw new Error('Failed to add tracks to playlist');
      }
      
      console.log('DEBUG: Added batch of', batch.length, 'tracks to playlist');
    }
    
    console.log('DEBUG: Successfully saved playlist to Spotify');
    return playlistUrl;
    
  } catch (error) {
    console.error('DEBUG: Error saving playlist to Spotify:', error);
    throw error;
  }
}

// Get tempo from external API as fallback
async function getTempoFromExternalAPI(songName: string, artistName: string): Promise<number | null> {
  try {
    console.log(`DEBUG: Trying external tempo API for "${songName}" by "${artistName}"`);
    
    // Try backend proxy for external tempo APIs
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://tempo-playlist-generator-production.up.railway.app'}/api/tempo/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`);
    
    console.log(`DEBUG: External tempo API response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`DEBUG: External tempo API response data:`, data);
      
      if (data.tempo && typeof data.tempo === 'number') {
        console.log(`DEBUG: Got tempo from external API: ${data.tempo} BPM (source: ${data.source || 'unknown'})`);
        return data.tempo;
      } else {
        console.log(`DEBUG: External API returned invalid tempo data:`, data);
      }
    } else {
      const errorText = await response.text();
      console.log(`DEBUG: External tempo API failed with status ${response.status}:`, errorText);
    }
    
    console.log('DEBUG: Backend tempo API failed or no tempo found');
    return null;
  } catch (error) {
    console.log('DEBUG: Backend tempo API not available:', error);
    return null;
  }
}

// Main service for playlist generation
export class MusicService {
  private static instance: MusicService;

  private constructor() {}

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService();
    }
    return MusicService.instance;
  }

  // Search for a song and get its audio features
  async searchSong(songName: string, artistName: string): Promise<Song | null> {
    try {
      const track = await searchSpotifyTrack(songName, artistName);
      console.log('track in searchSong:', track);
      if (!track) return null;
      
      // Try to get audio features from Spotify first
      let tempo: number | null = null;
      try {
        const audioFeatures = await getSpotifyAudioFeatures(track.id);
        console.log('audioFeatures in searchSong:', audioFeatures);
        tempo = audioFeatures.tempo;
      } catch (error) {
        console.log('Spotify audio features failed, trying external API...');
        // Try external API as fallback
        tempo = await getTempoFromExternalAPI(songName, artistName);
        if (tempo) {
          console.log('Got tempo from external API:', tempo);
        } else {
          console.log('No real tempo data available');
          throw new Error('Cannot get tempo data for this song. Spotify audio features are not available in development mode, and external APIs have CORS restrictions.');
        }
      }
      
      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album?.name,
        tempo: tempo!, // We know tempo is not null here because we throw an error if it is
        genre: '', // Optionally fetch genre from artist endpoint if needed
        duration: Math.floor(track.duration_ms / 1000),
        spotifyId: track.id,
        previewUrl: track.preview_url,
      };
    } catch (error) {
      console.error('Error searching for song:', error);
      return null;
    }
  }

  // Generate playlist based on tempo and duration using Spotify recommendations
  async generatePlaylist(request: PlaylistRequest): Promise<PlaylistResponse> {
    try {
      // Check token at the start
      const initialToken = getSpotifyAccessToken();
      console.log('DEBUG: generatePlaylist - initial token:', initialToken ? 'present' : 'missing');
      
      // 1. Find the reference song
      const referenceSong = await this.searchSong(request.referenceSong, request.referenceArtist);
      console.log('RIGHT BEFORE referenceSong in generatePlaylist: ', referenceSong);
      if (!referenceSong) {
        throw new Error('Reference song not found');
      }
      // Use user-provided bpm if present, otherwise use detected tempo
      const targetTempo = request.bpm ?? referenceSong.tempo;
      
      // Check token before recommendations
      const tokenBeforeRecs = getSpotifyAccessToken();
      console.log('DEBUG: generatePlaylist - token before recommendations:', tokenBeforeRecs ? 'present' : 'missing');
      
      // 2. Get recommendations using search since recommendations endpoint is blocked
      const recTracks = await this.getSearchBasedRecommendations(referenceSong, targetTempo, 50);
      
      // 3. Build playlist to match target duration
      const targetDuration = request.duration * 60; // seconds
      let currentDuration = 0;
      const playlistSongs: Song[] = [];
      for (const track of recTracks) {
        if (currentDuration + track.duration_ms / 1000 <= targetDuration) {
          playlistSongs.push({
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album?.name,
            tempo: targetTempo, // Use the reference song's tempo or user-adjusted
            genre: '', // Optionally fetch genre
            duration: Math.floor(track.duration_ms / 1000),
            spotifyId: track.id,
            previewUrl: track.preview_url,
          });
          currentDuration += track.duration_ms / 1000;
        }
        if (currentDuration >= targetDuration) break;
      }
      return {
        songs: playlistSongs,
        totalDuration: currentDuration,
        targetTempo,
        genres: [], // Optionally fetch genres
      };
    } catch (error) {
      console.error('Error generating playlist:', error);
      throw error;
    }
  }

  // Get recommendations using search instead of the recommendations endpoint
  async getSearchBasedRecommendations(referenceSong: Song, targetTempo: number, limit = 30): Promise<any[]> {
    const accessToken = getSpotifyAccessToken();
    console.log('DEBUG: getSearchBasedRecommendations - access token:', accessToken ? 'present' : 'missing');
    if (!accessToken) throw new Error('No Spotify access token found');

    // Fetch genre and year for the reference song
    let genre = '';
    let year = '';
    try {
      // Get track details (for album info)
      const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${referenceSong.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        if (trackData.album && trackData.album.release_date) {
          // Use only the year part
          year = trackData.album.release_date.substring(0, 4);
        }
        // Get artist ID
        const artistId = trackData.artists[0]?.id;
        if (artistId) {
          // Get artist details for genres
          const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (artistRes.ok) {
            const artistData = await artistRes.json();
            if (artistData.genres && artistData.genres.length > 0) {
              genre = artistData.genres[0]; // Use the first genre
            }
          }
        }
      }
    } catch (err) {
      console.log('DEBUG: Could not fetch genre/year for reference song:', err);
    }
    console.log('DEBUG: Using genre:', genre, 'year:', year);

    // Build dynamic search queries
    const searchQueries = [];
    if (referenceSong.artist) searchQueries.push(`artist:${referenceSong.artist}`);
    if (genre) searchQueries.push(`genre:${genre}`);
    if (year) {
      const y = parseInt(year);
      if (!isNaN(y)) searchQueries.push(`year:${y - 2}-${y + 2}`); // 5-year window
    }
    // Fallbacks if genre/year missing
    if (!genre) searchQueries.push('genre:pop');
    if (!year) searchQueries.push('year:2015-2025');

    const allTracks: any[] = [];
    for (const query of searchQueries) {
      try {
        console.log('DEBUG: Searching with query:', query);
        const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('DEBUG: Search response status for query:', query, response.status);
        if (response.ok) {
          const data = await response.json();
          allTracks.push(...data.tracks.items);
          console.log('DEBUG: Found', data.tracks.items.length, 'tracks for query:', query);
        } else {
          console.log('DEBUG: Search failed for query:', query, response.status);
        }
      } catch (error) {
        console.log('Search query failed:', query, error);
      }
    }
    console.log('DEBUG: Total tracks found:', allTracks.length);
    // Remove duplicates and the reference song
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id) && track.id !== referenceSong.id
    );
    console.log('DEBUG: Unique tracks after filtering:', uniqueTracks.length);
    // Sort by popularity and return top results
    const result = uniqueTracks
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
    console.log('DEBUG: Final recommendations count:', result.length);
    return result;
  }
} 