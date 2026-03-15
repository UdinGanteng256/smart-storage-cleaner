import { FileNode, FileConnection } from '../types';

interface CacheEntry {
  nodes: FileNode[];
  connections: FileConnection[];
  timestamp: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, nodes: FileNode[], connections: FileConnection[]): void {
    this.cache.set(key, {
      nodes,
      connections,
      timestamp: Date.now()
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
