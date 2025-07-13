import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Callback from './Callback';
import { MusicService } from './services/musicService';
import { searchSpotifyTrack, getSpotifyAudioFeatures, searchSimilarTracks } from './services/musicService';
import { PlaylistResponse, Song } from './types';
import { AuthProvider, useAuth } from './AuthContext';

const musicService = MusicService.getInstance();

const MainApp: React.FC = () => {
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [duration, setDuration] = useState(30);
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePlaylist = async () => {
    if (!songName.trim() || !artistName.trim()) {
      setError('Please enter both song name and artist');
      return;
    }
    setLoading(true);
    setError('');
    setPlaylist(null);
    try {
      // 1. Search for the reference track
      const refTrack = await searchSpotifyTrack(songName.trim(), artistName.trim());
      if (!refTrack) {
        setError('Reference song not found on Spotify');
        setLoading(false);
        return;
      }
      // 2. Get audio features (tempo)
      const audioFeatures = await getSpotifyAudioFeatures(refTrack.id);
      const targetTempo = audioFeatures.tempo;
      // 3. Get genre (from first artist, if available)
      let genre = undefined;
      if (refTrack.artists && refTrack.artists[0]) {
        // Optionally, fetch artist genres from Spotify API
        const accessToken = localStorage.getItem('spotify_access_token');
        const artistRes = await fetch(`https://api.spotify.com/v1/artists/${refTrack.artists[0].id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (artistRes.ok) {
          const artistData = await artistRes.json();
          genre = artistData.genres && artistData.genres[0];
        }
      }
      // 4. Search for similar tracks
      const recTracks = await searchSimilarTracks(refTrack.id, targetTempo, genre);
      // 5. Build playlist to match target duration
      const targetDuration = duration * 60; // seconds
      let currentDuration = 0;
      const playlistSongs: Song[] = [];
      for (const track of recTracks) {
        if (currentDuration + track.duration_ms / 1000 <= targetDuration) {
          playlistSongs.push({
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album?.name,
            tempo: targetTempo,
            genre: genre || '',
            duration: Math.floor(track.duration_ms / 1000),
            spotifyId: track.id,
            previewUrl: track.preview_url,
          });
          currentDuration += track.duration_ms / 1000;
        }
        if (currentDuration >= targetDuration) break;
      }
      setPlaylist({
        songs: playlistSongs,
        totalDuration: currentDuration,
        targetTempo,
        genres: genre ? [genre] : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate playlist');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Tempo Playlist Generator</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create the perfect playlist that maintains the same rhythm and energy as your favorite song
          </p>
        </div>
        {/* Input Form */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Find Your Rhythm</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Song Name</label>
                <input
                  type="text"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  placeholder="e.g., Bohemian Rhapsody"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Artist</label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g., Queen"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Playlist Duration (minutes)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-white font-semibold min-w-[60px]">{duration} min</span>
                </div>
              </div>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
                  {error}
                </div>
              )}
              <button
                onClick={handleGeneratePlaylist}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating Playlist...</span>
                  </>
                ) : (
                  <span>Generate Playlist</span>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Playlist Results */}
        {playlist && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Your Perfect Playlist</h2>
                <div className="text-right">
                  <div className="text-gray-300 text-sm">Target Tempo</div>
                  <div className="text-2xl font-bold text-white">{playlist.targetTempo} BPM</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center text-gray-300 mb-1">
                    <span className="text-sm">Total Duration</span>
                  </div>
                  <div className="text-xl font-semibold text-white">
                    {formatTotalDuration(playlist.totalDuration)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-gray-300 text-sm mb-1">Genres</div>
                  <div className="text-white font-semibold">
                    {playlist.genres.join(', ')}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {playlist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all duration-200 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{song.title}</div>
                          <div className="text-gray-400 text-sm">{song.artist}</div>
                          {song.album && (
                            <div className="text-gray-500 text-xs">{song.album}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-semibold">{song.tempo} BPM</div>
                          <div className="text-gray-400 text-sm">{formatDuration(song.duration)}</div>
                        </div>
                        {song.spotifyId && (
                          <a
                            href={musicService.getPreviewUrl(song.spotifyId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Preview
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="text-center mt-12 text-gray-400">
          <p>Built with ❤️ for music lovers</p>
        </div>
      </div>
    </div>
  );
};

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/callback" element={<Callback />} />
    <Route
      path="/"
      element={
        <AuthenticatedRoute>
          <MainApp />
        </AuthenticatedRoute>
      }
    />
  </Routes>
);

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;
