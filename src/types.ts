export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  tempo: number;
  genre: string;
  duration: number;
  spotifyId?: string;
  previewUrl?: string;
}

export interface PlaylistRequest {
  referenceSong: string;
  referenceArtist: string;
  duration: number; // in minutes
}

export interface PlaylistResponse {
  songs: Song[];
  totalDuration: number;
  targetTempo: number;
  genres: string[];
} 