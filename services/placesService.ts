import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Place, 
  PlaceSearchRequest, 
  PlaceSearchResponse, 
  PlaceDetailsRequest,
  LocationCoords 
} from '@/types/place';

// Google Places API (New) の設定
// 本番環境では環境変数やセキュアストレージを使用すること
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）

interface CachedPlace {
  data: Place;
  timestamp: number;
}

interface CachedSearchResult {
  data: Place[];
  timestamp: number;
  searchKey: string;
}

class PlacesService {
  private placesCache = new Map<string, CachedPlace>();
  private searchCache = new Map<string, CachedSearchResult>();

  // APIキーの検証とデバッグ情報を取得
  validateApiKey(): { isValid: boolean; key: string; issues: string[] } {
    const key = GOOGLE_PLACES_API_KEY;
    const issues: string[] = [];
    
    if (!key) {
      issues.push('APIキーが空または未定義です');
    } else if (key === 'your_actual_api_key_here') {
      issues.push('APIキーがプレースホルダーのままです');
    } else if (key.length < 30) {
      issues.push('APIキーが短すぎます');
    }
    
    return {
      isValid: issues.length === 0,
      key: key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'NONE',
      issues
    };
  }

  async searchNearbyBathhouses(
    location: LocationCoords,
    radius: number = 5000, // 5km default
    keyword?: string
  ): Promise<Place[]> {
    const apiValidation = this.validateApiKey();
    
    if (!apiValidation.isValid) {
      console.warn('Google Places API key issues:', apiValidation.issues);
      console.warn('API key preview:', apiValidation.key);
      console.warn('Using mock data instead');
      return this.getMockPlaces(location);
    }
    
    console.log('🔍 Places API 検索を開始します...');
    console.log('📍 位置情報:', location);
    console.log('📐 検索範囲:', radius, 'メートル');
    console.log('🔑 APIキー:', apiValidation.key);

    const searchKey = `${location.latitude},${location.longitude},${radius},${keyword || ''}`;
    
    // キャッシュを最初に確認
    const cached = this.searchCache.get(searchKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
      return cached.data;
    }

    try {
      // 複数の検索方法を試す
      console.log('🔍 複数の検索方法で銭湯を探索中...');
      
      const [nearbyResults, textResults] = await Promise.allSettled([
        this.searchWithPlacesApi(location, radius, keyword),
        this.searchWithTextQuery(location, '銭湯'),
      ]);

      let allPlaces: Place[] = [];
      
      if (nearbyResults.status === 'fulfilled') {
        console.log(`📍 Nearby検索: ${nearbyResults.value.length}件`);
        allPlaces = [...allPlaces, ...nearbyResults.value];
      } else {
        console.warn('❌ Nearby検索失敗:', nearbyResults.reason);
      }
      
      if (textResults.status === 'fulfilled') {
        console.log(`🔤 Text検索: ${textResults.value.length}件`);
        allPlaces = [...allPlaces, ...textResults.value];
      } else {
        console.warn('❌ Text検索失敗:', textResults.reason);
      }
      
      // 重複除去
      const uniquePlaces = allPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );
      
      console.log(`📊 合計検索結果: ${uniquePlaces.length}件の施設を発見`);
      
      // キャッシュに保存
      this.searchCache.set(searchKey, {
        data: uniquePlaces,
        timestamp: Date.now(),
        searchKey,
      });
      
      return uniquePlaces;
    } catch (error) {
      console.error('❌ Error searching nearby bathhouses:', error);
      console.error('🔄 Falling back to mock data');
      return this.getMockPlaces(location);
    }
  }

  private async searchWithPlacesApi(location: LocationCoords, radius: number, keyword?: string): Promise<Place[]> {
    const requestBody: any = {
      // Places API (New) でサポートされているタイプのみ使用
      includedTypes: ['spa'],
      maxResultCount: 20, // Places API (New) の上限
      locationRestriction: {
        circle: {
          center: { 
            latitude: location.latitude, 
            longitude: location.longitude 
          },
          radius: radius,
        },
      },
      languageCode: 'ja',
    };

    // キーワードがある場合のみ追加（Places API (New)では別の方法でキーワード検索）
    if (keyword) {
      // 注: Places API (New) のsearchNearbyでは直接的なテキスト検索は制限されているため
      // includedTypesとlocationRestrictionで絞り込みを行う
      console.log(`🔍 キーワード指定: ${keyword} (includedTypesで絞り込み)`);
    }

    const requestUrl = `${PLACES_API_BASE_URL}/places:searchNearby`;
    console.log('🌐 Places API リクエストURL:', requestUrl);
    console.log('📦 リクエストボディ:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.id,places.types',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 レスポンスステータス:', response.status);
    console.log('📡 レスポンスヘッダー:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error Response:', errorText);
      
      // 詳細なエラー情報を提供
      if (response.status === 403) {
        console.error('🔑 PERMISSION_DENIED - 以下を確認してください:');
        console.error('   - Google Cloud Console で Places API (New) が有効化されているか');
        console.error('   - APIキーの制限設定が正しいか');
        console.error('   - 請求設定が完了しているか');
      }
      
      throw new Error(`Places API HTTP error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 APIレスポンス:', JSON.stringify(data, null, 2));

    // Places API (New) のレスポンスを標準形式に変換
    const places = this.convertPlacesApiResponse(data);
    
    return places;
  }

  private async searchWithTextQuery(location: LocationCoords, query: string): Promise<Place[]> {
    const requestBody = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { 
            latitude: location.latitude, 
            longitude: location.longitude 
          },
          radius: 5000,
        },
      },
      languageCode: 'ja',
      maxResultCount: 20,
    };

    const requestUrl = `${PLACES_API_BASE_URL}/places:searchText`;
    console.log('🔤 Text検索URL:', requestUrl);
    console.log('📦 Text検索ボディ:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.id,places.types',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 Text検索レスポンスステータス:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Text検索エラー:', errorText);
      throw new Error(`Text search error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Text検索APIレスポンス:', JSON.stringify(data, null, 2));

    return this.convertPlacesApiResponse(data);
  }

  private convertPlacesApiResponse(apiResponse: any): Place[] {
    if (!apiResponse.places || !Array.isArray(apiResponse.places)) {
      console.log('🔄 Places API response に places がありません、空の配列を返します');
      return [];
    }

    const places = apiResponse.places.map((place: any) => ({
      place_id: place.id || '',
      name: place.displayName?.text || place.displayName || 'Unknown',
      formatted_address: place.formattedAddress || '',
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      },
      rating: place.rating || undefined,
      user_ratings_total: place.userRatingCount || undefined,
      price_level: place.priceLevel || undefined,
      types: place.types || [],
      vicinity: place.formattedAddress?.split(',')[0] || '',
    }));

    // デバッグ: フィルタリングなしで全結果を表示
    console.log('🔍 Places API が返した全ての施設:');
    places.forEach((place, index) => {
      console.log(`${index + 1}. ${place.name} (types: ${place.types.join(', ')}) - ${place.formatted_address}`);
    });
    
    // 銭湯・温泉・サウナ関連の施設のみをフィルタリング
    const filteredPlaces = places.filter((place: Place) => this.isBathhouseRelated(place));
    
    console.log(`🎯 フィルタリング後: ${filteredPlaces.length}件 / ${places.length}件`);
    
    return filteredPlaces;
  }

  private isBathhouseRelated(place: Place): boolean {
    const name = place.name.toLowerCase();
    const address = place.formatted_address.toLowerCase();
    
    console.log(`🔍 判定中: ${place.name} (types: ${place.types.join(', ')})`);
    
    // 明確に除外すべき施設タイプ（最小限に限定）
    const excludeKeywords = [
      '公園', 'park', '文化園', 'zoo', '動物園', '美術館', 'museum', 
      '博物館', '図書館', 'library', '学校', 'school', '大学', 'university',
      '駅', 'station', '空港', 'airport', 'ショッピングモール', '百貨店'
    ];
    
    // 除外キーワードが含まれている場合は除外
    const hasExcludeKeyword = excludeKeywords.some(keyword => 
      name.includes(keyword) || address.includes(keyword)
    );
    
    if (hasExcludeKeyword) {
      console.log(`🚫 除外: ${place.name} (除外キーワード: ${excludeKeywords.find(k => name.includes(k) || address.includes(k))})`);
      return false;
    }
    
    // Places API (New) で spa または health タイプで検索しているので、
    // 除外キーワードがなければ基本的に含める
    console.log(`✅ 含める: ${place.name} (spa/healthタイプで除外条件なし)`);
    return true;
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not configured');
      return null;
    }

    // Check cache first
    const cached = this.placesCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
      return cached.data;
    }

    try {
      const fields = [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'rating',
        'user_ratings_total',
        'price_level',
        'photos',
        'opening_hours',
        'formatted_phone_number',
        'international_phone_number',
        'website',
        'types',
        'reviews',
      ].join(',');

      const queryParams = new URLSearchParams({
        place_id: placeId,
        fields,
        key: GOOGLE_PLACES_API_KEY,
        language: 'ja',
      });

      const response = await fetch(
        `${PLACES_API_BASE_URL}/details/json?${queryParams}`
      );

      if (!response.ok) {
        throw new Error(`Place details request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Place details API error: ${data.status}`);
      }

      const place: Place = data.result;

      // Cache the result
      this.placesCache.set(placeId, {
        data: place,
        timestamp: Date.now(),
      });

      return place;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  async getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string | null> {
    if (!GOOGLE_PLACES_API_KEY || !photoReference) {
      return null;
    }

    const queryParams = new URLSearchParams({
      photo_reference: photoReference,
      maxwidth: maxWidth.toString(),
      key: GOOGLE_PLACES_API_KEY,
    });

    return `${PLACES_API_BASE_URL}/photo?${queryParams}`;
  }

  private getMockPlaces(location: LocationCoords): Place[] {
    // Mock data for development and fallback
    return [
      {
        place_id: 'mock_1',
        name: '大江戸温泉物語',
        formatted_address: '東京都江東区青海2-6-3',
        geometry: {
          location: {
            lat: location.latitude + 0.01,
            lng: location.longitude + 0.01,
          },
        },
        rating: 4.2,
        user_ratings_total: 1250,
        price_level: 3,
        types: ['spa', 'tourist_attraction'],
        vicinity: '青海',
      },
      {
        place_id: 'mock_2',
        name: '湯乃泉 草加健康センター',
        formatted_address: '埼玉県草加市稲荷3-1-20',
        geometry: {
          location: {
            lat: location.latitude - 0.02,
            lng: location.longitude + 0.015,
          },
        },
        rating: 4.5,
        user_ratings_total: 890,
        price_level: 2,
        types: ['spa', 'health'],
        vicinity: '草加市',
      },
      {
        place_id: 'mock_3',
        name: '桜湯',
        formatted_address: '東京都台東区谷中3-10-5',
        geometry: {
          location: {
            lat: location.latitude + 0.005,
            lng: location.longitude - 0.01,
          },
        },
        rating: 4.0,
        user_ratings_total: 420,
        price_level: 1,
        types: ['spa'],
        vicinity: '谷中',
      },
    ];
  }

  formatPriceLevel(priceLevel?: number): string {
    if (!priceLevel) return '料金不明';
    
    switch (priceLevel) {
      case 1:
        return '¥500-¥800';
      case 2:
        return '¥800-¥1,500';
      case 3:
        return '¥1,500-¥3,000';
      case 4:
        return '¥3,000以上';
      default:
        return '料金不明';
    }
  }

  isOpenNow(openingHours?: { open_now: boolean }): boolean {
    return openingHours?.open_now ?? false;
  }

  async clearCache(): Promise<void> {
    this.placesCache.clear();
    this.searchCache.clear();
    
    try {
      await AsyncStorage.removeItem('places_cache');
      await AsyncStorage.removeItem('search_cache');
    } catch (error) {
      console.error('Error clearing places cache:', error);
    }
  }

  // Save cache to persistent storage
  async saveCacheToStorage(): Promise<void> {
    try {
      const placesData = Object.fromEntries(this.placesCache.entries());
      const searchData = Object.fromEntries(this.searchCache.entries());
      
      await AsyncStorage.setItem('places_cache', JSON.stringify(placesData));
      await AsyncStorage.setItem('search_cache', JSON.stringify(searchData));
    } catch (error) {
      console.error('Error saving places cache:', error);
    }
  }

  // Load cache from persistent storage
  async loadCacheFromStorage(): Promise<void> {
    try {
      const placesData = await AsyncStorage.getItem('places_cache');
      const searchData = await AsyncStorage.getItem('search_cache');
      
      if (placesData) {
        const parsed = JSON.parse(placesData);
        this.placesCache = new Map(Object.entries(parsed));
      }
      
      if (searchData) {
        const parsed = JSON.parse(searchData);
        this.searchCache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading places cache:', error);
    }
  }

}

export const placesService = new PlacesService();