import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  User,
  Bell,
  Shield,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Trash2,
  Download,
  Upload,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [highQualityImages, setHighQualityImages] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'データエクスポート',
      '記録データをファイルに出力しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'エクスポート', onPress: () => {
          Alert.alert('エクスポート完了', 'データを出力しました');
        }},
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'データインポート',
      'ファイルから記録データを読み込みますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'インポート', onPress: () => {
          Alert.alert('インポート完了', 'データを読み込みました');
        }},
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'キャッシュクリア',
      'すべての画像キャッシュを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => {
          Alert.alert('クリア完了', 'キャッシュを削除しました');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      '本当にアカウントを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => {
          Alert.alert('削除完了', 'アカウントを削除しました');
        }},
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', onPress: () => {
          Alert.alert('ログアウト', 'ログアウトしました');
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
          <Text style={styles.sectionTitle}>アカウント</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <User size={20} color="#0ea5e9" />,
              'プロフィール',
              'アカウント情報を編集',
              () => Alert.alert('プロフィール', '機能実装予定')
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <Bell size={20} color="#10b981" />,
              '通知',
              'プッシュ通知の設定',
              undefined,
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#d1d5db', true: '#0ea5e9' }}
                thumbColor={notifications ? '#ffffff' : '#f4f4f5'}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ同期</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <Database size={20} color="#f59e0b" />,
              '自動同期',
              'データを自動的に同期',
              undefined,
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#d1d5db', true: '#0ea5e9' }}
                thumbColor={autoSync ? '#ffffff' : '#f4f4f5'}
              />
            )}
            {renderSettingItem(
              <Download size={20} color="#6366f1" />,
              'Wi-Fi接続時のみ',
              'Wi-Fi接続時のみ大容量データを同期',
              undefined,
              <Switch
                value={wifiOnly}
                onValueChange={setWifiOnly}
                trackColor={{ false: '#d1d5db', true: '#0ea5e9' }}
                thumbColor={wifiOnly ? '#ffffff' : '#f4f4f5'}
              />
            )}
            {renderSettingItem(
              <Upload size={20} color="#8b5cf6" />,
              '高画質画像',
              '高画質画像をキャッシュ',
              undefined,
              <Switch
                value={highQualityImages}
                onValueChange={setHighQualityImages}
                trackColor={{ false: '#d1d5db', true: '#0ea5e9' }}
                thumbColor={highQualityImages ? '#ffffff' : '#f4f4f5'}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <Download size={20} color="#0ea5e9" />,
              'データエクスポート',
              '記録データをファイルに出力',
              handleExportData
            )}
            {renderSettingItem(
              <Upload size={20} color="#0ea5e9" />,
              'データインポート',
              'ファイルから記録データを読み込み',
              handleImportData
            )}
            {renderSettingItem(
              <Trash2 size={20} color="#f97316" />,
              'キャッシュクリア',
              '画像キャッシュを削除して容量を節約',
              handleClearCache
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <Shield size={20} color="#64748b" />,
              'プライバシーポリシー',
              'プライバシーポリシーを確認',
              () => Alert.alert('プライバシーポリシー', '機能実装予定')
            )}
            {renderSettingItem(
              <Info size={20} color="#64748b" />,
              'アプリについて',
              'バージョン情報・利用規約',
              () => Alert.alert('アプリについて', '湯めぐり手帳 v1.0.0')
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント管理</Text>
          <View style={styles.settingGroup}>
            {renderSettingItem(
              <LogOut size={20} color="#ef4444" />,
              'ログアウト',
              'アカウントからログアウト',
              handleLogout,
              undefined,
              true
            )}
            {renderSettingItem(
              <Trash2 size={20} color="#ef4444" />,
              'アカウント削除',
              'アカウントと全データを削除',
              handleDeleteAccount,
              undefined,
              true
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