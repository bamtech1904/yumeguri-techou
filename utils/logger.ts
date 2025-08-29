/**
 * 開発環境専用ロガー
 * 本番環境では自動的に無効化される
 */

class Logger {
  private isDev = __DEV__;

  log(...args: any[]) {
    if (this.isDev) {
      console.log(...args);
    }
  }

  info(...args: any[]) {
    if (this.isDev) {
      console.info(...args);
    }
  }

  warn(...args: any[]) {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // エラーは本番環境でも出力（クラッシュ分析のため）
    console.error(...args);
  }

  debug(...args: any[]) {
    if (this.isDev) {
      console.debug(...args);
    }
  }

  // Google Places API専用のログ関数
  places(...args: any[]) {
    if (this.isDev) {
      console.log('🔍 [Places API]', ...args);
    }
  }

  // 位置情報専用のログ関数
  location(...args: any[]) {
    if (this.isDev) {
      console.log('📍 [Location]', ...args);
    }
  }

  // マップ専用のログ関数
  map(...args: any[]) {
    if (this.isDev) {
      console.log('🗺️ [Map]', ...args);
    }
  }

  // UI操作専用のログ関数
  ui(...args: any[]) {
    if (this.isDev) {
      console.log('👆 [UI]', ...args);
    }
  }
}

export const logger = new Logger();