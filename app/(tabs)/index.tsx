import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Plus, Bath, Star, Clock, MapPin, Search } from 'lucide-react-native';
import { useVisitStore } from '@/store/visitStore';
import { format } from 'date-fns';
import FacilitySearch from '@/components/FacilitySearch';
import { Place } from '@/types/place';

interface FacilityWithDistance extends Place {
  distance?: string;
  distanceKm?: number;
}

// Japanese locale configuration
LocaleConfig.locales['ja'] = {
  monthNames: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ],
  monthNamesShort: [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ],
  dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'ja';

export default function CalendarScreen() {
  const { visits, addVisit, getVisitsForMonth } = useVisitStore();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newVisit, setNewVisit] = useState({
    bathName: '',
    visitTime: '',
    rating: 5,
    comment: '',
  });
  const [facilitySearchVisible, setFacilitySearchVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithDistance | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyVisits = getVisitsForMonth(currentMonth);

  // Create marked dates for calendar
  const markedDates = visits.reduce((acc, visit) => {
    acc[visit.date] = {
      marked: true,
      dotColor: '#0ea5e9',
      customStyles: {
        container: {
          backgroundColor: '#e0f2fe',
          borderRadius: 8,
        },
        text: {
          color: '#0ea5e9',
          fontWeight: 'bold',
        },
      },
    };
    return acc;
  }, {} as any);

  const handleDatePress = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedFacility(null);
    setModalVisible(true);
  };

  const handleFacilitySelect = (facility: FacilityWithDistance) => {
    setSelectedFacility(facility);
    setNewVisit({
      ...newVisit,
      bathName: facility.name,
    });
    setFacilitySearchVisible(false);
  };

  const handleAddVisit = () => {
    if (!newVisit.bathName.trim()) {
      Alert.alert('エラー', '銭湯名を入力してください');
      return;
    }

    const visitData = {
      id: Date.now().toString(),
      date: selectedDate,
      bathName: newVisit.bathName,
      visitTime: newVisit.visitTime,
      rating: newVisit.rating,
      comment: newVisit.comment,
      createdAt: new Date().toISOString(),
      // Add facility data if available
      ...(selectedFacility && {
        address: selectedFacility.formatted_address,
        placeId: selectedFacility.place_id,
        coordinates: {
          latitude: selectedFacility.geometry.location.lat,
          longitude: selectedFacility.geometry.location.lng,
        },
        phoneNumber: selectedFacility.formatted_phone_number,
        website: selectedFacility.website,
        openingHours: selectedFacility.opening_hours,
        priceLevel: selectedFacility.price_level,
      }),
    };

    addVisit(visitData);

    setNewVisit({
      bathName: '',
      visitTime: '',
      rating: 5,
      comment: '',
    });
    setSelectedFacility(null);
    setModalVisible(false);
  };

  const getTodaysVisits = () => {
    return visits.filter(visit => visit.date === today);
  };

  const renderStars = (rating: number, onPress?: (star: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Star
              size={24}
              color={star <= rating ? '#fbbf24' : '#d1d5db'}
              fill={star <= rating ? '#fbbf24' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const todaysVisits = getTodaysVisits();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>銭湯記録</Text>
          <Text style={styles.subtitle}>今月の訪問: {monthlyVisits.length}回</Text>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDatePress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#64748b',
              selectedDayBackgroundColor: '#0ea5e9',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#0ea5e9',
              dayTextColor: '#1e293b',
              textDisabledColor: '#cbd5e1',
              dotColor: '#0ea5e9',
              selectedDotColor: '#ffffff',
              arrowColor: '#0ea5e9',
              monthTextColor: '#1e293b',
              indicatorColor: '#0ea5e9',
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
            }}
            markingType="custom"
          />
        </View>

        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>今日の記録</Text>
          {todaysVisits.length > 0 ? (
            todaysVisits.map((visit) => (
              <View key={visit.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <Bath size={20} color="#0ea5e9" />
                  <Text style={styles.visitName}>{visit.bathName}</Text>
                </View>
                <View style={styles.visitDetails}>
                  <View style={styles.visitInfo}>
                    <Clock size={16} color="#64748b" />
                    <Text style={styles.visitTime}>{visit.visitTime}</Text>
                  </View>
                  {renderStars(visit.rating)}
                </View>
                {visit.comment && (
                  <Text style={styles.visitComment}>{visit.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noVisits}>今日はまだ記録がありません</Text>
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{visits.length}</Text>
              <Text style={styles.statLabel}>総訪問数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyVisits.length}</Text>
              <Text style={styles.statLabel}>今月の訪問</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {visits.length > 0
                  ? (visits.reduce((sum, visit) => sum + visit.rating, 0) / visits.length).toFixed(1)
                  : '0.0'}
              </Text>
              <Text style={styles.statLabel}>平均評価</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setSelectedDate(today);
          setSelectedFacility(null);
          setModalVisible(true);
        }}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible && !facilitySearchVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDate ? format(new Date(selectedDate), 'yyyy年MM月dd日') : ''}の記録
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>銭湯名</Text>
              <View style={styles.facilityInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.facilityInput]}
                  value={newVisit.bathName}
                  onChangeText={(text) => setNewVisit({...newVisit, bathName: text})}
                  placeholder="例: 山田湯"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => setFacilitySearchVisible(true)}
                >
                  <Search size={20} color="#0ea5e9" />
                </TouchableOpacity>
              </View>
              {selectedFacility && (
                <View style={styles.selectedFacilityContainer}>
                  <View style={styles.selectedFacilityHeader}>
                    <MapPin size={16} color="#0ea5e9" />
                    <Text style={styles.selectedFacilityName}>{selectedFacility.name}</Text>
                  </View>
                  <Text style={styles.selectedFacilityAddress}>{selectedFacility.formatted_address}</Text>
                  {selectedFacility.distance && (
                    <Text style={styles.selectedFacilityDistance}>距離: {selectedFacility.distance}</Text>
                  )}
                  {selectedFacility.rating && (
                    <View style={styles.selectedFacilityRating}>
                      <Text style={styles.selectedFacilityRatingText}>評価: {selectedFacility.rating.toFixed(1)}</Text>
                      {renderStars(selectedFacility.rating)}
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>訪問時間</Text>
              <TextInput
                style={styles.textInput}
                value={newVisit.visitTime}
                onChangeText={(text) => setNewVisit({...newVisit, visitTime: text})}
                placeholder="例: 18:00-20:00"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>評価</Text>
              {renderStars(newVisit.rating, (star) => setNewVisit({...newVisit, rating: star}))}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>コメント</Text>
              <TextInput
                style={[styles.textInput, styles.commentInput]}
                value={newVisit.comment}
                onChangeText={(text) => setNewVisit({...newVisit, comment: text})}
                placeholder="感想を入力..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddVisit}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FacilitySearch
        visible={facilitySearchVisible}
        onClose={() => setFacilitySearchVisible(false)}
        onSelect={handleFacilitySelect}
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
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todaySection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  visitCard: {
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
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  visitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  visitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  visitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitTime: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  visitComment: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  noVisits: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  statsSection: {
    marginHorizontal: 20,
    marginBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#0ea5e9',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  facilityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    minWidth: 44, // タッチ領域を確保
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFacilityContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  selectedFacilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedFacilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
  },
  selectedFacilityAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  selectedFacilityDistance: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  selectedFacilityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFacilityRatingText: {
    fontSize: 14,
    color: '#64748b',
  },
});