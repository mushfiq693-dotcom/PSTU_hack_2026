interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache {
  private static store = new Map<string, CacheEntry<any>>();

  /**
   * Retrieves a cached value if not expired
   */
  public static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stores a value in memory cache with TTL (in seconds)
   */
  public static set<T>(key: string, data: T, ttlSeconds: number = 30): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiresAt });
  }

  /**
   * Deletes a specific cache key
   */
  public static delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidates keys matching a prefix or pattern (e.g. 'users:', 'wallets:', 'ledger:')
   */
  public static invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clears entire memory cache
   */
  public static clear(): void {
    this.store.clear();
  }
}
