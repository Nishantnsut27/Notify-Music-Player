import type { JamendoApiResponse, Track } from '../types/types';

const JAMENDO_CLIENT_ID = '2fa42d8a';
const JAMENDO_CLIENT_SECRET = '4711671216a6e59bc8baa4b1efdb315e';
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 6 * 60 * 60 * 1000; // 6 hours

  set(key: string, data: unknown, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

export class JamendoAPI {
  static async testAPI(): Promise<void> {
    try {
      const testUrl = `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}&client_secret=${JAMENDO_CLIENT_SECRET}&format=json&limit=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      
      // Test data structure 
      console.log('API test successful:', data.headers?.status);
      
    } catch (error) {
      console.error('Test API error:', error);
      if (error instanceof TypeError && error.message.includes('CORS')) {
        console.error('CORS error detected - may need to use a proxy');
      }
    }
  }

  private static async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<JamendoApiResponse<Track>> {
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached result for:', endpoint);
      return cached as JamendoApiResponse<Track>;
    }

    const url = new URL(`${JAMENDO_BASE_URL}${endpoint}`);
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('client_secret', JAMENDO_CLIENT_SECRET);
    url.searchParams.set('format', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log('🌐 Making request to:', url.toString());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('📊 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Response data structure:', {
        hasHeaders: !!data.headers,
        hasResults: !!data.results,
        resultsLength: data.results?.length || 0,
        status: data.headers?.status
      });
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      if (data.headers && data.headers.status && data.headers.status !== 'success') {
        console.error('API status error:', data.headers);
        throw new Error(data.headers.error_message || 'API request failed');
      }

      apiCache.set(cacheKey, data);
      console.log('✅ Request successful, cached result');
      return data;
    } catch (error) {
      console.error('Jamendo API error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error - possibly CORS or connection issue');
      }
      throw error;
    }
  }

  static async searchTracks(query: string, limit = 20): Promise<Track[]> {
    if (!query.trim()) return [];
    
    console.log('🔍 Searching for:', query);
    
    try {
      const results = await this.searchTracksFromAPI(query, limit);
      console.log('📡 API Results:', results.length, 'tracks');
      
      if (results.length === 0) {
        throw new Error(`No tracks found for "${query}". Jamendo doesn't have this song/artist. Try searching for different keywords like electronic, jazz, hip-hop, or indie music.`);
      }
      
      return results;
    } catch (error) {
      console.error('Search tracks error:', error);
      throw error;
    }
  }

  private static async searchTracksFromAPI(query: string, limit = 20): Promise<Track[]> {
    try {
      console.log('📡 Making API requests for:', query);
      
      const searches = [
        this.makeRequest('/tracks/', {
          namesearch: query,
          limit: Math.ceil(limit / 3).toString(),
          include: 'musicinfo',
          audioformat: 'mp31',
          order: 'popularity_total'
        }),
        this.makeRequest('/tracks/', {
          artist_name: query,
          limit: Math.ceil(limit / 3).toString(),
          include: 'musicinfo',
          audioformat: 'mp31',
          order: 'popularity_total'
        }),
        this.makeRequest('/tracks/', {
          tags: query,
          limit: Math.ceil(limit / 3).toString(),
          include: 'musicinfo',
          audioformat: 'mp31',
          order: 'popularity_total'
        })
      ];

      const results = await Promise.allSettled(searches);
      let allTracks: Track[] = [];

      results.forEach((result, index) => {
        const searchType = ['track', 'artist', 'genre'][index];
        if (result.status === 'fulfilled' && result.value?.results) {
          console.log(`✅ ${searchType} search: ${result.value.results.length} tracks`);
          allTracks = allTracks.concat(result.value.results);
        } else {
          console.log(`❌ ${searchType} search failed`);
        }
      });

      const uniqueTracks = allTracks.filter((track, index, self) =>
        index === self.findIndex(t => t.id === track.id)
      );

      console.log(`🎵 Total unique tracks found: ${uniqueTracks.length}`);
      return uniqueTracks.slice(0, limit);
    } catch (error) {
      console.error('API search error:', error);
      return [];
    }
  }

  static async getTrendingTracks(limit = 20): Promise<Track[]> {
    try {
      console.log('🎵 Loading trending rap tracks...');
      
      const rapSearches = [
        this.makeRequest('/tracks/', {
          tags: 'rap',
          limit: Math.ceil(limit / 2).toString(),
          include: 'musicinfo',
          audioformat: 'mp31',
          order: 'popularity_total'
        }),
        this.makeRequest('/tracks/', {
          tags: 'hiphop',
          limit: Math.ceil(limit / 2).toString(),
          include: 'musicinfo',
          audioformat: 'mp31',
          order: 'popularity_total'
        })
      ];

      const results = await Promise.allSettled(rapSearches);
      let allTracks: Track[] = [];

      results.forEach((result, index) => {
        const genre = ['rap', 'hip-hop'][index];
        if (result.status === 'fulfilled' && result.value?.results) {
          console.log(`✅ ${genre} tracks: ${result.value.results.length}`);
          allTracks = allTracks.concat(result.value.results);
        }
      });

      const uniqueTracks = allTracks.filter((track, index, self) =>
        index === self.findIndex(t => t.id === track.id)
      );

      if (uniqueTracks.length === 0) {
        throw new Error('No rap tracks found. Jamendo might be having issues. Try searching for specific genres like electronic, jazz, or indie.');
      }

      console.log(`🎯 Loaded ${uniqueTracks.length} trending rap tracks`);
      return uniqueTracks.slice(0, limit);
    } catch (error) {
      console.error('Get trending tracks error:', error);
      throw new Error('Unable to load trending tracks. Please try searching for music instead.');
    }
  }

  static async getTrackById(id: string): Promise<Track | null> {
    try {
      const data: JamendoApiResponse<Track> = await this.makeRequest('/tracks/', {
        id: id,
        include: 'license_downloads musicinfo',
        audioformat: 'mp31'
      });

      return data.results[0] || null;
    } catch (error) {
      console.error('Get track by id error:', error);
      return null;
    }
  }

  static async getTracksByArtist(artistId: string, limit = 20): Promise<Track[]> {
    try {
      const data: JamendoApiResponse<Track> = await this.makeRequest('/tracks/', {
        artist_id: artistId,
        limit: limit.toString(),
        include: 'license_downloads musicinfo',
        audioformat: 'mp31'
      });

      return data.results;
    } catch (error) {
      console.error('Get tracks by artist error:', error);
      throw new Error('Failed to load artist tracks. Please try again.');
    }
  }

  static async getTracksByGenre(genre: string, limit = 20): Promise<Track[]> {
    try {
      const data: JamendoApiResponse<Track> = await this.makeRequest('/tracks/', {
        tags: genre,
        limit: limit.toString(),
        include: 'license_downloads musicinfo',
        audioformat: 'mp31'
      });

      return data.results;
    } catch (error) {
      console.error('Get tracks by genre error:', error);
      throw new Error('Failed to load genre tracks. Please try again.');
    }
  }

  static clearCache() {
    apiCache.clear();
  }
}

export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const getJamendoTrackUrl = (trackId: string): string => {
  return `https://www.jamendo.com/track/${trackId}`;
};

export const getJamendoArtistUrl = (artistId: string): string => {
  return `https://www.jamendo.com/artist/${artistId}`;
};
