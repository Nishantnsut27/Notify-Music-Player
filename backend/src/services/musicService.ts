import { IMusicProvider } from '../providers/musicProvider.interface.js';
import { JioSaavnProvider } from '../providers/jiosaavnProvider.js';
import { JamendoProvider } from '../providers/jamendoProvider.js';
import { Song, Album, Artist, Playlist, Suggestion } from '../models/music.model.js';
import { MusicNormalizer } from '../normalizers/musicNormalizer.js';

export class MusicService {
  private primaryProvider: IMusicProvider;
  private fallbackProvider: IMusicProvider;

  constructor() {
    this.primaryProvider = new JioSaavnProvider();
    this.fallbackProvider = new JamendoProvider();
  }

  // Fall back to Jamendo when JioSaavn returns no matches
  async search(query: string, limit = 20): Promise<{ songs: Song[]; provider: string }> {
    if (!query || !query.trim()) {
      return { songs: [], provider: this.primaryProvider.name };
    }

    try {
      console.log(`[MusicService] Searching primary provider (${this.primaryProvider.name}) for: "${query}"`);
      const jioResults = await this.primaryProvider.search(query, limit);

      if (jioResults.length > 0) {
        return { songs: jioResults, provider: this.primaryProvider.name };
      }

      console.log(`[MusicService] No results from ${this.primaryProvider.name}. Falling back to ${this.fallbackProvider.name}...`);
      const jamendoResults = await this.fallbackProvider.search(query, limit);
      return { songs: jamendoResults, provider: this.fallbackProvider.name };
    } catch (error) {
      console.error(`[MusicService] Search error with primary provider, attempting fallback:`, error);
      const jamendoResults = await this.fallbackProvider.search(query, limit);
      return { songs: jamendoResults, provider: this.fallbackProvider.name };
    }
  }

  async getSongById(id: string): Promise<Song | null> {
    if (!id) return null;

    let song = await this.primaryProvider.getSongById(id);
    if (song) return song;

    console.log(`[MusicService] Song ID ${id} not found in ${this.primaryProvider.name}. Checking fallback...`);
    song = await this.fallbackProvider.getSongById(id);
    return song;
  }

  async getAlbumById(id: string): Promise<Album | null> {
    if (!id) return null;

    let album = await this.primaryProvider.getAlbumById(id);
    if (album) return album;

    album = await this.fallbackProvider.getAlbumById(id);
    return album;
  }

  async getArtistById(id: string): Promise<Artist | null> {
    if (!id) return null;

    let artist = await this.primaryProvider.getArtistById(id);
    if (artist) return artist;

    artist = await this.fallbackProvider.getArtistById(id);
    return artist;
  }

  async getPlaylistById(id: string): Promise<Playlist | null> {
    if (!id) return null;

    let playlist = await this.primaryProvider.getPlaylistById(id);
    if (playlist) return playlist;

    playlist = await this.fallbackProvider.getPlaylistById(id);
    return playlist;
  }

  async getSuggestions(id: string, limit = 10): Promise<Suggestion[]> {
    if (!id) return [];

    let songs = await this.primaryProvider.getSuggestions(id, limit);
    if (songs.length === 0) {
      songs = await this.fallbackProvider.getSuggestions(id, limit);
    }

    return songs.map(song => MusicNormalizer.normalizeSuggestion(song));
  }

  async getTrending(limit = 20): Promise<{ songs: Song[]; provider: string }> {
    const trendingQueries = ['trending', 'top hits', 'rap', 'pop'];
    for (const q of trendingQueries) {
      const res = await this.search(q, limit);
      if (res.songs.length > 0) {
        return res;
      }
    }
    return { songs: [], provider: this.primaryProvider.name };
  }
}
