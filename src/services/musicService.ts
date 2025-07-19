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
  
  const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  console.log('DEBUG: Audio features response status:', response.status);
  console.log('DEBUG: Audio features response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to get audio features:', response.status, errorBody);
    console.error('DEBUG: Full error response body:', errorBody);
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('spotify_access_token');
      window.location.href = '/#/login';
    }
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

// Get tempo from external API as fallback
async function getTempoFromExternalAPI(songName: string, artistName: string): Promise<number | null> {
  try {
    // Try Last.fm API first (no API key required for basic usage)
    const lastfmResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artistName)}&track=${encodeURIComponent(songName)}&api_key=YOUR_LASTFM_API_KEY&format=json`);
    
    if (lastfmResponse.ok) {
      const data = await lastfmResponse.json();
      if (data.track && data.track.toptags && data.track.toptags.tag) {
        // Last.fm doesn't provide tempo directly, but we can use tags to estimate
        const tags = data.track.toptags.tag.map((tag: any) => tag.name.toLowerCase());
        if (tags.includes('fast') || tags.includes('upbeat')) return 140;
        if (tags.includes('slow') || tags.includes('ballad')) return 80;
        if (tags.includes('medium')) return 120;
      }
    }
  } catch (error) {
    console.log('Last.fm API failed:', error);
  }
  
  try {
    // Try AcousticBrainz API (free, no API key required)
    const acousticResponse = await fetch(`https://acousticbrainz.org/api/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}/low-level`);
    
    if (acousticResponse.ok) {
      const data = await acousticResponse.json();
      if (data.rhythm && data.rhythm.bpm) {
        return data.rhythm.bpm;
      }
    }
  } catch (error) {
    console.log('AcousticBrainz API failed:', error);
  }
  
  return null;
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
      let tempo = 120; // Default tempo
      try {
        const audioFeatures = await getSpotifyAudioFeatures(track.id);
        console.log('audioFeatures in searchSong:', audioFeatures);
        tempo = audioFeatures.tempo;
      } catch (error) {
        console.log('Spotify audio features failed, trying external API...');
        // Try external API as fallback
        const externalTempo = await getTempoFromExternalAPI(songName, artistName);
        if (externalTempo) {
          tempo = externalTempo;
          console.log('Got tempo from external API:', tempo);
        } else {
          console.log('External API failed, using popularity-based estimate');
          // Use popularity as a last resort
          tempo = Math.max(80, Math.min(160, 120 + (track.popularity - 50) * 0.8));
        }
      }
      
      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album?.name,
        tempo: tempo,
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
      // 1. Find the reference song
      const referenceSong = await this.searchSong(request.referenceSong, request.referenceArtist);
      console.log('RIGHT BEFORE referenceSong in generatePlaylist: ', referenceSong);
      if (!referenceSong) {
        throw new Error('Reference song not found');
      }
      const targetTempo = referenceSong.tempo;
      
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
            tempo: targetTempo, // Use the reference song's tempo
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
    if (!accessToken) throw new Error('No Spotify access token found');
    
    // Search for similar artists and songs
    const searchQueries = [
      `artist:${referenceSong.artist}`,
      `genre:pop`,
      `genre:${referenceSong.artist.toLowerCase().includes('pop') ? 'pop' : 'rock'}`,
      `year:2020-2024`,
    ];
    
    const allTracks: any[] = [];
    
    for (const query of searchQueries) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          allTracks.push(...data.tracks.items);
        }
      } catch (error) {
        console.log('Search query failed:', query, error);
      }
    }
    
    // Remove duplicates and the reference song
    const uniqueTracks = allTracks.filter((track, index, self) => 
      index === self.findIndex(t => t.id === track.id) && track.id !== referenceSong.id
    );
    
    // Sort by popularity and return top results
    return uniqueTracks
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
} 