import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { LocationPermissionStatus } from '@/types/place';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private static readonly CACHE_KEY = 'cached_location';
  private static readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10分間有効

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status as 'granted' | 'denied' | 'restricted' | 'undetermined',
      };
    } catch (error) {
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      };
    }
  }

  async getCurrentLocation(useCache: boolean = true): Promise<LocationCoords> {
    // キャッシュされた位置情報を確認（高速化）
    if (useCache) {
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        console.log('⚡ キャッシュされた位置情報を使用');
        return cachedLocation;
      }
    }

    const permission = await this.requestLocationPermission();
    
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        this.showLocationSettingsAlert();
      }
      throw new Error('位置情報の許可が必要です');
    }

    try {
      console.log('📍 GPS位置情報を取得中...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // High → Balanced（高速化）
        timeInterval: 3000, // 10000ms → 3000ms（高速化）
        distanceInterval: 50, // 10m → 50m（高速化）
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };

      // 位置情報をキャッシュに保存
      await this.cacheLocation(coords);
      
      return coords;
    } catch (error) {
      console.warn('❌ GPS取得失敗、前回の位置情報を確認中...', error);
      
      // GPS失敗時は前回の位置情報を使用
      const cachedLocation = await this.getCachedLocation();
      if (cachedLocation) {
        console.log('⚡ 前回の位置情報を使用してフォールバック');
        return cachedLocation;
      }
      
      throw new Error(`位置情報の取得に失敗しました: ${error}`);
    }
  }

  async startWatchingLocation(
    onLocationChange: (location: LocationCoords) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          onLocationChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
          });
        }
      );
      
      // Store subscription for cleanup
      this.locationSubscription = subscription;
    } catch (error) {
      onError?.(new Error(`位置情報の監視に失敗しました: ${error}`));
    }
  }

  stopWatchingLocation(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  private showLocationSettingsAlert(): void {
    Alert.alert(
      '位置情報が無効です',
      '周辺の銭湯を検索するには位置情報を有効にしてください。設定画面で許可してください。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '設定を開く',
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 距離（km）
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else {
      return `${distanceKm.toFixed(1)}km`;
    }
  }

  private async getCachedLocation(): Promise<LocationCoords | null> {
    try {
      const cached = await AsyncStorage.getItem(LocationService.CACHE_KEY);
      if (!cached) return null;

      const { location, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // キャッシュが有効期限内かチェック
      if (now - timestamp < LocationService.CACHE_EXPIRY) {
        return location;
      }
      
      // 期限切れの場合は削除
      await AsyncStorage.removeItem(LocationService.CACHE_KEY);
      return null;
    } catch (error) {
      console.warn('位置情報キャッシュの読み込みに失敗:', error);
      return null;
    }
  }

  private async cacheLocation(location: LocationCoords): Promise<void> {
    try {
      const cacheData = {
        location,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LocationService.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('位置情報のキャッシュに失敗:', error);
    }
  }
}

export const locationService = new LocationService();