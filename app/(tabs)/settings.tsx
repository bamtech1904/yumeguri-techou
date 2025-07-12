import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Info,
  ChevronRight,
  Trash2,
  HardDrive,
} from 'lucide-react-native';
import { cacheManager } from '@/utils/cacheManager';
import { imageCacheManager } from '@/utils/imageCache';

export default function SettingsScreen() {
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const metrics = cacheManager.getMetrics();
      const sizeInMB = Math.round((metrics.totalSize / 1024 / 1024) * 10) / 10; // 小数点1桁
      setCacheSize(sizeInMB);
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const formatCacheSize = (sizeInMB: number): string => {
    if (sizeInMB < 0.1) {
      return '0.1MB未満';
    } else if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 10) / 10}MB`;
    } else {
      return `${Math.round(sizeInMB * 10) / 10}MB`;
    }
  };

  const handleClearCache = async () => {
    const sizeText = cacheSize > 0 ? `\n${formatCacheSize(cacheSize)}の容量を解放します` : '';
    
    Alert.alert(
      'キャッシュクリア',
      `すべてのキャッシュを削除しますか？${sizeText}`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: async () => {
          try {
            await cacheManager.clear();
            await imageCacheManager.clearImageCache();
            await loadCacheInfo(); // キャッシュ情報を再読み込み
            Alert.alert('クリア完了', `${formatCacheSize(cacheSize)}のキャッシュを削除しました`);
          } catch (error) {
            console.error('Error clearing cache:', error);
            Alert.alert('エラー', 'キャッシュの削除に失敗しました');
          }
        }},
      ]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, danger && styles.dangerItem]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color="#94a3b8" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>設定</Text>
          <Text style={styles.subtitle}>アプリの設定を管理</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <HardDrive size={20} color="#0ea5e9" />,
              'キャッシュ情報',
              `使用量: ${formatCacheSize(cacheSize)}`,
              undefined
            )}
            {renderSettingItem(
              <Trash2 size={20} color="#f97316" />,
              'キャッシュクリア',
              'すべてのキャッシュを削除して容量を節約',
              handleClearCache
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <Info size={20} color="#64748b" />,
              'アプリについて',
              'バージョン情報・利用規約',
              () => Alert.alert('アプリについて', '湯めぐり手帳 v1.0.0')
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            湯めぐり手帳 v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 湯めぐり手帳. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dangerItem: {
    borderBottomColor: '#fef2f2',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  dangerText: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
});