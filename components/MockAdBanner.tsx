import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

interface MockAdBannerProps {
  style?: any;
}

export const MockAdBanner: React.FC<MockAdBannerProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mockAd}>
        <View style={styles.adHeader}>
          <Text style={styles.adLabel}>広告 (開発用)</Text>
        </View>
        <View style={styles.adContent}>
          <ExternalLink size={24} color="#64748b" />
          <Text style={styles.adText}>
            AdMob初期化失敗{'\n'}モック広告を表示中
          </Text>
        </View>
        <TouchableOpacity style={styles.learnMore}>
          <Text style={styles.learnMoreText}>詳細</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  mockAd: {
    width: 320,
    height: 50,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
  },
  adHeader: {
    position: 'absolute',
    top: -8,
    left: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 4,
  },
  adLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  learnMore: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  learnMoreText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
});