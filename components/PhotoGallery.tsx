import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react-native';

interface PhotoGalleryProps {
  photos: string[];
  title?: string;
  showTitle?: boolean;
}

export default function PhotoGallery({ 
  photos, 
  title = "写真",
  showTitle = true 
}: PhotoGalleryProps) {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const photoSize = (screenWidth - 60) / 3; // 3列表示、余白を考慮

  if (photos.length === 0) {
    return null;
  }

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setFullscreenVisible(true);
  };

  const handlePrevious = () => {
    setSelectedPhotoIndex((prev) => 
      prev > 0 ? prev - 1 : photos.length - 1
    );
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => 
      prev < photos.length - 1 ? prev + 1 : 0
    );
  };

  const renderPhoto = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(index)}
    >
      <Image 
        source={{ uri: item }} 
        style={[styles.photo, { width: photoSize, height: photoSize }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <ImageIcon size={20} color="#0ea5e9" />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.photoCount}>
            {photos.length}枚
          </Text>
        </View>
      )}

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        style={styles.photoGrid}
        contentContainerStyle={styles.photoGridContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={fullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullscreenVisible(false)}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.fullscreenTitle}>
              {selectedPhotoIndex + 1} / {photos.length}
            </Text>
          </View>

          <View style={styles.fullscreenContent}>
            <Image
              source={{ uri: photos[selectedPhotoIndex] }}
              style={styles.fullscreenPhoto}
              resizeMode="contain"
            />

            {photos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navigationButton, styles.previousButton]}
                  onPress={handlePrevious}
                >
                  <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navigationButton, styles.nextButton]}
                  onPress={handleNext}
                >
                  <ChevronRight size={24} color="#ffffff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.fullscreenFooter}>
            <View style={styles.photoIndicator}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === selectedPhotoIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  photoGrid: {
    maxHeight: 300,
  },
  photoGridContent: {
    paddingBottom: 8,
  },
  photoItem: {
    flex: 1,
    margin: 2,
  },
  photo: {
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  fullscreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenPhoto: {
    width: '100%',
    height: '100%',
  },
  navigationButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
  },
  previousButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  fullscreenFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  photoIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
  },
});