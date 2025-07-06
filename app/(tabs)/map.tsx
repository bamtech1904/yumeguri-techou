import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { MapPin, Search, Star, Navigation } from 'lucide-react-native';

interface BathFacility {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  price: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const mockBathFacilities: BathFacility[] = [
  {
    id: '1',
    name: '大江戸温泉物語',
    address: '東京都江東区青海2-6-3',
    rating: 4.2,
    distance: '1.2km',
    price: '¥2,900',
    coordinates: { latitude: 35.6267, longitude: 139.7826 },
  },
  {
    id: '2',
    name: '湯乃泉 草加健康センター',
    address: '埼玉県草加市稲荷3-1-20',
    rating: 4.5,
    distance: '2.3km',
    price: '¥800',
    coordinates: { latitude: 35.8267, longitude: 139.8026 },
  },
  {
    id: '3',
    name: '桜湯',
    address: '東京都台東区谷中3-10-5',
    rating: 4.0,
    distance: '3.1km',
    price: '¥520',
    coordinates: { latitude: 35.7267, longitude: 139.7626 },
  },
  {
    id: '4',
    name: '金春湯',
    address: '東京都新宿区西新宿7-17-11',
    rating: 4.3,
    distance: '4.2km',
    price: '¥520',
    coordinates: { latitude: 35.6967, longitude: 139.6986 },
  },
  {
    id: '5',
    name: '天然温泉 久松湯',
    address: '東京都中央区日本橋人形町3-2-14',
    rating: 4.1,
    distance: '1.8km',
    price: '¥520',
    coordinates: { latitude: 35.6867, longitude: 139.7786 },
  },
];

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFacilities, setFilteredFacilities] = useState<BathFacility[]>(mockBathFacilities);
  const [selectedFacility, setSelectedFacility] = useState<BathFacility | null>(null);

  useEffect(() => {
    const filtered = mockBathFacilities.filter(facility =>
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFacilities(filtered);
  }, [searchQuery]);

  const handleFacilityPress = (facility: BathFacility) => {
    setSelectedFacility(facility);
  };

  const handleAddToWishlist = (facility: BathFacility) => {
    Alert.alert(
      '行きたいリストに追加',
      `${facility.name}を行きたいリストに追加しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '追加', onPress: () => {
          Alert.alert('追加完了', `${facility.name}を行きたいリストに追加しました！`);
        }},
      ]
    );
  };

  const handleGetDirections = (facility: BathFacility) => {
    Alert.alert(
      'ルート案内',
      `${facility.name}への道順を表示しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '案内開始', onPress: () => {
          Alert.alert('案内開始', 'Google Mapsでルート案内を開始します');
        }},
      ]
    );
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

  const renderFacilityItem = ({ item }: { item: BathFacility }) => (
    <TouchableOpacity
      style={styles.facilityCard}
      onPress={() => handleFacilityPress(item)}
    >
      <View style={styles.facilityHeader}>
        <MapPin size={20} color="#0ea5e9" />
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{item.name}</Text>
          <Text style={styles.facilityAddress}>{item.address}</Text>
        </View>
      </View>
      
      <View style={styles.facilityDetails}>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance}</Text>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>

      <View style={styles.facilityActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAddToWishlist(item)}
        >
          <Text style={styles.actionButtonText}>行きたいリスト</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleGetDirections(item)}
        >
          <Navigation size={16} color="#ffffff" />
          <Text style={styles.primaryButtonText}>道順</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>近くの銭湯</Text>
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

      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <MapPin size={48} color="#0ea5e9" />
          <Text style={styles.mapText}>地図表示エリア</Text>
          <Text style={styles.mapSubtext}>
            実際の実装では、ここにGoogle Mapsが表示されます
          </Text>
        </View>
      </View>

      <View style={styles.facilitiesSection}>
        <Text style={styles.sectionTitle}>
          周辺の銭湯 ({filteredFacilities.length}件)
        </Text>
        <FlatList
          data={filteredFacilities}
          renderItem={renderFacilityItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.facilitiesList}
        />
      </View>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
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
    height: 200,
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
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
    paddingHorizontal: 20,
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
});