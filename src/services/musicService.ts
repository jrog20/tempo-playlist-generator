import axios from 'axios';
import { Song, PlaylistRequest, PlaylistResponse } from '../types';

// Mock data for demonstration - in a real app, you'd use actual APIs
const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    tempo: 72,
    genre: 'Rock',
    duration: 354,
    spotifyId: '3z8h0TU7ReDPLIbEnYhWZb',
  },
  {
    id: '2',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    tempo: 75,
    genre: 'Rock',
    duration: 391,
    spotifyId: '40riOy7x9W7udXy6B5j3l7',
  },
  {
    id: '3',
    title: 'Imagine',
    artist: 'John Lennon',
    album: 'Imagine',
    tempo: 76,
    genre: 'Pop',
    duration: 183,
    spotifyId: '7pKfPomDEeI4TPT6EOYjn9',
  },
  {
    id: '4',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: '(What\'s the Story) Morning Glory?',
    tempo: 87,
    genre: 'Rock',
    duration: 258,
    spotifyId: '2CT3r93YuSHtm57mjxvjhH',
  },
  {
    id: '5',
    title: 'Creep',
    artist: 'Radiohead',
    album: 'Pablo Honey',
    tempo: 92,
    genre: 'Alternative Rock',
    duration: 239,
    spotifyId: '70LcF31zb1H0PyJoS1Sx1r',
  },
  {
    id: '6',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    album: 'Nevermind',
    tempo: 117,
    genre: 'Grunge',
    duration: 301,
    spotifyId: '5ghIJDpPoe3CfHMGu71E6T',
  },
  {
    id: '7',
    title: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    album: 'Appetite for Destruction',
    tempo: 125,
    genre: 'Hard Rock',
    duration: 356,
    spotifyId: '7snQQk1zcKl8gZ92AnuZWg',
  },
  {
    id: '8',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    tempo: 117,
    genre: 'Pop',
    duration: 294,
    spotifyId: '5ChkMS8OtdzJeqyybCc9R5',
  },
  {
    id: '9',
    title: 'Like a Rolling Stone',
    artist: 'Bob Dylan',
    album: 'Highway 61 Revisited',
    tempo: 88,
    genre: 'Folk Rock',
    duration: 369,
    spotifyId: '3AhXZa8sUQht0UEdBJgpGc',
  },
  {
    id: '10',
    title: 'Stairway to Heaven',
    artist: 'Led Zeppelin',
    album: 'Led Zeppelin IV',
    tempo: 82,
    genre: 'Rock',
    duration: 482,
    spotifyId: '5CQ30WqJwcep0pYcV4AMNc',
  },
];

export class MusicService {
  private static instance: MusicService;

