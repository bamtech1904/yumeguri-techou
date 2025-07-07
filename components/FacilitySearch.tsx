import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, MapPin, Star, X, Locate } from 'lucide-react-native';
import { Place } from '@/types/place';
import { placesService } from '@/services/placesService';
import { locationService, LocationCoords } from '@/services/locationService';

interface FacilityWithDistance extends Place {
  distance?: string;
  distanceKm?: number;
}

interface FacilitySearchProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (facility: FacilityWithDistance) => void;
}


export default function FacilitySearch({ visible, onClose, onSelect }: FacilitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<FacilityWithDistance[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<FacilityWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = facilities.filter(facility =>
      facility.name.toLowerCase().includes(query.toLowerCase()) ||
      facility.formatted_address.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFacilities(filtered);
  };

  const loadNearbyFacilities = async () => {
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
        
        return {
          ...place,
          distance: locationService.formatDistance(distanceKm),
          distanceKm,
        };
      }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      
      setFacilities(facilitiesWithDistance);
      setFilteredFacilities(facilitiesWithDistance);
    } catch (error) {
      console.error('Error loading nearby facilities:', error);
      setError('周辺の銭湯を検索できませんでした。位置情報の許可を確認してください。');
      Alert.alert(
        'エラー',
        '周辺の銭湯を検索できませんでした。位置情報の許可を確認してください。',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadNearbyFacilities();
  };

  useEffect(() => {
    if (visible && facilities.length === 0) {
      loadNearbyFacilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        if (currentLocation) {
          loadNearbyFacilities();
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setFilteredFacilities(facilities);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderFacilityItem = ({ item }: { item: FacilityWithDistance }) => (
    <TouchableOpacity
      style={styles.facilityItem}
      onPress={() => onSelect(item)}
    >
      <View style={styles.facilityHeader}>
        <MapPin size={16} color="#0ea5e9" />
        <Text style={styles.facilityName}>{item.name}</Text>
      </View>
      <Text style={styles.facilityAddress}>{item.formatted_address}</Text>
      <View style={styles.facilityDetails}>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating || 0)}
          <Text style={styles.ratingText}>{item.rating?.toFixed(1) || 'N/A'}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance || ''}</Text>
        <Text style={styles.priceText}>{placesService.formatPriceLevel(item.price_level)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>銭湯を検索</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="銭湯名または住所で検索..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Locate size={20} color={loading ? '#9ca3af' : '#0ea5e9'} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>周辺の銭湯を検索中...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNearbyFacilities}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <FlatList
            data={filteredFacilities}
            renderItem={renderFacilityItem}
            keyExtractor={(item) => item.place_id}
            contentContainerStyle={styles.facilitiesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>周辺に銭湯が見つかりませんでした</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadNearbyFacilities}>
                  <Text style={styles.retryButtonText}>再検索</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
  facilitiesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  facilityItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  facilityAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  facilityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
  },
  distanceText: {
    fontSize: 14,
    color: '#64748b',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  refreshButton: {
    padding: 8,
    marginLeft: 8,
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
    marginHorizontal: 20,
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
    marginBottom: 20,
  },
});