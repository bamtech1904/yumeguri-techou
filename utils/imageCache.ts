import { cacheManager, CacheManager } from './cacheManager';
import { Image } from 'react-native';

// React Native標準Imageを使用した実装
const ImageCacheHelper = {
  preload: (sources: any[]) => {
    sources.forEach(source => {
      if (source.uri) {
        Image.prefetch(source.uri).catch(console.warn);
      }
    });
  },
  clearDiskCache: () => Promise.resolve(),
  clearMemoryCache: () => Promise.resolve(),
  priority: {
    low: 'low',
    normal: 'normal',
    high: 'high',
  },
};

export interface ImageCacheSettings {
  maxSize: number; // MB
  quality: 'low' | 'normal' | 'high';
  thumbnailCache: boolean;
  highQualityCache: boolean;
  wifiOnlySync: boolean;
}

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private settings: ImageCacheSettings = {
    maxSize: 50, // 50MB default
    quality: 'normal',
    thumbnailCache: true,
    highQualityCache: false,
    wifiOnlySync: false,
  };

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  preloadImages(urls: string[], priority: 'low' | 'normal' | 'high' = 'normal'): void {
    try {
      const imageUrls = urls.map(url => ({ uri: url, priority }));
      ImageCacheHelper.preload(imageUrls);
    } catch (error) {
      console.warn('Error preloading images:', error);
    }
  }

  async preloadThumbnails(urls: string[]): Promise<void> {
    if (!this.settings.thumbnailCache) return;

    try {
      const thumbnailUrls = urls.map(url => ({
        uri: this.getThumbnailUrl(url),
        priority: ImageCacheHelper.priority.low,
      }));

      ImageCacheHelper.preload(thumbnailUrls);
    } catch (error) {
      console.warn('Error preloading thumbnails:', error);
    }
  }

  async preloadHighQuality(urls: string[]): Promise<void> {
    if (!this.settings.highQualityCache) return;

    try {
      const highQualityUrls = urls.map(url => ({
        uri: url,
        priority: ImageCacheHelper.priority.normal,
      }));

      ImageCacheHelper.preload(highQualityUrls);
    } catch (error) {
      console.warn('Error preloading high quality images:', error);
    }
  }

  getThumbnailUrl(originalUrl: string, width: number = 200, height: number = 200): string {
    // Google Places API の場合は maxwidth パラメータを使用
    if (originalUrl.includes('googleapis.com')) {
      const url = new URL(originalUrl);
      url.searchParams.set('maxwidth', width.toString());
      url.searchParams.set('maxheight', height.toString());
      return url.toString();
    }
    
    // その他の場合はオリジナルURLを返す
    return originalUrl;
  }

  getOptimizedImageUrl(originalUrl: string, width?: number, height?: number): string {
    switch (this.settings.quality) {
      case 'low':
        return this.getThumbnailUrl(originalUrl, width || 300, height || 300);
      case 'high':
        return originalUrl;
      default:
        return this.getThumbnailUrl(originalUrl, width || 600, height || 600);
    }
  }

  async clearImageCache(): Promise<void> {
    try {
      await ImageCacheHelper.clearDiskCache();
      await ImageCacheHelper.clearMemoryCache();
    } catch (error) {
      console.warn('Error clearing image cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    // React Native Image doesn't provide cache size info directly
    // We'll use our cache manager to track image cache sizes
    const metrics = cacheManager.getMetrics();
    return metrics.totalSize;
  }

  getSettings(): ImageCacheSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<ImageCacheSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // Update cache manager settings based on image cache settings
    if (newSettings.maxSize !== undefined) {
      await cacheManager.updateSettings({
        maxSize: newSettings.maxSize,
      });
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await cacheManager.set('image_cache_settings', this.settings);
    } catch (error) {
      console.error('Error saving image cache settings:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = cacheManager.get<ImageCacheSettings>('image_cache_settings');
      if (settings) {
        this.settings = { ...this.settings, ...settings };
      }
    } catch (error) {
      console.error('Error loading image cache settings:', error);
    }
  }

  // Cache management utilities
  async shouldCacheImage(url: string, isHighQuality: boolean = false): Promise<boolean> {
    // WiFi-only sync が有効の場合は WiFi 接続をチェック
    if (this.settings.wifiOnlySync && isHighQuality) {
      // Note: 実際の実装では react-native-netinfo を使用してネットワーク状態を確認
      return true; // 今回は簡単のため常に true を返す
    }

    // サムネイルキャッシュの設定をチェック
    if (!isHighQuality && !this.settings.thumbnailCache) {
      return false;
    }

    // 高画質キャッシュの設定をチェック
    if (isHighQuality && !this.settings.highQualityCache) {
      return false;
    }

    return true;
  }

  // 画像URL用のキャッシュキーを生成
  generateImageCacheKey(url: string, options?: { width?: number; height?: number }): string {
    const key = CacheManager.generateImageKey(url);
    if (options?.width || options?.height) {
      return `${key}:${options.width || 0}x${options.height || 0}`;
    }
    return key;
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();

// 画像キャッシュ初期化
try {
  ImageCacheHelper.clearDiskCache().catch(console.warn);
  ImageCacheHelper.clearMemoryCache().catch(console.warn);
} catch (error) {
  console.warn('Error during image cache initialization:', error);
}

export { ImageCacheHelper as FastImage };