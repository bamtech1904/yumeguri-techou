import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Place, 
  PlaceSearchRequest, 
  PlaceSearchResponse, 
  PlaceDetailsRequest,
  LocationCoords 
} from '@/types/place';
import { cacheManager } from '@/utils/cacheManager';

// Google Places API (New) の設定
// 本番環境では環境変数やセキュアストレージを使用すること
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

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
    keyword?: string
  ): Promise<Place[]> {
    const apiValidation = this.validateApiKey();
    
    if (!apiValidation.isValid) {
      console.warn('Google Places API key issues:', apiValidation.issues);
      console.warn('API key preview:', apiValidation.key);
      console.warn('Using mock data instead');
      return await this.getMockPlaces(location);
    }
    
    console.log('🔍 Places API 検索を開始します...');
    console.log('📍 位置情報:', location);
    console.log('📐 検索範囲:', radius, 'メートル');
    console.log('🔑 APIキー:', apiValidation.key);

    const searchKey = `places_search:${location.latitude},${location.longitude},${radius},${keyword || ''}`;
    
    // cacheManagerを使用してキャッシュを確認
    const cached = cacheManager.get<Place[]>(searchKey);
    if (cached) {
      return cached;
    }

    try {
      // 複数の検索方法を試す
      console.log('🔍 複数の検索方法で銭湯を探索中...');
      
      // 複数のText検索クエリで幅広く検索（春の湯を直接検索）
      const textQueries = ['銭湯', '温泉', 'サウナ', 'スパ', '湯', '風呂', '春の湯'];
      
      const searchPromises = [
        this.searchWithPlacesApi(location, radius, keyword),
        ...textQueries.map(query => this.searchWithTextQuery(location, query))
      ];
      
      const results = await Promise.allSettled(searchPromises);

      let allPlaces: Place[] = [];
      
      // 各検索結果を処理
      results.forEach((result, index) => {
        const searchType = index === 0 ? 'Nearby' : `Text(${textQueries[index - 1]})`;
        
        if (result.status === 'fulfilled') {
          allPlaces.push(...result.value);
          console.log(`✅ ${searchType}検索成功: ${result.value.length}件`);
        } else {
          console.warn(`❌ ${searchType}検索失敗:`, result.reason);
        }
      });
      
      // 重複除去
      const uniquePlaces = allPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );
      
      console.log(`📊 合計検索結果: ${uniquePlaces.length}件の施設を発見`);
      
      // cacheManagerを使用してキャッシュに保存
      await cacheManager.set(searchKey, uniquePlaces, CACHE_EXPIRY_TIME);
      
      return uniquePlaces;
    } catch (error) {
      console.error('❌ Error searching nearby bathhouses:', error);
      console.error('🔄 Falling back to mock data');
      return await this.getMockPlaces(location);
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
          radius: 10000, // 10kmに拡大
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

    // 銭湯・温泉・サウナ関連の施設のみをフィルタリング
    const filteredPlaces = places.filter((place: Place) => this.isBathhouseRelated(place));
    
    console.log(`🎯 フィルタリング後: ${filteredPlaces.length}件 / ${places.length}件`);
    
    return filteredPlaces;
  }

  private isBathhouseRelated(place: Place): boolean {
    const name = place.name.toLowerCase();
    const address = place.formatted_address.toLowerCase();
    
    // 除外キーワード
    const excludeKeywords = [
      // フィットネス・ジム関連
      'フィットネス', 'fitness', 'gym', 'ジム', 'ワークアウト', 'workout',
      'エニタイム', 'anytime', 'ライザップ', 'rizap', 'ゴールドジム', 'goldsgym',
      'joyfit', 'ジョイフィット', 'chocozap', 'chocoざっぷ',
      
      // マッサージ専門店
      'タイ古式マッサージ', 'アロマ', 'リラクゼーション', 'エステ',
      'マッサージ店', 'マッサージサロン',
      
      // その他
      '病院', 'hospital', '学校', 'school', '駅', 'station', '空港', 'airport'
    ];
    
    // 除外キーワードチェック
    const hasExcludeKeyword = excludeKeywords.some(keyword => 
      name.includes(keyword) || address.includes(keyword)
    );
    
    if (hasExcludeKeyword) {
      return false;
    }
    
    // 包含キーワード
    const includeKeywords = [
      '銭湯', '温泉', 'サウナ', '湯', '風呂', '浴場', 'バス', 'bath',
      '入浴', '湯屋', 'spa', 'onsen', 'sento', '浴室', '浴槽',
      '健康ランド', 'スーパー銭湯', '入浴施設', '日帰り温泉',
      '岩盤浴', '炭酸泉', '天然温泉', '人工温泉', '療養泉',
      'ゆ', 'yu', '湯の', '湯乃', '湯之', 'おふろ', 'お風呂',
      'せんとう', 'おんせん', 'サウナー', 'ととのう', '湯処', '湯どころ',
      'トレンド', 'trend', '春の湯', 'アサヒ', 'asahi', '21',
      'FLOOBA', 'flooba', 'フローバ', '春', 'haru',
      '露天風呂', '内湯', '大浴場', '家族風呂', '貸切風呂', '混浴',
      '源泉', 'かけ流し', '掛け流し', '循環', '加水', '加温',
      'ドライサウナ', 'スチームサウナ', 'ミストサウナ', '水風呂', '外気浴',
      'ロウリュ', 'アウフグース', 'セルフロウリュ',
      'wellness', 'ウェルネス', '癒し', '疲労回復', 'デトックス', '血行促進', '新陳代謝'
    ];
    
    const hasIncludeKeyword = includeKeywords.some(keyword => 
      name.includes(keyword) || address.includes(keyword)
    );
    
    if (hasIncludeKeyword) {
      return true;
    }
    
    // タイプベースのチェック
    const allowedTypes = ['spa', 'health', 'establishment', 'point_of_interest'];
    const problematicTypes = ['gym', 'fitness_center', 'beauty_salon', 'nail_salon'];
    
    // マッサージ専門店の除外
    const hasBathhouseTypes = place.types.some(type => 
      ['sauna', 'public_bath'].includes(type)
    );
    const hasMassageOnly = place.types.includes('massage') && !hasBathhouseTypes;
    
    if (hasMassageOnly && !hasIncludeKeyword) {
      return false;
    }
    
    const hasProblematicType = place.types.some(type => problematicTypes.includes(type));
    if (hasProblematicType) {
      return false;
    }
    
    const hasAllowedType = place.types.some(type => allowedTypes.includes(type));
    if (hasAllowedType && !hasProblematicType) {
      return true;
    }
    
    // フォールバック
    if (!hasProblematicType) {
      return true;
    }
    
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