export interface QualityUrl {
  quality: string;
  url: string;
}

export function extractBestImage(imageSource: string | QualityUrl[] | undefined | null, fallback = '/placeholder-album.svg'): string {
  if (!imageSource) return fallback;
  if (typeof imageSource === 'string') return imageSource;
  if (Array.isArray(imageSource) && imageSource.length > 0) {
    const highQuality = imageSource.find(img => img.quality === '500x500');
    if (highQuality?.url) return highQuality.url;
    const medQuality = imageSource.find(img => img.quality === '150x150');
    if (medQuality?.url) return medQuality.url;
    return imageSource[imageSource.length - 1].url || fallback;
  }
  return fallback;
}

export function extractBestAudioUrl(downloadUrlSource: string | QualityUrl[] | undefined | null, fallback = ''): string {
  if (!downloadUrlSource) return fallback;
  if (typeof downloadUrlSource === 'string') return downloadUrlSource;
  if (Array.isArray(downloadUrlSource) && downloadUrlSource.length > 0) {
    const q320 = downloadUrlSource.find(audio => audio.quality === '320kbps');
    if (q320?.url) return q320.url;
    const q160 = downloadUrlSource.find(audio => audio.quality === '160kbps');
    if (q160?.url) return q160.url;
    const q96 = downloadUrlSource.find(audio => audio.quality === '96kbps');
    if (q96?.url) return q96.url;
    return downloadUrlSource[downloadUrlSource.length - 1].url || fallback;
  }
  return fallback;
}
