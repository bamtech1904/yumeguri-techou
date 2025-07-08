import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { 
  Search, 
  Calendar, 
  Bath, 
  Star, 
  Clock, 
  MapPin, 
  Edit2, 
  Trash2,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { useVisitStore, Visit } from '@/store/visitStore';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'name-asc';
type FilterOption = 'all' | 'this-month' | 'last-month' | 'this-year';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  selectedFilter: FilterOption;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedSort,
  selectedFilter,
  onSortChange,
  onFilterChange,
}) => {
  const sortOptions = [
    { value: 'date-desc' as SortOption, label: '訪問日 (新しい順)' },
    { value: 'date-asc' as SortOption, label: '訪問日 (古い順)' },
    { value: 'rating-desc' as SortOption, label: '評価 (高い順)' },
    { value: 'rating-asc' as SortOption, label: '評価 (低い順)' },
    { value: 'name-asc' as SortOption, label: '銭湯名 (あいうえお順)' },
  ];

  const filterOptions = [
    { value: 'all' as FilterOption, label: '全期間' },
    { value: 'this-month' as FilterOption, label: '今月' },
    { value: 'last-month' as FilterOption, label: '先月' },
    { value: 'this-year' as FilterOption, label: '今年' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>並び替え・フィルタ</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>並び替え</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedSort === option.value && styles.selectedFilterOption
                ]}
                onPress={() => onSortChange(option.value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedSort === option.value && styles.selectedFilterOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>期間フィルタ</Text>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedFilter === option.value && styles.selectedFilterOption
                ]}
                onPress={() => onFilterChange(option.value)}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === option.value && styles.selectedFilterOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
          >
            <Text style={styles.applyButtonText}>適用</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function HistoryScreen() {
  const router = useRouter();
  const { visits, deleteVisit } = useVisitStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('date-desc');
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const filteredAndSortedVisits = useMemo(() => {
    let filtered = visits;

    // 検索フィルタ
    if (searchQuery.trim()) {
      filtered = filtered.filter(visit =>
        visit.bathName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 期間フィルタ
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (selectedFilter) {
      case 'this-month':
        filtered = filtered.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear;
        });
        break;
      case 'last-month':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        filtered = filtered.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate.getMonth() === lastMonth && visitDate.getFullYear() === lastMonthYear;
        });
        break;
      case 'this-year':
        filtered = filtered.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate.getFullYear() === currentYear;
        });
        break;
    }

    // 並び替え
    switch (selectedSort) {
      case 'date-desc':
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'date-asc':
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'rating-desc':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'rating-asc':
        return filtered.sort((a, b) => a.rating - b.rating);
      case 'name-asc':
        return filtered.sort((a, b) => a.bathName.localeCompare(b.bathName));
      default:
        return filtered;
    }
  }, [visits, searchQuery, selectedSort, selectedFilter]);

  const handleDeleteVisit = (visitId: string, bathName: string) => {
    Alert.alert(
      '記録を削除',
      `「${bathName}」の記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => deleteVisit(visitId)
        }
      ]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
            fill={star <= rating ? '#fbbf24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderVisitItem = ({ item }: { item: Visit }) => (
    <TouchableOpacity 
      style={styles.visitCard}
      onPress={() => router.push(`/visit/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.visitHeader}>
        <View style={styles.visitTitleRow}>
          <Bath size={20} color="#0ea5e9" />
          <Text style={styles.visitName}>{item.bathName}</Text>
        </View>
        <View style={styles.visitActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/visit/${item.id}` as any)}
          >
            <Edit2 size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteVisit(item.id, item.bathName)}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.visitDetails}>
        <View style={styles.visitDetailRow}>
          <Calendar size={16} color="#64748b" />
          <Text style={styles.visitDetailText}>
            {format(new Date(item.date), 'yyyy年MM月dd日')}
          </Text>
        </View>
        
        <View style={styles.visitDetailRow}>
          <Clock size={16} color="#64748b" />
          <Text style={styles.visitDetailText}>{item.visitTime}</Text>
        </View>

        {item.address && (
          <View style={styles.visitDetailRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.visitDetailText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.visitRatingRow}>
        {renderStars(item.rating)}
        <Text style={styles.ratingText}>{item.rating}.0</Text>
      </View>

      {item.comment && (
        <Text style={styles.visitComment} numberOfLines={2}>
          {item.comment}
        </Text>
      )}

      {item.facilities && item.facilities.length > 0 && (
        <View style={styles.facilitiesContainer}>
          {item.facilities.slice(0, 3).map((facility, index) => (
            <View key={index} style={styles.facilityTag}>
              <Text style={styles.facilityText}>{facility}</Text>
            </View>
          ))}
          {item.facilities.length > 3 && (
            <Text style={styles.moreFacilities}>+{item.facilities.length - 3}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>記録履歴</Text>
        <Text style={styles.subtitle}>
          {filteredAndSortedVisits.length}件の記録
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="銭湯名、住所、コメントで検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color="#0ea5e9" />
          <ChevronDown size={16} color="#0ea5e9" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAndSortedVisits}
        renderItem={renderVisitItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bath size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>記録がありません</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? '検索条件に一致する記録がありません' : '新しい記録を追加してみましょう'}
            </Text>
          </View>
        }
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedSort={selectedSort}
        selectedFilter={selectedFilter}
        onSortChange={setSelectedSort}
        onFilterChange={setSelectedFilter}
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  filterButton: {
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
    gap: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  visitCard: {
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
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  visitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  visitDetails: {
    marginBottom: 12,
  },
  visitDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  visitDetailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  visitRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  visitComment: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  facilityTag: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  facilityText: {
    fontSize: 12,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  moreFacilities: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  selectedFilterOption: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  selectedFilterOptionText: {
    color: '#0ea5e9',
  },
  applyButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});