import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: user.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.currentTier && (
          <View style={styles.tierBadge}>
            <Ionicons name="trophy" size={16} color="#fff" />
            <Text style={styles.tierText}>{user.currentTier}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.postsCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.followersCount}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{user.followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={24} color="#6b7280" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#6b7280" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="school-outline" size={24} color="#6b7280" />
          <Text style={styles.menuText}>Campus Hub</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="briefcase-outline" size={24} color="#6b7280" />
          <Text style={styles.menuText}>Skill Exchange</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#6366f1', padding: 24, paddingTop: 48, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  displayName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  username: { fontSize: 14, color: '#e0e7ff' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 8 },
  tierText: { color: '#fff', marginLeft: 4, fontSize: 12, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 20 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  bio: { padding: 16, fontSize: 14, color: '#4b5563' },
  section: { backgroundColor: '#fff', marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuText: { flex: 1, fontSize: 16, marginLeft: 12, color: '#1f2937' },
});
