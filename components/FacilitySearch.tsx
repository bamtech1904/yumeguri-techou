import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Search, MapPin, Star, X } from 'lucide-react-native';

interface Facility {
  id: string;
  name: string;
  address: string;
  rating: number;
  priceRange: string;
  distance: string;
}

interface FacilitySearchProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (facility: Facility) => void;
}

const mockFacilities: Facility[] = [
  {
    id: '1',
    name: '大江戸温泉物語',
    address: '東京都江東区青海2-6-3',
    rating: 4.2,
    priceRange: '¥2,900',
    distance: '1.2km',
  },
  {
    id: '2',
    name: '湯乃泉 草加健康センター',
    address: '埼玉県草加市稲荷3-1-20',
    rating: 4.5,
    priceRange: '¥800',
    distance: '2.3km',
  },
  {
    id: '3',
    name: '桜湯',
    address: '東京都台東区谷中3-10-5',
    rating: 4.0,
    priceRange: '¥520',
    distance: '3.1km',
  },
];

export default function FacilitySearch({ visible, onClose, onSelect }: FacilitySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>(mockFacilities);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = mockFacilities.filter(facility =>
      facility.name.toLowerCase().includes(query.toLowerCase()) ||
      facility.address.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFacilities(filtered);
  };

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

  const renderFacilityItem = ({ item }: { item: Facility }) => (
    <TouchableOpacity
      style={styles.facilityItem}
      onPress={() => onSelect(item)}
    >
      <View style={styles.facilityHeader}>
        <MapPin size={16} color="#0ea5e9" />
        <Text style={styles.facilityName}>{item.name}</Text>
      </View>
      <Text style={styles.facilityAddress}>{item.address}</Text>
      <View style={styles.facilityDetails}>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        <Text style={styles.distanceText}>{item.distance}</Text>
        <Text style={styles.priceText}>{item.priceRange}</Text>
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
        </View>

        <FlatList
          data={filteredFacilities}
          renderItem={renderFacilityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.facilitiesList}
          showsVerticalScrollIndicator={false}
        />
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
});