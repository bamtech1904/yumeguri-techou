import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Plus,
  Search,
  Clock,
  MapPin,
  Star,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { format } from 'date-fns';
import FacilitySearch from '@/components/FacilitySearch';
import PhotoPicker from '@/components/PhotoPicker';
import { Place } from '@/types/place';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FacilityWithDistance extends Place {
  distance?: string;
  distanceKm?: number;
}

export interface VisitData {
  id?: string;
  date: string;
  bathName: string;
  visitTime: string;
  startTime: Date;
  endTime: Date;
  rating: number;
  comment: string;
  photos: string[];
  // 施設データ（選択された場合）
  address?: string;
  placeId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  phoneNumber?: string;
  website?: string;
  openingHours?: any;
  priceLevel?: number;
}

interface VisitRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (visitData: VisitData) => void;
  selectedDate?: string;
  selectedFacility?: FacilityWithDistance | null;
  mode?: 'calendar' | 'map';
  title?: string;
}

export default function VisitRecordModal({
  visible,
  onClose,
  onSave,
  selectedDate,
  selectedFacility: initialSelectedFacility = null,
  mode = 'calendar',
  title,
}: VisitRecordModalProps) {
  const [visitData, setVisitData] = useState<VisitData>({
    date: selectedDate || new Date().toISOString().split('T')[0],
    bathName: '',
    visitTime: '',
    startTime: new Date(),
    endTime: new Date(),
    rating: 5,
    comment: '',
    photos: [],
  });

  const [facilitySearchVisible, setFacilitySearchVisible] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithDistance | null>(initialSelectedFacility);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 初期化
  useEffect(() => {
    if (visible) {
      const defaultStartTime = new Date();
      defaultStartTime.setHours(18, 0, 0, 0);
      const defaultEndTime = new Date();
      defaultEndTime.setHours(20, 0, 0, 0);
      
      setVisitData({
        date: selectedDate || new Date().toISOString().split('T')[0],
        bathName: initialSelectedFacility?.name || '',
        visitTime: `${formatTime(defaultStartTime)}-${formatTime(defaultEndTime)}`,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        rating: 5,
        comment: '',
        photos: [],
      });
      
      setTempStartTime(defaultStartTime);
      setTempEndTime(defaultEndTime);
      setSelectedFacility(initialSelectedFacility);
    }
  }, [visible, selectedDate, initialSelectedFacility]);

  const formatTime = (date: Date) => {
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const validateTimeRange = (start: Date, end: Date) => {
    return start.getTime() < end.getTime();
  };

  const handleFacilitySelect = (facility: FacilityWithDistance) => {
    setSelectedFacility(facility);
    setVisitData(prev => ({
      ...prev,
      bathName: facility.name,
    }));
    setFacilitySearchVisible(false);
  };

  const handleTimePickerOpen = (type: 'start' | 'end') => {
    if (type === 'start') {
      setTempStartTime(visitData.startTime);
    } else {
      setTempEndTime(visitData.endTime);
    }
    setTimeValidationError(null);
    setActiveTimePicker(activeTimePicker === type ? null : type);
  };

  const handleTempStartTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempStartTime(selectedTime);
      const errorMessage = !validateTimeRange(selectedTime, visitData.endTime) ?
        `開始時間は終了時間（${formatTime(visitData.endTime)}）より前に設定してください` : null;
      setTimeValidationError(errorMessage);
    }
  };

  const handleTempEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTempEndTime(selectedTime);
      const errorMessage = !validateTimeRange(visitData.startTime, selectedTime) ?
        `終了時間は開始時間（${formatTime(visitData.startTime)}）より後に設定してください` : null;
      setTimeValidationError(errorMessage);
    }
  };

  const handleTimeConfirm = () => {
    if (!timeValidationError) {
      if (activeTimePicker === 'start') {
        const updatedVisitData = {
          ...visitData,
          startTime: tempStartTime,
          visitTime: `${formatTime(tempStartTime)}-${formatTime(visitData.endTime)}`,
        };
        setVisitData(updatedVisitData);
      } else if (activeTimePicker === 'end') {
        const updatedVisitData = {
          ...visitData,
          endTime: tempEndTime,
          visitTime: `${formatTime(visitData.startTime)}-${formatTime(tempEndTime)}`,
        };
        setVisitData(updatedVisitData);
      }
    }
    setActiveTimePicker(null);
  };

  const handleTimeCancel = () => {
    setActiveTimePicker(null);
    setTimeValidationError(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setVisitData(prev => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  const handlePhotosChange = (photos: string[]) => {
    setVisitData(prev => ({ ...prev, photos }));
  };

  const handleSave = () => {
    if (!visitData.bathName.trim()) {
      Alert.alert('エラー', '銭湯名を入力してください');
      return;
    }

    const finalVisitData = {
      ...visitData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // 施設データを追加（選択されている場合）
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

    onSave(finalVisitData);
    onClose();
  };

  const handleCancel = () => {
    setSelectedFacility(initialSelectedFacility);
    setActiveTimePicker(null);
    setTimeValidationError(null);
    onClose();
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

  const getModalTitle = () => {
    if (title) return title;
    if (mode === 'map') return '記録を追加';
    return `${selectedDate ? format(new Date(selectedDate), 'yyyy年MM月dd日') : ''}の記録`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy年MM月dd日');
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible && !facilitySearchVisible}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>

              <ScrollView
                style={styles.modalFormContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
              >
                {/* 銭湯名 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>銭湯名</Text>
                  <View style={styles.facilityInputContainer}>
                    <TextInput
                      style={[styles.textInput, styles.facilityInput]}
                      value={visitData.bathName}
                      onChangeText={(text) =>
                        setVisitData(prev => ({ ...prev, bathName: text }))
                      }
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
                        <Text style={styles.selectedFacilityName}>
                          {selectedFacility.name}
                        </Text>
                      </View>
                      <Text style={styles.selectedFacilityAddress}>
                        {selectedFacility.formatted_address}
                      </Text>
                      {selectedFacility.distance && (
                        <Text style={styles.selectedFacilityDistance}>
                          距離: {selectedFacility.distance}
                        </Text>
                      )}
                      {selectedFacility.rating && (
                        <View style={styles.selectedFacilityRating}>
                          <Text style={styles.selectedFacilityRatingText}>
                            評価: {selectedFacility.rating.toFixed(1)}
                          </Text>
                          {renderStars(selectedFacility.rating)}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* 訪問日（マップモードの場合のみ表示） */}
                {mode === 'map' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>訪問日</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <CalendarIcon size={16} color="#0ea5e9" />
                      <Text style={styles.datePickerButtonText}>
                        {formatDate(visitData.date)}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={new Date(visitData.date)}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    )}
                  </View>
                )}

                {/* 訪問時間 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>訪問時間</Text>
                  <View style={styles.timeDisplayContainer}>
                    <View style={styles.timeButtonsRow}>
                      <TouchableOpacity
                        style={[styles.timePickerButton, { flex: 1 }]}
                        onPress={() => handleTimePickerOpen('start')}
                      >
                        <Clock size={16} color="#0ea5e9" />
                        <Text style={styles.timePickerButtonText}>
                          開始: {formatTime(visitData.startTime)}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>-</Text>
                      <TouchableOpacity
                        style={[styles.timePickerButton, { flex: 1 }]}
                        onPress={() => handleTimePickerOpen('end')}
                      >
                        <Clock size={16} color="#0ea5e9" />
                        <Text style={styles.timePickerButtonText}>
                          終了: {formatTime(visitData.endTime)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {activeTimePicker === 'start' && (
                      <View style={styles.timePickerWrapper}>
                        <Text style={styles.timePickerLabel}>開始時間を選択</Text>
                        <DateTimePicker
                          value={tempStartTime}
                          mode="time"
                          is24Hour={true}
                          display="spinner"
                          onChange={handleTempStartTimeChange}
                          style={styles.timePicker}
                          themeVariant="light"
                          textColor="#1e293b"
                        />
                        {timeValidationError && (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              {timeValidationError}
                            </Text>
                          </View>
                        )}
                        <View style={styles.timePickerButtonsRow}>
                          <TouchableOpacity
                            style={[
                              styles.timePickerActionButton,
                              styles.timePickerCancelButton,
                            ]}
                            onPress={handleTimeCancel}
                          >
                            <Text style={styles.timePickerCancelButtonText}>
                              キャンセル
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.timePickerActionButton,
                              timeValidationError
                                ? styles.timePickerConfirmButtonDisabled
                                : styles.timePickerConfirmButton,
                            ]}
                            onPress={handleTimeConfirm}
                            disabled={!!timeValidationError}
                          >
                            <Text
                              style={[
                                timeValidationError
                                  ? styles.timePickerConfirmButtonTextDisabled
                                  : styles.timePickerConfirmButtonText,
                              ]}
                            >
                              決定
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {activeTimePicker === 'end' && (
                      <View style={styles.timePickerWrapper}>
                        <Text style={styles.timePickerLabel}>終了時間を選択</Text>
                        <DateTimePicker
                          value={tempEndTime}
                          mode="time"
                          is24Hour={true}
                          display="spinner"
                          onChange={handleTempEndTimeChange}
                          style={styles.timePicker}
                          themeVariant="light"
                          textColor="#1e293b"
                        />
                        {timeValidationError && (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              {timeValidationError}
                            </Text>
                          </View>
                        )}
                        <View style={styles.timePickerButtonsRow}>
                          <TouchableOpacity
                            style={[
                              styles.timePickerActionButton,
                              styles.timePickerCancelButton,
                            ]}
                            onPress={handleTimeCancel}
                          >
                            <Text style={styles.timePickerCancelButtonText}>
                              キャンセル
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.timePickerActionButton,
                              timeValidationError
                                ? styles.timePickerConfirmButtonDisabled
                                : styles.timePickerConfirmButton,
                            ]}
                            onPress={handleTimeConfirm}
                            disabled={!!timeValidationError}
                          >
                            <Text
                              style={[
                                timeValidationError
                                  ? styles.timePickerConfirmButtonTextDisabled
                                  : styles.timePickerConfirmButtonText,
                              ]}
                            >
                              決定
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* 評価 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>評価</Text>
                  {renderStars(visitData.rating, (star) =>
                    setVisitData(prev => ({ ...prev, rating: star }))
                  )}
                </View>

                {/* コメント */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>コメント</Text>
                  <TextInput
                    style={[styles.textInput, styles.commentInput]}
                    value={visitData.comment}
                    onChangeText={(text) =>
                      setVisitData(prev => ({ ...prev, comment: text }))
                    }
                    placeholder="感想を入力..."
                    multiline
                    numberOfLines={5}
                  />
                </View>

                {/* 写真 */}
                <PhotoPicker
                  photos={visitData.photos}
                  onPhotosChange={handlePhotosChange}
                  maxPhotos={5}
                />
              </ScrollView>

              {/* 画面下部のボタン */}
              <View style={styles.modalButtons}>
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <FacilitySearch
        visible={facilitySearchVisible}
        onClose={() => setFacilitySearchVisible(false)}
        onSelect={handleFacilitySelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    flex: 1,
  },
  modalFormContainer: {
    flex: 1,
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
    height: 120,
    textAlignVertical: 'top',
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
    minWidth: 44,
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    gap: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  timeDisplayContainer: {
    width: '100%',
  },
  timeButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
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
    minHeight: 44,
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
    paddingHorizontal: 8,
  },
  timePickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
    width: '100%',
  },
  timePickerActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  timePickerCancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  timePickerConfirmButton: {
    backgroundColor: '#0ea5e9',
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
  timePickerConfirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  timePickerConfirmButtonTextDisabled: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
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
});