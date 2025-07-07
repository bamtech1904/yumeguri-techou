import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { placesService } from '@/services/placesService';

interface ApiDebugInfoProps {
  visible: boolean;
  onClose: () => void;
}

export default function ApiDebugInfo({ visible, onClose }: ApiDebugInfoProps) {
  if (!visible) return null;

  const apiValidation = placesService.validateApiKey();

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>🔧 API Debug Info</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>API Key Status:</Text>
          <Text style={[styles.value, apiValidation.isValid ? styles.success : styles.error]}>
            {apiValidation.isValid ? '✅ Valid' : '❌ Invalid'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>API Key Preview:</Text>
          <Text style={styles.value}>{apiValidation.key}</Text>
        </View>

        {apiValidation.issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Issues:</Text>
            {apiValidation.issues.map((issue, index) => (
              <Text key={index} style={styles.error}>• {issue}</Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Environment:</Text>
          <Text style={styles.value}>
            {process.env.NODE_ENV || 'development'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>使用API:</Text>
          <Text style={styles.value}>
            🆕 Places API (New) のみ
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.instructions}>
            📝 REQUEST_DENIED エラーの解決方法:{'\n'}
            1. Google Cloud Console で "Places API (New)" を有効化{'\n'}
            2. 請求設定を完了（無料枠でも必須）{'\n'}
            3. APIキー制限を確認{'\n'}
            4. 開発サーバーを再起動{'\n'}
            {'\n'}
            💡 新しいAPIのみを使用してシンプルな構成です
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxWidth: 350,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1e293b',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  success: {
    color: '#10b981',
  },
  error: {
    color: '#ef4444',
  },
  instructions: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});