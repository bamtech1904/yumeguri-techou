import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { 
  Place, 
  PlaceSearchRequest, 
  PlaceSearchResponse, 
  PlaceDetailsRequest,
  LocationCoords 
} from '@/types/place';
import { cacheManager } from '@/utils/cacheManager';
import { logger } from '@/utils/logger';

// Google Places API (New) の設定
// セキュアな環境変数経由でAPIキーを取得
const GOOGLE_PLACES_API_KEY = Constants.expoConfig?.extra?.googlePlacesApiKey || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）


class PlacesService {

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
    radius: number = 10000, // 10km default（拡大して春の湯を探索）
    keyword?: string,
    onProgressCallback?: (places: Place[]) => void
  ): Promise<Place[]> {
    const apiValidation = this.validateApiKey();
    
    if (!apiValidation.isValid) {
      logger.warn('Google Places API key issues:', apiValidation.issues);
      logger.warn('API key preview:', apiValidation.key);
      logger.warn('Using mock data instead');
      return await this.getMockPlaces(location);
    }
    
    logger.places('Places API 検索を開始します...');
    logger.location('位置情報:', location);
    logger.places('検索範囲:', radius, 'メートル');
    logger.places('APIキー:', apiValidation.key);

    const searchKey = `places_search:${location.latitude},${location.longitude},${radius},${keyword || ''}`;
    
    // cacheManagerを使用してキャッシュを確認
    const cached = cacheManager.get<Place[]>(searchKey);
    if (cached) {
      return cached;
    }

    try {
      logger.places('Progressive loading開始...');
      
      let allPlaces: Place[] = [];
      let apiCallCount = 0; // APIコール回数を追跡
      
      // Phase 1: 優先度の高いNearby検索を最初に実行
      console.log('🎯 Phase 1: Nearby検索実行中...');
      try {
        const nearbyPlaces = await this.searchWithPlacesApi(location, radius, keyword);
        apiCallCount++;
        allPlaces.push(...nearbyPlaces);
        
        // 最初の結果をすぐに表示
        if (nearbyPlaces.length > 0 && onProgressCallback) {
          const uniquePlaces = this.removeDuplicates(allPlaces);
          logger.places(`⚡ Phase 1完了: ${uniquePlaces.length}件を即座に表示 (API calls: ${apiCallCount})`);
          onProgressCallback(uniquePlaces);
        }
      } catch (error) {
        logger.warn('❌ Nearby検索失敗:', error);
      }
      
      // Phase 2: 重要なText検索を追加実行（段階的に表示）
      const priorityQueries = ['銭湯', '温泉', 'サウナ'];
      for (const query of priorityQueries) {
        try {
          logger.places(`🔍 Phase 2: "${query}"検索実行中...`);
          const textPlaces = await this.searchWithTextQuery(location, query);
          apiCallCount++;
          allPlaces.push(...textPlaces);
          
          // 追加結果があれば段階的に更新
          if (textPlaces.length > 0 && onProgressCallback) {
            const uniquePlaces = this.removeDuplicates(allPlaces);
            logger.places(`⚡ "${query}"検索完了: 累計${uniquePlaces.length}件 (API calls: ${apiCallCount})`);
            onProgressCallback(uniquePlaces);
          }
        } catch (error) {
          logger.warn(`❌ "${query}"検索失敗:`, error);
        }
      }
      
      // Phase 3: 残りの検索を並列実行（結果があれば最終更新）
      const remainingQueries = ['スパ', '湯', '風呂', '春の湯'];
      logger.places('🔍 Phase 3: 残りの検索を並列実行...');
      
      const remainingPromises = remainingQueries.map(query => 
        this.searchWithTextQuery(location, query).catch(error => {
          logger.warn(`❌ "${query}"検索失敗:`, error);
          return [];
        })
      );
      
      const remainingResults = await Promise.allSettled(remainingPromises);
      remainingResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPlaces.push(...result.value);
          apiCallCount++;
          logger.places(`✅ "${remainingQueries[index]}"検索完了: ${result.value.length}件`);
        }
      });
      
      // 最終結果
      const uniquePlaces = this.removeDuplicates(allPlaces);
      logger.places(`📊 最終検索結果: ${uniquePlaces.length}件の施設を発見 (Total API calls: ${apiCallCount})`);
      
      // 最終結果をProgressiveに更新（残りの検索で新しい結果があった場合）
      if (onProgressCallback) {
        onProgressCallback(uniquePlaces);
      }
      
      // キャッシュに非同期で保存（UI描画をブロックしない）
      setImmediate(async () => {
        await cacheManager.set(searchKey, uniquePlaces, CACHE_EXPIRY_TIME);
      });
      
      return uniquePlaces;
    } catch (error) {
      logger.error('❌ Error searching nearby bathhouses:', error);
      logger.warn('🔄 Falling back to mock data');
      return await this.getMockPlaces(location);
    }
  }

  private removeDuplicates(places: Place[]): Place[] {
    return places.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    );
  }

  private async searchWithPlacesApi(location: LocationCoords, radius: number, keyword?: string): Promise<Place[]> {
    const requestBody: any = {
      // Places API (New) でサポートされているタイプのみ使用
      includedTypes: ['spa'],
      maxResultCount: 10, // 20 → 10に削減（高速化）
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

    // タイムアウト設定で高速化
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.id,places.types',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
          radius: 10000, // 10kmに拡大
        },
      },
      languageCode: 'ja',
      maxResultCount: 10, // 20 → 10に削減（高速化）
    };

    const requestUrl = `${PLACES_API_BASE_URL}/places:searchText`;
    console.log('🔤 Text検索URL:', requestUrl);
    console.log('📦 Text検索ボディ:', JSON.stringify(requestBody, null, 2));

    // タイムアウト設定で高速化
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒でタイムアウト
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.id,places.types',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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

    // 銭湯・温泉・サウナ関連の施設のみをフィルタリング
    const filteredPlaces = places.filter((place: Place) => this.isBathhouseRelated(place));
    
    console.log(`🎯 フィルタリング後: ${filteredPlaces.length}件 / ${places.length}件`);
    
    return filteredPlaces;
  }

  private isBathhouseRelated(place: Place): boolean {
    const name = place.name.toLowerCase();
    const address = place.formatted_address.toLowerCase();
    
    // 高優先度包含キーワード（早期リターン）
    const highPriorityIncludeKeywords = [
      '銭湯', '温泉', 'サウナ', 'スーパー銭湯', '健康ランド',
      'spa', 'onsen', 'sento', '春の湯'
    ];
    
    // 高優先度キーワードが見つかったら即座にtrue
    for (const keyword of highPriorityIncludeKeywords) {
      if (name.includes(keyword) || address.includes(keyword)) {
        return true;
      }
    }
    
    // 除外キーワード（最適化済み）
    const excludeKeywords = [
      'フィットネス', 'fitness', 'gym', 'ジム', 
      'エニタイム', 'ライザップ', 'ゴールドジム',
      'マッサージ店', 'エステ', '病院', '学校'
    ];
    
    // 除外キーワードチェック（早期リターン）
    for (const keyword of excludeKeywords) {
      if (name.includes(keyword) || address.includes(keyword)) {
        return false;
      }
    }
    
    // 中優先度包含キーワード
    const mediumPriorityIncludeKeywords = [
      '湯', '風呂', '浴場', 'bath', '入浴', '湯屋', 
      '岩盤浴', '天然温泉', '露天風呂', '大浴場'
    ];
    
    // 中優先度キーワードチェック
    for (const keyword of mediumPriorityIncludeKeywords) {
      if (name.includes(keyword) || address.includes(keyword)) {
        return true;
      }
    }
    
    // タイプベースの高速チェック
    const problematicTypes = ['gym', 'fitness_center', 'beauty_salon'];
    if (place.types.some(type => problematicTypes.includes(type))) {
      return false;
    }
    
    // 許可されたタイプの場合はtrue
    const allowedTypes = ['spa', 'health', 'sauna', 'public_bath'];
    if (place.types.some(type => allowedTypes.includes(type))) {
      return true;
    }
    
    // マッサージ専門店の除外
    if (place.types.includes('massage')) {
      return false;
    }
    
    // デフォルトはfalse（確実な施設のみ）
    return false;
  }

  async getPlaceDetails(placeId: string): Promise<Place | null> {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not configured');
      return null;
    }

    // cacheManagerを使用してキャッシュを確認
    const cacheKey = `place_details:${placeId}`;
    const cached = cacheManager.get<Place>(cacheKey);
    if (cached) {
      return cached;
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

      // cacheManagerを使用してキャッシュに保存
      await cacheManager.set(cacheKey, place, CACHE_EXPIRY_TIME);

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

  private async getMockPlaces(location: LocationCoords): Promise<Place[]> {
    const searchKey = `places_search:${location.latitude},${location.longitude},5000,`;
    
    // キャッシュを確認
    const cached = cacheManager.get<Place[]>(searchKey);
    if (cached) {
      return cached;
    }
    // Mock data for development and fallback
    const mockData = [
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
    
    // モックデータもキャッシュに保存
    await cacheManager.set(searchKey, mockData, CACHE_EXPIRY_TIME);
    return mockData;
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
    // cacheManagerを使用しているため、特別な処理は不要
    // cacheManagerのclearを呼び出す場合は外部から実行
  }

  // 廃止: cacheManagerを使用するため不要
  async saveCacheToStorage(): Promise<void> {
    // 廃止されました（cacheManager統合済み）
  }

  // 廃止: cacheManagerを使用するため不要
  async loadCacheFromStorage(): Promise<void> {
    // 廃止されました（cacheManager統合済み）
  }

}

export const placesService = new PlacesService();