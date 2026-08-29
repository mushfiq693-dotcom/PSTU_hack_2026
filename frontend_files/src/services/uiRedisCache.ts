/**
 * ==============================================================================
 * FastPay UI Redis Cache Layer (Client-Side Key-Value Store & Asset Preloader)
 * ==============================================================================
 * Purpose:
 *   - Used EXCLUSIVELY for Frontend UI performance, instant animation transitions,
 *     avatar pre-fetching, and zero-latency tab switching.
 *   - NEVER used for backend double-entry ledgers, wallets, or financial invariants.
 *     (All financial transactions and accounting strictly remain pure PostgreSQL ACID).
 * ==============================================================================
 */

interface RedisCacheItem<T = any> {
  value: T;
  expiresAt: number | null; // null = persistent within session
  createdAt: number;
}

class ClientUiRedisCache {
  private memoryStore: Map<string, RedisCacheItem> = new Map();
  private preloadedAssets: Set<string> = new Set();

  /**
   * Redis SET: Stores a value with optional TTL (in seconds)
   */
  public set<T = any>(key: string, value: T, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryStore.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    // Also persist non-sensitive UI settings in sessionStorage for instant tab restore
    if (key.startsWith('ui:')) {
      try {
        sessionStorage.setItem(
          `redis:${key}`,
          JSON.stringify({ value, expiresAt, createdAt: Date.now() })
        );
      } catch (e) {
        // Ignore quota limits
      }
    }
  }

  /**
   * Redis GET: Retrieves a cached UI value if not expired
   */
  public get<T = any>(key: string): T | null {
    let item = this.memoryStore.get(key);

    // Fallback to sessionStorage if not found in memory
    if (!item && key.startsWith('ui:')) {
      try {
        const raw = sessionStorage.getItem(`redis:${key}`);
        if (raw) {
          item = JSON.parse(raw);
          if (item) this.memoryStore.set(key, item);
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    if (!item) return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.del(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Redis DEL: Deletes a specific key
   */
  public del(key: string): boolean {
    const existed = this.memoryStore.delete(key);
    try {
      sessionStorage.removeItem(`redis:${key}`);
    } catch (e) {}
    return existed;
  }

  /**
   * Redis EXISTS / HAS: Checks if key exists and is valid
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Redis FLUSHDB: Clears all UI cache entries
   */
  public flush(): void {
    this.memoryStore.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith('redis:')) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {}
  }

  /**
   * Redis KEYS: List keys matching prefix pattern
   */
  public keys(patternPrefix: string): string[] {
    const matched: string[] = [];
    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(patternPrefix)) {
        if (this.has(key)) matched.push(key);
      }
    }
    return matched;
  }

  /**
   * Fast Animation & Asset Pre-warmer
   * Preloads images, avatar URLs, and UI SVG assets so that Framer Motion
   * modals, drawer slides, and avatar list transitions execute in 0ms with zero pop-in.
   */
  public prewarmAssets(urls: string[]): void {
    if (typeof window === 'undefined') return;

    urls.forEach((url) => {
      if (!url || this.preloadedAssets.has(url)) return;

      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.preloadedAssets.add(url);
        this.set(`asset:loaded:${url}`, true, 3600); // cache for 1 hour
      };
    });
  }

  /**
   * Pre-warm default demo user avatars & UI assets
   */
  public prewarmDemoAvatars(): void {
    const demoAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    ];
    this.prewarmAssets(demoAvatars);
  }
}

// Global singleton instance for Frontend UI Caching
export const UiRedisCache = new ClientUiRedisCache();
