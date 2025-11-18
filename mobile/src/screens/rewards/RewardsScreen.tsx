import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rewardService } from '../../api/services';
import { useAuthStore } from '../../store/authStore';

export default function RewardsScreen() {
  const [progress, setProgress] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadProgress = async () => {
    try {
      const data = await rewardService.getMilestoneProgress();
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProgress} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <Text style={styles.headerSubtitle}>Track your milestones</Text>
      </View>

      {user?.currentTier && (
        <View style={styles.tierCard}>
          <Ionicons name="trophy" size={48} color="#fbbf24" />
          <Text style={styles.tierTitle}>Current Tier: {user.currentTier}</Text>
        </View>
      )}

      {progress && progress.nextTier && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Milestone: {progress.nextTier}</Text>
          <Text style={styles.rewardAmount}>Reward: ₦{progress.reward.toLocaleString()}</Text>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Followers</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progress.progress.followers.percentage)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.progress.followers.current} / {progress.progress.followers.required}
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Total Likes</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progress.progress.likes.percentage)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.progress.likes.current} / {progress.progress.likes.required}
            </Text>
          </View>

          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Total Shares</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, progress.progress.shares.percentage)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.progress.shares.current} / {progress.progress.shares.required}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Milestones</Text>
        {['Freshman - ₦50,000', 'Sophomore - ₦150,000', 'Junior - ₦300,000', 'Senior - ₦500,000', 'Alumnus - ₦1,000,000'].map((tier, idx) => (
          <View key={idx} style={styles.milestoneItem}>
            <Ionicons name="trophy-outline" size={24} color="#6366f1" />
            <Text style={styles.milestoneText}>{tier}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#6366f1', padding: 16, paddingTop: 48 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e7ff' },
  tierCard: { backgroundColor: '#fff', margin: 16, padding: 24, borderRadius: 12, alignItems: 'center' },
  tierTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  rewardAmount: { fontSize: 24, fontWeight: 'bold', color: '#10b981', marginBottom: 16 },
  progressItem: { marginBottom: 16 },
  progressLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366f1' },
  progressText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  milestoneText: { marginLeft: 12, fontSize: 16 },
});
