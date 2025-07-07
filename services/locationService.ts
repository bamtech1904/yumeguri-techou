import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';
import { LocationPermissionStatus } from '@/types/place';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;

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

  async getCurrentLocation(): Promise<LocationCoords> {
    const permission = await this.requestLocationPermission();
    
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        this.showLocationSettingsAlert();
      }
      throw new Error('位置情報の許可が必要です');
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error) {
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
}

export const locationService = new LocationService();