  private constructor() {}

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService();
    }
    return MusicService.instance;
  }

  // Search for a song to get its tempo and genre
  async searchSong(songName: string, artistName: string): Promise<Song | null> {
    try {
      // In a real implementation, you would use APIs like:
      // - Spotify Web API (requires authentication)
      // - Last.fm API (free tier available)
      // - MusicBrainz API (free)
      // - Echo Nest API (requires API key)
      
      // For now, we'll search in our mock data
      const foundSong = mockSongs.find(
        song => 
          song.title.toLowerCase().includes(songName.toLowerCase()) ||
          song.artist.toLowerCase().includes(artistName.toLowerCase())
      );
      
      return foundSong || null;
    } catch (error) {
      console.error('Error searching for song:', error);
      return null;
    }
  }

  // Generate playlist based on tempo and duration
  async generatePlaylist(request: PlaylistRequest): Promise<PlaylistResponse> {
    try {
      // First, find the reference song
      const referenceSong = await this.searchSong(request.referenceSong, request.referenceArtist);
      
      if (!referenceSong) {
        throw new Error('Reference song not found');
      }

      const targetTempo = referenceSong.tempo;
      const targetDuration = request.duration * 60; // Convert minutes to seconds
      const tempoTolerance = 10; // BPM tolerance
      
      // Filter songs by tempo and genre similarity
      const candidateSongs = mockSongs.filter(song => {
        const tempoMatch = Math.abs(song.tempo - targetTempo) <= tempoTolerance;
        const genreMatch = song.genre === referenceSong.genre || 
                          this.areGenresSimilar(song.genre, referenceSong.genre);
        return tempoMatch && genreMatch && song.id !== referenceSong.id;
      });

      // Sort by tempo similarity
      candidateSongs.sort((a, b) => 
        Math.abs(a.tempo - targetTempo) - Math.abs(b.tempo - targetTempo)
      );

      // Build playlist to match target duration
      const playlist: Song[] = [];
      let currentDuration = 0;
      
      for (const song of candidateSongs) {
        if (currentDuration + song.duration <= targetDuration) {
          playlist.push(song);
          currentDuration += song.duration;
        }
        
        if (currentDuration >= targetDuration) {
          break;
        }
      }

      // If we don't have enough songs, add more with broader criteria
      if (currentDuration < targetDuration) {
        const remainingSongs = mockSongs.filter(song => 
          !playlist.find(p => p.id === song.id) && 
          song.id !== referenceSong.id
        );
        
        for (const song of remainingSongs) {
          if (currentDuration + song.duration <= targetDuration) {
            playlist.push(song);
            currentDuration += song.duration;
          }
          
          if (currentDuration >= targetDuration) {
            break;
          }
        }
      }

      return {
        songs: playlist,
        totalDuration: currentDuration,
        targetTempo,
        genres: Array.from(new Set(playlist.map(song => song.genre)))
      };
    } catch (error) {
      console.error('Error generating playlist:', error);
      throw error;
    }
  }

  private areGenresSimilar(genre1: string, genre2: string): boolean {
    const genreGroups = {
      rock: ['Rock', 'Hard Rock', 'Alternative Rock', 'Grunge', 'Folk Rock'],
      pop: ['Pop'],
      electronic: ['Electronic', 'EDM', 'House', 'Techno'],
      hiphop: ['Hip Hop', 'Rap'],
      jazz: ['Jazz', 'Smooth Jazz'],
      classical: ['Classical', 'Orchestral']
    };

    for (const group of Object.values(genreGroups)) {
      if (group.includes(genre1) && group.includes(genre2)) {
        return true;
      }
    }
    return false;
  }

  // Get song preview URL (would use Spotify API in real implementation)
  getPreviewUrl(spotifyId: string): string {
    // In a real app, you'd use Spotify's preview_url
    return `https://open.spotify.com/track/${spotifyId}`;
  }
} 

export async function fetchSpotifyPlaylists() {
  const accessToken = localStorage.getItem('spotify_access_token');
  if (!accessToken) throw new Error('No Spotify access token found');
  const response = await fetch('http://127.0.0.1:5002/spotify-proxy/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
} 

// Helper: Get access token from storage
function getSpotifyAccessToken() {
  return localStorage.getItem('spotify_access_token');
}

// Search for a track on Spotify by name and artist
export async function searchSpotifyTrack(songName: string, artistName: string) {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  const q = `${songName} artist:${artistName}`;
  const response = await fetch(`http://127.0.0.1:5002/spotify-proxy/v1/search?type=track&limit=1&q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to search track');
  const data = await response.json();
  return data.tracks.items[0] || null;
}

// Get audio features (including tempo) for a track by Spotify ID
export async function getSpotifyAudioFeatures(trackId: string) {
  const accessToken = getSpotifyAccessToken();
  if (!accessToken) throw new Error('No Spotify access token found');
  const response = await fetch(`http://127.0.0.1:5002/spotify-proxy/v1/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to get audio features');
  return response.json();
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
  const response = await fetch(`http://127.0.0.1:5002/spotify-proxy/v1/recommendations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to get recommendations');
  const data = await response.json();
  return data.tracks;
} 