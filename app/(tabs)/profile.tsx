import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Award, TrendingUp, Heart, Bath, Star, Calendar } from 'lucide-react-native';
import { useVisitStore } from '@/store/visitStore';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  progress?: number;
  total?: number;
}

const badges: Badge[] = [
  {
    id: '1',
    title: '初回訪問',
    description: '初めての銭湯記録',
    icon: '🎉',
    achieved: true,
  },
  {
    id: '2',
    title: '週末サウナー',
    description: '週末に3回連続で訪問',
    icon: '🏃‍♂️',
    achieved: true,
  },
  {
    id: '3',
    title: '月間10回',
    description: '1ヶ月に10回訪問',
    icon: '🏆',
    achieved: false,
    progress: 7,
    total: 10,
  },
  {
    id: '4',
    title: '銭湯マスター',
    description: '50種類の銭湯を訪問',
    icon: '👑',
    achieved: false,
    progress: 12,
    total: 50,
  },
  {
    id: '5',
    title: '評価王',
    description: '全訪問の平均評価4.5以上',
    icon: '⭐',
    achieved: false,
    progress: 4.2,
    total: 4.5,
  },
];

export default function ProfileScreen() {
  const { visits } = useVisitStore();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'badges' | 'wishlist'>('stats');

  const totalVisits = visits.length;
  const uniqueBaths = new Set(visits.map(v => v.bathName)).size;
  const averageRating = visits.length > 0 
    ? (visits.reduce((sum, visit) => sum + visit.rating, 0) / visits.length).toFixed(1)
    : '0.0';
  const thisMonth = new Date().getMonth();
  const monthlyVisits = visits.filter(v => new Date(v.date).getMonth() === thisMonth).length;

  const achievements = badges.filter(b => b.achieved);
  const inProgress = badges.filter(b => !b.achieved);

  const wishlistItems = [
    { id: '1', name: '大江戸温泉物語', address: '東京都江東区青海2-6-3', rating: 4.2 },
    { id: '2', name: '湯乃泉 草加健康センター', address: '埼玉県草加市稲荷3-1-20', rating: 4.5 },
    { id: '3', name: '桜湯', address: '東京都台東区谷中3-10-5', rating: 4.0 },
  ];

  const renderBadge = ({ item }: { item: Badge }) => (
    <View style={[styles.badgeCard, item.achieved && styles.achievedBadge]}>
      <View style={styles.badgeHeader}>
        <Text style={styles.badgeIcon}>{item.icon}</Text>
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeTitle, item.achieved && styles.achievedText]}>
            {item.title}
          </Text>
          <Text style={styles.badgeDescription}>{item.description}</Text>
        </View>
      </View>
      
      {!item.achieved && item.progress !== undefined && item.total !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(item.progress / item.total) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress} / {item.total}
          </Text>
        </View>
      )}
    </View>
  );

  const renderWishlistItem = ({ item }: { item: any }) => (
    <View style={styles.wishlistCard}>
      <View style={styles.wishlistHeader}>
        <Heart size={20} color="#f87171" />
        <View style={styles.wishlistInfo}>
          <Text style={styles.wishlistName}>{item.name}</Text>
          <Text style={styles.wishlistAddress}>{item.address}</Text>
        </View>
      </View>
      <View style={styles.wishlistRating}>
        <Star size={16} color="#fbbf24" fill="#fbbf24" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>マイページ</Text>
          <Text style={styles.subtitle}>あなたの銭湯ライフ</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'stats' && styles.activeTab]}
            onPress={() => setSelectedTab('stats')}
          >
            <TrendingUp size={20} color={selectedTab === 'stats' ? '#0ea5e9' : '#64748b'} />
            <Text style={[styles.tabText, selectedTab === 'stats' && styles.activeTabText]}>
              統計
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'badges' && styles.activeTab]}
            onPress={() => setSelectedTab('badges')}
          >
            <Award size={20} color={selectedTab === 'badges' ? '#0ea5e9' : '#64748b'} />
            <Text style={[styles.tabText, selectedTab === 'badges' && styles.activeTabText]}>
              バッジ
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'wishlist' && styles.activeTab]}
            onPress={() => setSelectedTab('wishlist')}
          >
            <Heart size={20} color={selectedTab === 'wishlist' ? '#0ea5e9' : '#64748b'} />
            <Text style={[styles.tabText, selectedTab === 'wishlist' && styles.activeTabText]}>
              行きたいリスト
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'stats' && (
          <View style={styles.content}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Bath size={24} color="#0ea5e9" />
                <Text style={styles.statValue}>{totalVisits}</Text>
                <Text style={styles.statLabel}>総訪問数</Text>
              </View>
              
              <View style={styles.statCard}>
                <Star size={24} color="#fbbf24" />
                <Text style={styles.statValue}>{averageRating}</Text>
                <Text style={styles.statLabel}>平均評価</Text>
              </View>
              
              <View style={styles.statCard}>
                <Calendar size={24} color="#10b981" />
                <Text style={styles.statValue}>{monthlyVisits}</Text>
                <Text style={styles.statLabel}>今月の訪問</Text>
              </View>
              
              <View style={styles.statCard}>
                <TrendingUp size={24} color="#f59e0b" />
                <Text style={styles.statValue}>{uniqueBaths}</Text>
                <Text style={styles.statLabel}>訪問施設数</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>月別訪問数</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartText}>グラフ表示エリア</Text>
                <Text style={styles.chartSubtext}>
                  実際の実装では、ここに月別の訪問数グラフが表示されます
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最近の訪問</Text>
              {visits.slice(0, 3).map((visit) => (
                <View key={visit.id} style={styles.recentVisitCard}>
                  <View style={styles.recentVisitHeader}>
                    <Bath size={16} color="#0ea5e9" />
                    <Text style={styles.recentVisitName}>{visit.bathName}</Text>
                  </View>
                  <View style={styles.recentVisitDetails}>
                    <Text style={styles.recentVisitDate}>{visit.date}</Text>
                    <View style={styles.recentVisitRating}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.recentVisitRatingText}>{visit.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTab === 'badges' && (
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                獲得済みバッジ ({achievements.length})
              </Text>
              <FlatList
                data={achievements}
                renderItem={renderBadge}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                チャレンジ中 ({inProgress.length})
              </Text>
              <FlatList
                data={inProgress}
                renderItem={renderBadge}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        {selectedTab === 'wishlist' && (
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                行きたいリスト ({wishlistItems.length})
              </Text>
              <FlatList
                data={wishlistItems}
                renderItem={renderWishlistItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#f0f9ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0ea5e9',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  chartSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  recentVisitCard: {
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
  recentVisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentVisitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  recentVisitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentVisitDate: {
    fontSize: 14,
    color: '#64748b',
  },
  recentVisitRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentVisitRatingText: {
    fontSize: 14,
    color: '#64748b',
  },
  badgeCard: {
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
  achievedBadge: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  achievedText: {
    color: '#0ea5e9',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'right',
  },
  wishlistCard: {
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
  wishlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wishlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wishlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  wishlistAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  wishlistRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
  },
});