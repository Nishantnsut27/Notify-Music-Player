import { DISCOVERY_KEYWORDS } from '../config/discoveryKeywords.js';

export class DiscoveryService {
  private keywords: string[];
  private queue: string[];
  private currentIndex: number;

  constructor(customKeywords?: string[]) {
    this.keywords = customKeywords && customKeywords.length > 0 ? [...customKeywords] : [...DISCOVERY_KEYWORDS];
    this.queue = [];
    this.currentIndex = 0;
    this.shuffleQueue();
  }

  /**
   * Shuffles all discovery keywords using Fisher-Yates shuffle algorithm.
   */
  private shuffleQueue(): void {
    const arr = [...this.keywords];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.queue = arr;
    this.currentIndex = 0;
    console.log(`[DiscoveryService] Shuffled discovery queue with ${this.queue.length} keywords.`);
  }

  /**
   * Returns the next discovery keyword from the shuffle queue.
   * Re-shuffles automatically when all keywords have been consumed.
   */
  public getNextKeyword(): string {
    if (this.queue.length === 0) {
      this.shuffleQueue();
    }

    if (this.currentIndex >= this.queue.length) {
      this.shuffleQueue();
    }

    const keyword = this.queue[this.currentIndex];
    this.currentIndex++;
    return keyword;
  }

  /**
   * Returns current queue status for debugging & observability.
   */
  public getStatus(): { total: number; currentIndex: number; remaining: number } {
    return {
      total: this.queue.length,
      currentIndex: this.currentIndex,
      remaining: Math.max(0, this.queue.length - this.currentIndex)
    };
  }
}

// Singleton instance for application lifetime
export const discoveryService = new DiscoveryService();
