import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { TrendingUp, Bath, Star, Calendar } from 'lucide-react-native';
import { useVisitStore } from '@/store/visitStore';

export default function ProfileScreen() {
  const { visits } = useVisitStore();

  const totalVisits = visits.length;
  const uniqueBaths = new Set(visits.map(v => v.bathName)).size;
  const averageRating = visits.length > 0 
    ? (visits.reduce((sum, visit) => sum + visit.rating, 0) / visits.length).toFixed(1)
    : '0.0';
  const thisMonth = new Date().getMonth();
  const monthlyVisits = visits.filter(v => new Date(v.date).getMonth() === thisMonth).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>マイページ</Text>
          <Text style={styles.subtitle}>あなたの銭湯ライフ</Text>
        </View>

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
});