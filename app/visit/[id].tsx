import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  X,
  Bath, 
  Star, 
  Clock, 
  MapPin, 
  Calendar,
  Search,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVisitStore, Visit } from '@/store/visitStore';
import { format } from 'date-fns';
import FacilitySearch from '@/components/FacilitySearch';
import PhotoPicker from '@/components/PhotoPicker';
import PhotoGallery from '@/components/PhotoGallery';
import { Place } from '@/types/place';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FacilityWithDistance extends Place {
  distance?: string;
  distanceKm?: number;
}

export default function VisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getVisitById, updateVisit } = useVisitStore();
  
  const visit = getVisitById(id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedVisit, setEditedVisit] = useState<Partial<Visit>>({});
  const [facilitySearchVisible, setFacilitySearchVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithDistance | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visit) {
      setEditedVisit(visit);
      // 訪問時間を解析してDate型に変換
      const [startTimeStr, endTimeStr] = visit.visitTime.split('-');
      if (startTimeStr && endTimeStr) {
        const startTime = new Date();
        const endTime = new Date();
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
        
        startTime.setHours(startHour, startMinute, 0, 0);
        endTime.setHours(endHour, endMinute, 0, 0);
        
        setTempStartTime(startTime);
        setTempEndTime(endTime);
      }
    }
  }, [visit]);

  if (!visit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>記録が見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (!editedVisit.bathName?.trim()) {
      Alert.alert('エラー', '銭湯名を入力してください');
      return;
    }

    updateVisit(id, {
      ...editedVisit,
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
    });
    
    setIsEditing(false);
    setSelectedFacility(null);
    Alert.alert('完了', '記録を更新しました');
  };

  const handleCancel = () => {
    setEditedVisit(visit);
    setSelectedFacility(null);
    setIsEditing(false);
  };

  const handleFacilitySelect = (facility: FacilityWithDistance) => {
    setSelectedFacility(facility);
    setEditedVisit(prev => ({
      ...prev,
      bathName: facility.name,
    }));
    setFacilitySearchVisible(false);
  };

  const formatTime = (date: Date) => {
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const validateTimeRange = (start: Date, end: Date) => {
    return start.getTime() < end.getTime();
  };

  const handleTempStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempStartTime(selectedTime);
      const errorMessage = !validateTimeRange(selectedTime, tempEndTime) ? 
        `開始時間は終了時間（${formatTime(tempEndTime)}）より前に設定してください` : null;
      setTimeValidationError(errorMessage);
    }
  };

  const handleTempEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempEndTime(selectedTime);
      const errorMessage = !validateTimeRange(tempStartTime, selectedTime) ? 
        `終了時間は開始時間（${formatTime(tempStartTime)}）より後に設定してください` : null;
      setTimeValidationError(errorMessage);
    }
  };

  const handleTimeConfirm = () => {
    if (!timeValidationError) {
      const visitTime = `${formatTime(tempStartTime)}-${formatTime(tempEndTime)}`;
      setEditedVisit(prev => ({
        ...prev,
        visitTime,
      }));
    }
    setActiveTimePicker(null);
  };

  const handleTimeCancel = () => {
    setActiveTimePicker(null);
    setTimeValidationError(null);
  };

  const handleTimePickerOpen = (type: 'start' | 'end') => {
    setTimeValidationError(null);
    setActiveTimePicker(activeTimePicker === type ? null : type);
  };

  const handlePhotosChange = (photos: string[]) => {
    setEditedVisit(prev => ({ ...prev, photos }));
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>記録詳細</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <Save size={24} color="#0ea5e9" />
          ) : (
            <Edit2 size={24} color="#0ea5e9" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isEditing ? (
          // 表示モード
          <View style={styles.detailCard}>
            <View style={styles.titleSection}>
              <Bath size={24} color="#0ea5e9" />
              <Text style={styles.bathName}>{visit.bathName}</Text>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Calendar size={20} color="#64748b" />
                <Text style={styles.detailLabel}>訪問日</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(visit.date), 'yyyy年MM月dd日')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Clock size={20} color="#64748b" />
                <Text style={styles.detailLabel}>訪問時間</Text>
                <Text style={styles.detailValue}>{visit.visitTime}</Text>
              </View>

              {visit.address && (
                <View style={styles.detailRow}>
                  <MapPin size={20} color="#64748b" />
                  <Text style={styles.detailLabel}>住所</Text>
                  <Text style={styles.detailValue}>{visit.address}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Star size={20} color="#fbbf24" />
                <Text style={styles.detailLabel}>評価</Text>
                <View style={styles.ratingContainer}>
                  {renderStars(visit.rating)}
                  <Text style={styles.ratingText}>{visit.rating}.0</Text>
                </View>
              </View>
            </View>

            {visit.comment && (
              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>コメント</Text>
                <Text style={styles.commentText}>{visit.comment}</Text>
              </View>
            )}

            {visit.facilities && visit.facilities.length > 0 && (
              <View style={styles.facilitiesSection}>
                <Text style={styles.sectionTitle}>設備</Text>
                <View style={styles.facilitiesGrid}>
                  {visit.facilities.map((facility, index) => (
                    <View key={index} style={styles.facilityTag}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {visit.ratings && (
              <View style={styles.detailedRatingsSection}>
                <Text style={styles.sectionTitle}>詳細評価</Text>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingItemLabel}>清潔感</Text>
                  {renderStars(visit.ratings.cleanliness)}
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingItemLabel}>混雑度</Text>
                  {renderStars(visit.ratings.crowdedness)}
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingItemLabel}>接客</Text>
                  {renderStars(visit.ratings.service)}
                </View>
                <View style={styles.ratingItem}>
                  <Text style={styles.ratingItemLabel}>居心地</Text>
                  {renderStars(visit.ratings.comfort)}
                </View>
              </View>
            )}

            {visit.photos && visit.photos.length > 0 && (
              <PhotoGallery
                photos={visit.photos}
                title="写真"
                showTitle={true}
              />
            )}
          </View>
        ) : (
          // 編集モード
          <View style={styles.editCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>銭湯名</Text>
              <View style={styles.facilityInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.facilityInput]}
                  value={editedVisit.bathName || ''}
                  onChangeText={(text) => setEditedVisit(prev => ({ ...prev, bathName: text }))}
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
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>訪問時間</Text>
              <View style={styles.timeButtonsRow}>
                <TouchableOpacity
                  style={[styles.timePickerButton, { flex: 1 }]}
                  onPress={() => handleTimePickerOpen('start')}
                >
                  <Clock size={16} color="#0ea5e9" />
                  <Text style={styles.timePickerButtonText}>
                    開始: {formatTime(tempStartTime)}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.timeSeparator}>-</Text>
                <TouchableOpacity
                  style={[styles.timePickerButton, { flex: 1 }]}
                  onPress={() => handleTimePickerOpen('end')}
                >
                  <Clock size={16} color="#0ea5e9" />
                  <Text style={styles.timePickerButtonText}>
                    終了: {formatTime(tempEndTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              {activeTimePicker === 'start' && (
                <View style={styles.timePickerWrapper}>
                  <DateTimePicker
                    value={tempStartTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTempStartTimeChange}
                    themeVariant="light"
                    textColor="#1e293b"
                    style={styles.timePicker}
                  />
                  {timeValidationError && (
                    <Text style={styles.errorText}>{timeValidationError}</Text>
                  )}
                  <View style={styles.timePickerButtonsRow}>
                    <TouchableOpacity
                      style={styles.timePickerCancelButton}
                      onPress={handleTimeCancel}
                    >
                      <Text style={styles.timePickerCancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timePickerConfirmButton,
                        timeValidationError && styles.timePickerConfirmButtonDisabled
                      ]}
                      onPress={handleTimeConfirm}
                      disabled={!!timeValidationError}
                    >
                      <Text style={styles.timePickerConfirmButtonText}>決定</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {activeTimePicker === 'end' && (
                <View style={styles.timePickerWrapper}>
                  <DateTimePicker
                    value={tempEndTime}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={handleTempEndTimeChange}
                    themeVariant="light"
                    textColor="#1e293b"
                    style={styles.timePicker}
                  />
                  {timeValidationError && (
                    <Text style={styles.errorText}>{timeValidationError}</Text>
                  )}
                  <View style={styles.timePickerButtonsRow}>
                    <TouchableOpacity
                      style={styles.timePickerCancelButton}
                      onPress={handleTimeCancel}
                    >
                      <Text style={styles.timePickerCancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.timePickerConfirmButton,
                        timeValidationError && styles.timePickerConfirmButtonDisabled
                      ]}
                      onPress={handleTimeConfirm}
                      disabled={!!timeValidationError}
                    >
                      <Text style={styles.timePickerConfirmButtonText}>決定</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>評価</Text>
              {renderStars(editedVisit.rating || 5, (star) => 
                setEditedVisit(prev => ({ ...prev, rating: star }))
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>コメント</Text>
              <TextInput
                style={[styles.textInput, styles.commentInput]}
                value={editedVisit.comment || ''}
                onChangeText={(text) => setEditedVisit(prev => ({ ...prev, comment: text }))}
                placeholder="感想を入力..."
                multiline
                numberOfLines={5}
              />
            </View>

            <PhotoPicker
              photos={editedVisit.photos || []}
              onPhotosChange={handlePhotosChange}
              maxPhotos={5}
            />

            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bathName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  commentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  commentText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  facilitiesSection: {
    marginBottom: 24,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityTag: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  facilityText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  detailedRatingsSection: {
    marginBottom: 24,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingItemLabel: {
    fontSize: 16,
    color: '#64748b',
    minWidth: 80,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
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
  },
  timeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    gap: 8,
  },
  timePickerButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  timePickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
    maxWidth: '100%',
    height: 120,
  },
  timePickerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  timePickerCancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerConfirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    alignItems: 'center',
  },
  timePickerConfirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  timePickerCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  timePickerConfirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  commentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  editButtons: {
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
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});