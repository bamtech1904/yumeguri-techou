import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Camera, Image as ImageIcon, Plus, X } from 'lucide-react-native';
import { 
  showPhotoPickerOptions, 
  addPhotos, 
  deletePhoto, 
  formatPhotoCount, 
  canAddMorePhotos,
  PhotoAsset 
} from '@/utils/photoUtils';

interface PhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export default function PhotoPicker({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5,
  disabled = false 
}: PhotoPickerProps) {
  const [loading, setLoading] = useState(false);

  const handleAddPhoto = async () => {
    if (!canAddMorePhotos(photos.length, maxPhotos)) {
      Alert.alert('制限に達しました', `最大${maxPhotos}枚まで追加できます`);
      return;
    }

    console.log('📸 写真追加開始');
    setLoading(true);
    
    try {
      const result = await showPhotoPickerOptions();
      console.log('📸 写真選択結果:', result);
      
      if (result.success && result.photos) {
        console.log('📸 写真追加成功:', result.photos.length + '枚');
        const newPhotos = addPhotos(result.photos, photos, maxPhotos);
        onPhotosChange(newPhotos);
      } else if (result.error) {
        console.error('📸 写真選択エラー:', result.error);
        Alert.alert('エラー', result.error);
      } else {
        console.log('📸 写真選択キャンセル');
        // キャンセルの場合は何もしない
      }
    } catch (error) {
      console.error('📸 写真選択処理エラー:', error);
      Alert.alert('エラー', '写真の選択に失敗しました。再度お試しください。');
    } finally {
      console.log('📸 写真追加処理完了');
      setLoading(false);
    }
  };

  const handleDeletePhoto = (photoUri: string) => {
    Alert.alert(
      '写真を削除',
      'この写真を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            const newPhotos = deletePhoto(photoUri, photos);
            onPhotosChange(newPhotos);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <ImageIcon size={20} color="#0ea5e9" />
          <Text style={styles.title}>写真</Text>
        </View>
        <Text style={styles.photoCount}>
          {formatPhotoCount(photos.length, maxPhotos)}
        </Text>
      </View>

      {photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
          contentContainerStyle={styles.photoScrollContent}
        >
          {photos.map((photoUri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(photoUri)}
              >
                <X size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          styles.addButton,
          disabled && styles.addButtonDisabled,
          !canAddMorePhotos(photos.length, maxPhotos) && styles.addButtonDisabled
        ]}
        onPress={handleAddPhoto}
        disabled={disabled || loading || !canAddMorePhotos(photos.length, maxPhotos)}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#0ea5e9" />
        ) : (
          <>
            <Plus size={20} color={canAddMorePhotos(photos.length, maxPhotos) ? "#0ea5e9" : "#94a3b8"} />
            <Text style={[
              styles.addButtonText,
              !canAddMorePhotos(photos.length, maxPhotos) && styles.addButtonTextDisabled
            ]}>
              写真を追加
            </Text>
          </>
        )}
      </TouchableOpacity>

      {photos.length === 0 && (
        <View style={styles.emptyState}>
          <Camera size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>写真を追加して記録を豊かにしましょう</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  photoCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  photoScroll: {
    marginBottom: 16,
  },
  photoScrollContent: {
    paddingRight: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
  },
  addButtonTextDisabled: {
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});