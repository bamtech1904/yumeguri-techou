import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { logger } from './logger';

export interface PhotoAsset {
  uri: string;
  filename?: string;
  type?: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

export interface PhotoPickerResult {
  success: boolean;
  photos?: PhotoAsset[];
  error?: string;
}

// 権限確認と要求
const checkCameraPermission = async (): Promise<boolean> => {
  logger.debug('📸 カメラ権限確認開始');
  
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    logger.debug('📸 カメラ権限状態:', status);
    
    const granted = status === 'granted';
    logger.debug('📸 カメラ権限:', granted ? '許可' : '拒否');
    return granted;
  } catch (error) {
    logger.error('❌ カメラ権限確認エラー:', error);
    return false;
  }
};

const checkPhotoLibraryPermission = async (): Promise<boolean> => {
  logger.debug('📷 フォトライブラリ権限確認開始');
  
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    logger.debug('📷 フォトライブラリ権限状態:', status);
    
    const granted = status === 'granted';
    logger.debug('📷 フォトライブラリ権限:', granted ? '許可' : '拒否');
    return granted;
  } catch (error) {
    logger.error('❌ フォトライブラリ権限確認エラー:', error);
    return false;
  }
};

export const showPhotoPickerOptions = (): Promise<PhotoPickerResult> => {
  return new Promise((resolve) => {
    Alert.alert(
      '写真を追加',
      '写真の選択方法を選んでください',
      [
        { text: 'キャンセル', style: 'cancel', onPress: () => resolve({ success: false }) },
        { 
          text: 'カメラ', 
          onPress: () => pickFromCamera().then(resolve) 
        },
        { 
          text: 'ギャラリー', 
          onPress: () => pickFromGallery().then(resolve) 
        },
      ],
      { cancelable: true, onDismiss: () => resolve({ success: false }) }
    );
  });
};

export const pickFromCamera = async (): Promise<PhotoPickerResult> => {
  logger.debug('📸 カメラ撮影開始');
  
  try {
    // 権限確認
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      logger.warn('❌ カメラ権限が拒否されました');
      return { 
        success: false, 
        error: 'カメラの権限が必要です。設定からカメラへのアクセスを許可してください。' 
      };
    }

    logger.debug('📸 カメラ起動中...');
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
    });

    logger.debug('📸 カメラレスポンス:', result);
    
    if (result.canceled) {
      logger.debug('📸 カメラ撮影キャンセル');
      return { success: false };
    }

    if (result.assets && result.assets.length > 0) {
      logger.debug('📸 写真取得成功:', result.assets.length + '枚');
      
      // 画像をそのまま使用（最適化は一時的に無効）
      const photos: PhotoAsset[] = result.assets.map(asset => ({
        uri: asset.uri,
        filename: asset.fileName || undefined,
        type: asset.type,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      }));

      return { success: true, photos };
    } else {
      logger.error('📸 写真データが空です');
      return { success: false, error: '写真の取得に失敗しました' };
    }
  } catch (error) {
    logger.error('📸 カメラ処理エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '写真の撮影に失敗しました' 
    };
  }
};

export const pickFromGallery = async (): Promise<PhotoPickerResult> => {
  console.log('📷 ギャラリー選択開始');
  
  try {
    // 権限確認
    const hasPermission = await checkPhotoLibraryPermission();
    if (!hasPermission) {
      console.error('❌ フォトライブラリ権限が拒否されました');
      return { 
        success: false, 
        error: 'フォトライブラリの権限が必要です。設定からフォトライブラリへのアクセスを許可してください。' 
      };
    }

    console.log('📷 ギャラリー起動中...');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      aspect: [4, 3],
      quality: 0.8,
    });

    console.log('📷 ギャラリーレスポンス:', result);
    
    if (result.canceled) {
      console.log('📷 ギャラリー選択キャンセル');
      return { success: false };
    }

    if (result.assets && result.assets.length > 0) {
      logger.debug('📷 写真取得成功:', result.assets.length + '枚');
      
      // 画像をそのまま使用（最適化は一時的に無効）
      const photos: PhotoAsset[] = result.assets.map(asset => ({
        uri: asset.uri,
        filename: asset.fileName || undefined,
        type: asset.type,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      }));

      return { success: true, photos };
    } else {
      console.error('📷 写真データが空です');
      return { success: false, error: '写真の取得に失敗しました' };
    }
  } catch (error) {
    console.error('📷 ギャラリー処理エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '写真の選択に失敗しました' 
    };
  }
};

export const deletePhoto = (photoUri: string, photos: string[]): string[] => {
  return photos.filter(uri => uri !== photoUri);
};

export const addPhotos = (newPhotos: PhotoAsset[], existingPhotos: string[], maxPhotos: number = 5): string[] => {
  const newUris = newPhotos.map(photo => photo.uri);
  const combinedPhotos = [...existingPhotos, ...newUris];
  
  // 最大枚数を超えた場合は古い写真を削除
  if (combinedPhotos.length > maxPhotos) {
    return combinedPhotos.slice(-maxPhotos);
  }
  
  return combinedPhotos;
};

export const formatPhotoCount = (count: number, maxCount: number = 5): string => {
  return `${count}/${maxCount}枚`;
};

export const canAddMorePhotos = (currentCount: number, maxCount: number = 5): boolean => {
  return currentCount < maxCount;
};