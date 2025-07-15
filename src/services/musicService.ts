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
      console.log('track in searchSong:', track); //I GET THE CORRECT VALUE HERE, SEE CONSOLE LOG SCREENSHOT
      if (!track) return null;
      const audioFeatures = await getSpotifyAudioFeatures(track.id);
      console.log('audioFeatures in searchSong:', audioFeatures); //NOT GETTING TO HERE! WHAT IS GOING WRONG IN BETWEEN?
      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album?.name,
        tempo: audioFeatures.tempo,
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
      console.log('RIGHT BEFORE referenceSong in generatePlaylist: ', referenceSong); //null
      if (!referenceSong) {
        throw new Error('Reference song not found');
      }
      const targetTempo = referenceSong.tempo;
      // 2. Get recommendations from Spotify
      const recTracks = await searchSimilarTracks(referenceSong.id, targetTempo, undefined, 50);
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
            tempo: targetTempo, // Optionally fetch real tempo for each track
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
} 