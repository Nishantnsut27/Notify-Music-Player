const FORBIDDEN_KEYWORDS = [
  'short', 'shorts', 'podcast', 'podcasts', 'gaming', 'gameplay', 'walkthrough',
  'tutorial', 'how to', 'interview', 'movie', 'reaction', 'reacting', 'covers',
  'karaoke', 'fan edit', 'fanedit', 'slowed', 'reverb', 'nightcore', '8d',
  'bass boost', 'bassboosted', 'meme', 'status', 'compilation', 'unboxing',
  'vlog', 'episode', 'ep.', 'ch2', 'trailer', 'teaser'
];

export function isMusicContent(
  title: string,
  artistName?: string,
  durationSeconds?: number
): boolean {
  if (!title) return false;
  const lowerTitle = title.toLowerCase();
  const lowerArtist = (artistName || '').toLowerCase();

  if (durationSeconds && (durationSeconds < 25 || durationSeconds > 1200)) {
    return false;
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerTitle) || regex.test(lowerArtist)) {
      return false;
    }
  }

  return true;
}
