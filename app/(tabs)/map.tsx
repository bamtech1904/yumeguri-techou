import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import WebMapView from '@/components/WebMapView';
import { MapPin, Search, Star, Navigation, Locate, Heart } from 'lucide-react-native';
import { Place } from '@/types/place';
import { placesService } from '@/services/placesService';
import { locationService, LocationCoords } from '@/services/locationService';
import { useVisitStore } from '@/store/visitStore';
import ApiDebugInfo from '@/components/ApiDebugInfo';
import { AdBanner } from '@/components/AdBanner';

interface FacilityWithDistance extends Place {
  distance?: string;
  distanceKm?: number;
  isVisited?: boolean;
}


export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<FacilityWithDistance[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<FacilityWithDistance[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const mapRef = useRef<any>(null);
  const { visits } = useVisitStore();

  useEffect(() => {
    const filtered = facilities.filter(facility =>
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.formatted_address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFacilities(filtered);
  }, [searchQuery, facilities]);

  useEffect(() => {
    loadCurrentLocationAndFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCurrentLocationAndFacilities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      const places = await placesService.searchNearbyBathhouses(location, 5000, searchQuery);
      
      const facilitiesWithDistance = places.map(place => {
        const distanceKm = locationService.calculateDistance(
          location.latitude,
          location.longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        
        // Check if this facility has been visited
        const isVisited = visits.some(visit => 
          visit.bathName === place.name || visit.address === place.formatted_address
        );
        
        return {
          ...place,
          distance: locationService.formatDistance(distanceKm),
          distanceKm,
          isVisited,
        };
      }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      
      setFacilities(facilitiesWithDistance);
      setFilteredFacilities(facilitiesWithDistance);
    } catch (error) {
      console.error('Error loading location and facilities:', error);
      setError('周辺の銭湯を検索できませんでした。位置情報の許可を確認してください。');
    } finally {
      setLoading(false);
      setMapLoading(false);
    }
  };

  const handleFacilityPress = (facility: FacilityWithDistance) => {
    // TODO: Navigate to facility details or add to visit
    console.log('Selected facility:', facility.name);
  };

  const handleMarkerPress = (facility: FacilityWithDistance) => {
    // マーカーがタップされたときのアクション
    Alert.alert(
      facility.name,
      `${facility.formatted_address}\n\n距離: ${facility.distance}\n評価: ${facility.rating?.toFixed(1) || 'N/A'}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '地図で見る', onPress: () => handleViewOnMaps(facility) },
        { text: '記録を追加', onPress: () => handleFacilityPress(facility) },
      ]
    );
  };


  const handleAddToWishlist = (facility: FacilityWithDistance) => {
    Alert.alert(
      '行きたいリストに追加',
      `${facility.name}を行きたいリストに追加しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '追加', onPress: () => {
          // TODO: Implement wishlist functionality
          Alert.alert('追加完了', `${facility.name}を行きたいリストに追加しました！`);
        }},
      ]
    );
  };

  const handleViewOnMaps = async (facility: FacilityWithDistance) => {
    const { lat, lng } = facility.geometry.location;
    const facilityName = encodeURIComponent(facility.name);
    const coordinates = `${lat},${lng}`;
    
    // Google Maps専用のURLスキーム（施設情報表示用）
    const googleMapsAppUrls = Platform.select({
      ios: [
        // Google Maps アプリ (iOS) - 施設情報を表示
        `comgooglemaps://?q=${coordinates}(${facilityName})&zoom=16`,
        `comgooglemaps://?q=${facilityName}&center=${coordinates}`,
      ],
      android: [
        // Google Maps アプリ (Android) - 施設情報を表示
        `geo:${coordinates}?q=${coordinates}(${facilityName})`,
        `geo:0,0?q=${facilityName}`,
      ],
    }) || [];
    
    // ウェブ版Google Maps（フォールバック）- 施設の詳細情報を表示
    // より確実に表示されるURLを構築
    const googleMapsWebUrl = `https://www.google.com/maps/search/${facilityName}/@${coordinates},16z/data=!3m1!4b1`;
    
    console.log(`🗺️ ${facility.name}の情報をGoogle Mapsで表示`);
    console.log(`📍 位置: ${coordinates}`);
    console.log(`🆔 Place ID: ${facility.place_id}`);
    console.log(`🌐 ウェブURL: ${googleMapsWebUrl}`);
    
    try {
      // Google Maps アプリのURLスキームを順番に試行
      let opened = false;
      
      for (const url of googleMapsAppUrls) {
        try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            console.log(`✅ Google Mapsアプリで施設情報を表示: ${url.split('://')[0]}`);
            await Linking.openURL(url);
            opened = true;
            break;
          }
        } catch (error) {
          console.log(`❌ ${url.split('://')[0]} スキーム失敗:`, error);
          continue;
        }
      }
      
      // アプリで開けなかった場合はウェブ版を開く
      if (!opened) {
        console.log(`🌐 ウェブ版Google Mapsで施設情報を表示`);
        try {
          await Linking.openURL(googleMapsWebUrl);
        } catch (webError) {
          console.log(`❌ Google Maps Web版失敗、Google検索で代替:`, webError);
          // 最終的なフォールバック: Google検索
          const googleSearchUrl = `https://www.google.com/search?q=${facilityName}+銭湯+${encodeURIComponent(facility.formatted_address)}`;
          await Linking.openURL(googleSearchUrl);
        }
      }
    } catch (error) {
      console.error('❌ 施設情報の表示でエラー:', error);
      Alert.alert(
        '施設情報を表示できません', 
        'Google Mapsで施設情報を表示できませんでした。インターネット接続を確認してください。',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = () => {
    loadCurrentLocationAndFacilities();
  };

  const handleRecenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.recenter();
    }
  };

  const toggleView = () => {
    setShowList(!showList);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderFacilityItem = ({ item }: { item: FacilityWithDistance }) => (
    <TouchableOpacity
      style={styles.facilityCard}
      onPress={() => handleFacilityPress(item)}
    >
      <View style={styles.facilityHeader}>
        <MapPin size={20} color="#0ea5e9" />
        <View style={styles.facilityInfo}>
          <View style={styles.facilityNameContainer}>
            <Text style={styles.facilityName}>{item.name}</Text>
            {item.isVisited && (
              <View style={styles.visitedBadge}>
                <Text style={styles.visitedBadgeText}>訪問済</Text>
              </View>
            )}
          </View>
          <Text style={styles.facilityAddress}>{item.formatted_address}</Text>
        </View>
      </View>
      
      <View style={styles.facilityDetails}>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating || 0)}
          <Text style={styles.ratingText}>{item.rating?.toFixed(1) || 'N/A'}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance || ''}</Text>
        <Text style={styles.priceText}>{placesService.formatPriceLevel(item.price_level)}</Text>
      </View>

      <View style={styles.facilityActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddToWishlist(item)}
        >
          <Heart size={16} color="#ef4444" />
          <Text style={styles.actionButtonText}>行きたい</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleViewOnMaps(item)}
        >
          <Navigation size={16} color="#ffffff" />
          <Text style={styles.primaryButtonText}>地図で見る</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>近くの銭湯</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={showList ? handleRefresh : handleRecenterMap}
              disabled={loading}
            >
              <Locate size={20} color={loading ? '#9ca3af' : '#0ea5e9'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggle, showList && styles.viewToggleActive]}
              onPress={toggleView}
            >
              <Text style={[styles.viewToggleText, showList && styles.viewToggleTextActive]}>
                {showList ? '地図' : 'リスト'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => setShowDebug(true)}
            >
              <Text style={styles.debugButtonText}>🔧</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="銭湯を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 広告バナー */}
      <AdBanner />

      {!showList && (
        <View style={styles.mapContainer}>
          {mapLoading ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>地図を読み込み中...</Text>
            </View>
          ) : currentLocation ? (
            <WebMapView
              ref={mapRef}
              currentLocation={currentLocation}
              facilities={filteredFacilities}
              onMarkerPress={handleMarkerPress}
              style={styles.map}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MapPin size={48} color="#ef4444" />
              <Text style={styles.errorText}>位置情報を取得できません</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {showList && (
        <View style={styles.facilitiesSection}>
          <Text style={styles.sectionTitle}>
            周辺の銭湯 ({filteredFacilities.length}件)
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>検索中...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>再試行</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredFacilities}
              renderItem={renderFacilityItem}
              keyExtractor={(item) => item.place_id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.facilitiesList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>周辺に銭湯が見つかりませんでした</Text>
                </View>
              }
            />
          )}
        </View>
      )}
      
      <ApiDebugInfo 
        visible={showDebug} 
        onClose={() => setShowDebug(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  mapPlaceholder: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
    backgroundColor: '#e2e8f0',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContent: {
    alignItems: 'center',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  facilitiesSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  facilitiesList: {
    paddingBottom: 20,
  },
  facilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  facilityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  facilityAddress: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  facilityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  facilityActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  viewToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  viewToggleActive: {
    backgroundColor: '#0ea5e9',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  viewToggleTextActive: {
    color: '#ffffff',
  },
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  debugButtonText: {
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  facilityNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  visitedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },
  calloutContainer: {
    width: 200,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  calloutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutRatingText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  calloutPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
});