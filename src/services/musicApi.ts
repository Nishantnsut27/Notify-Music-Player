import type { Track } from '../types/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/music';

export class MusicAPI {
  static async searchTracks(query: string, limit = 20): Promise<Track[]> {
    if (!query || !query.trim()) return [];

    try {
      const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Music API response error! Status: ${response.status}`);
      }

      const body = await response.json();
      if (!body.success || !Array.isArray(body.data)) {
        throw new Error('Invalid response payload format from music backend.');
      }

      if (body.data.length === 0) {
        throw new Error(`No music found for "${query}". Try searching for genres like rap, pop, electronic, or jazz.`);
      }

      return body.data as Track[];
    } catch (error) {
      console.error('[MusicAPI] Search error:', error);
      throw error;
    }
  }

  static async getTrendingTracks(limit = 25): Promise<Track[]> {
    try {
      const url = `${API_BASE_URL}/trending?limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Music API response error! Status: ${response.status}`);
      }

      const body = await response.json();
      if (!body.success || !Array.isArray(body.data)) {
        throw new Error('Invalid response payload format from music backend.');
      }

      return body.data as Track[];
    } catch (error) {
      console.error('[MusicAPI] Get trending tracks error:', error);
      throw new Error('🎵 Trending music is temporarily unavailable. Please try searching for your favorite tracks instead.');
    }
  }

  static async getTrackById(id: string): Promise<Track | null> {
    try {
      const url = `${API_BASE_URL}/song/${encodeURIComponent(id)}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const body = await response.json();
      return body.success ? (body.data as Track) : null;
    } catch (error) {
      console.error('[MusicAPI] Get track by ID error:', error);
      return null;
    }
  }

  static async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      const url = `${API_BASE_URL}/artist/${encodeURIComponent(artistId)}`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const body = await response.json();
      return body.success && body.data?.topSongs ? (body.data.topSongs as Track[]) : [];
    } catch (error) {
      console.error('[MusicAPI] Get tracks by artist error:', error);
      return [];
    }
  }

  static async getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
    return this.searchTracks(genre, limit);
  }
}

// Backward compatibility alias for existing code
export const JamendoAPI = MusicAPI;

export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getTrackUrl = (trackId: string): string => {
  return `https://www.jamendo.com/track/${trackId}`;
};

export const getArtistUrl = (artistId: string): string => {
  return `https://www.jamendo.com/artist/${artistId}`;
};

export const getJamendoTrackUrl = getTrackUrl;
export const getJamendoArtistUrl = getArtistUrl;
