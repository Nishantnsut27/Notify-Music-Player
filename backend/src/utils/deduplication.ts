import { Song } from '../models/music.model.js';

const PROVIDER_PRIORITY: Record<string, number> = {
  jiosaavn: 1,
  youtube: 2,
  jamendo: 3
};

function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/official audio|official video|lyric video|remastered|version|from ".*?"/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

export function areSongsDuplicate(s1: Song, s2: Song): boolean {
  const normTitle1 = normalizeString(s1.name);
  const normTitle2 = normalizeString(s2.name);

  if (!normTitle1 || !normTitle2) return false;
  if (normTitle1 !== normTitle2) return false;

  const normArtist1 = normalizeString(s1.artist_name);
  const normArtist2 = normalizeString(s2.artist_name);

  const artistMatches =
    !normArtist1 ||
    !normArtist2 ||
    normArtist1.includes(normArtist2) ||
    normArtist2.includes(normArtist1);

  if (!artistMatches) return false;

  if (s1.duration > 0 && s2.duration > 0) {
    const durationDiff = Math.abs(s1.duration - s2.duration);
    if (durationDiff > 6) return false;
  }

  return true;
}

export function deduplicateSongs(songs: Song[]): Song[] {
  const result: Song[] = [];

  for (const song of songs) {
    const existingIndex = result.findIndex(item => areSongsDuplicate(item, song));
    if (existingIndex === -1) {
      result.push(song);
    } else {
      const existing = result[existingIndex];
      const existingPriority = PROVIDER_PRIORITY[existing.provider || ''] || 99;
      const currentPriority = PROVIDER_PRIORITY[song.provider || ''] || 99;

      if (currentPriority < existingPriority) {
        result[existingIndex] = song;
      }
    }
  }

  return result;
}

export function rankSongs(songs: Song[], query: string): Song[] {
  if (!query || !query.trim()) return songs;
  const normQuery = normalizeString(query);

  const scored = songs.map(song => {
    let score = 0;
    const normTitle = normalizeString(song.name);
    const normArtist = normalizeString(song.artist_name);

    if (normTitle === normQuery) {
      score += 100;
    } else if (normTitle.startsWith(normQuery)) {
      score += 60;
    } else if (normTitle.includes(normQuery)) {
      score += 30;
    }

    if (normArtist === normQuery) {
      score += 50;
    } else if (normArtist.includes(normQuery)) {
      score += 25;
    }

    const providerPriority = PROVIDER_PRIORITY[song.provider || ''] || 99;
    score += (10 - providerPriority);

    return { song, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(item => item.song);
}
