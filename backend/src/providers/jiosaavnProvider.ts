import axios, { AxiosInstance } from 'axios';
import { IMusicProvider } from './musicProvider.interface.js';
import { Song, Album, Artist, Playlist } from '../models/music.model.js';
import { MusicNormalizer } from '../normalizers/musicNormalizer.js';
import { config } from '../config/config.js';

export class JioSaavnProvider implements IMusicProvider {
  readonly name = 'jiosaavn' as const;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.jiosaavnApiUrl,
      timeout: config.requestTimeoutMs,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NotifyMusicPlayer/1.0'
      }
    });
  }

  async search(query: string, limit = 20): Promise<Song[]> {
    try {
      const response = await this.client.get('/api/search/songs', {
        params: { query, limit, page: 0 }
      });

      const results = response.data?.data?.results;
      if (!Array.isArray(results) || results.length === 0) {
        return [];
      }

      return results.map((rawSong: unknown) => MusicNormalizer.normalizeJioSaavnSong(rawSong));
    } catch {
      return [];
    }
  }

  async getSongById(id: string): Promise<Song | null> {
    try {
      const response = await this.client.get(`/api/songs/${id}`);
      const songs = response.data?.data;
      if (Array.isArray(songs) && songs.length > 0) {
        return MusicNormalizer.normalizeJioSaavnSong(songs[0]);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getAlbumById(id: string): Promise<Album | null> {
    try {
      const response = await this.client.get('/api/albums', {
        params: { id }
      });
      const data = response.data?.data;
      if (data && typeof data === 'object' && data.id && data.name) {
        return MusicNormalizer.normalizeJioSaavnAlbum(data);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getArtistById(id: string): Promise<Artist | null> {
    try {
      const response = await this.client.get(`/api/artists/${id}`);
      const data = response.data?.data;
      if (data && typeof data === 'object' && (data.name || (Array.isArray(data.topSongs) && data.topSongs.length > 0))) {
        return MusicNormalizer.normalizeJioSaavnArtist(data);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const response = await this.client.get('/api/playlists', {
        params: { id }
      });
      const data = response.data?.data;
      if (data && typeof data === 'object') {
        return MusicNormalizer.normalizeJioSaavnPlaylist(data);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getSuggestions(id: string, limit = 10): Promise<Song[]> {
    try {
      const response = await this.client.get(`/api/songs/${id}/suggestions`, {
        params: { limit }
      });
      const results = response.data?.data;
      if (Array.isArray(results) && results.length > 0) {
        return results.map((rawSong: unknown) => MusicNormalizer.normalizeJioSaavnSong(rawSong));
      }
      return [];
    } catch {
      return [];
    }
  }
}
