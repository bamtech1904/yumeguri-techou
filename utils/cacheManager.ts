import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  totalSize: number;
  lastCleanup: number;
}

interface CacheSettings {
  maxSize: number; // MB
  defaultTtl: number; // milliseconds
  cleanupInterval: number; // milliseconds
  autoCleanup: boolean;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheItem<any>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalSize: 0,
    lastCleanup: Date.now(),
  };
  private settings: CacheSettings = {
    maxSize: 100, // 100MB default
    defaultTtl: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    autoCleanup: true,
  };

  private constructor() {
    this.loadCacheFromStorage();
    this.loadSettings();
    this.startAutoCleanup();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || this.settings.defaultTtl);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    this.cache.set(key, item);
    this.updateMetrics();
    
    // Auto cleanup if cache is getting too large
    if (this.settings.autoCleanup && this.shouldCleanup()) {
      await this.cleanup();
    }

    await this.saveCacheToStorage();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return item.data;
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveCacheToStorage();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      totalSize: 0,
      lastCleanup: Date.now(),
    };
    await this.saveCacheToStorage();
    await this.saveMetrics();
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Remove expired items
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // If still too large, remove oldest items
    if (this.getCurrentSize() > this.settings.maxSize * 1024 * 1024) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (this.getCurrentSize() > this.settings.maxSize * 1024 * 1024 && sortedEntries.length > 0) {
        const [key] = sortedEntries.shift()!;
        this.cache.delete(key);
      }
    }

    this.metrics.lastCleanup = now;
    this.updateMetrics();
    await this.saveCacheToStorage();
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getSettings(): CacheSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<CacheSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }

  private getCurrentSize(): number {
    let size = 0;
    for (const item of this.cache.values()) {
      size += this.estimateSize(item);
    }
    return size;
  }

  private estimateSize(item: CacheItem<any>): number {
    return JSON.stringify(item).length * 2; // Rough estimate (UTF-16)
  }

  private shouldCleanup(): boolean {
    const now = Date.now();
    const timeSinceLastCleanup = now - this.metrics.lastCleanup;
    const sizeExceeded = this.getCurrentSize() > this.settings.maxSize * 1024 * 1024;
    const timeExceeded = timeSinceLastCleanup > this.settings.cleanupInterval;
    
    return sizeExceeded || timeExceeded;
  }

  private updateMetrics(): void {
    this.metrics.totalSize = this.getCurrentSize();
  }

  private startAutoCleanup(): void {
    if (this.settings.autoCleanup) {
      setInterval(() => {
        this.cleanup();
      }, this.settings.cleanupInterval);
    }
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      await AsyncStorage.setItem('cache_data', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('cache_data');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('cache_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving cache settings:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('cache_settings');
      if (settings) {
        this.settings = { ...this.settings, ...JSON.parse(settings) };
      }
    } catch (error) {
      console.error('Error loading cache settings:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('cache_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Error saving cache metrics:', error);
    }
  }

  private async loadMetrics(): Promise<void> {
    try {
      const metrics = await AsyncStorage.getItem('cache_metrics');
      if (metrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(metrics) };
      }
    } catch (error) {
      console.error('Error loading cache metrics:', error);
    }
  }

  // Cache key utilities
  static generateKey(prefix: string, ...params: string[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  static generateLocationKey(lat: number, lng: number, radius: number): string {
    return `location:${lat.toFixed(6)}:${lng.toFixed(6)}:${radius}`;
  }

  static generatePlaceKey(placeId: string): string {
    return `place:${placeId}`;
  }

  static generateImageKey(url: string): string {
    return `image:${url}`;
  }
}

export const cacheManager = CacheManager.getInstance();