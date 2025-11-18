import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardMobileScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Mock admin dashboard - in production, this would call /api/admin/dashboard
      setStats({
        totalUsers: 125430,
        activeUsers: 82156,
        totalPosts: 450200,
        totalRevenue: 45678900,
        pendingReports: 23,
        pendingAds: 15,
        flaggedContent: 8,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading && !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Admin Dashboard</Text>
        <Text className="text-gray-600 mt-1">Platform overview and moderation</Text>
      </View>

      {/* Urgent Actions */}
      <View className="p-4">
        <Text className="text-gray-900 font-semibold mb-3">Urgent Actions</Text>

        <TouchableOpacity
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3"
          onPress={() => navigation.navigate('ContentModeration')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center">
                <Ionicons name="alert-circle" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-red-900 font-semibold">Flagged Content</Text>
                <Text className="text-red-700 text-sm">Review required</Text>
              </View>
            </View>
            <View className="bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{stats.flaggedContent}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3"
          onPress={() => navigation.navigate('AdApproval')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-yellow-500 rounded-full items-center justify-center">
                <Ionicons name="megaphone" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-yellow-900 font-semibold">Pending Ads</Text>
                <Text className="text-yellow-700 text-sm">Awaiting approval</Text>
              </View>
            </View>
            <View className="bg-yellow-500 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{stats.pendingAds}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          onPress={() => navigation.navigate('UserManagement')}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-semibold">Pending Reports</Text>
                <Text className="text-blue-700 text-sm">User reports</Text>
              </View>
            </View>
            <View className="bg-blue-500 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{stats.pendingReports}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Platform Stats */}
      <View className="px-4">
        <Text className="text-gray-900 font-semibold mb-3">Platform Statistics</Text>
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="people-outline" size={24} color="#10B981" className="mb-2" />
              <Text className="text-gray-600 text-sm">Total Users</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {stats.totalUsers.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="pulse-outline" size={24} color="#3B82F6" className="mb-2" />
              <Text className="text-gray-600 text-sm">Active Users</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {stats.activeUsers.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="document-outline" size={24} color="#F59E0B" className="mb-2" />
              <Text className="text-gray-600 text-sm">Total Posts</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {stats.totalPosts.toLocaleString()}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="cash-outline" size={24} color="#10B981" className="mb-2" />
              <Text className="text-gray-600 text-sm">Revenue</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                ₦{(stats.totalRevenue / 1000000).toFixed(1)}M
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="p-4 mb-8">
        <Text className="text-gray-900 font-semibold mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap -mx-2">
          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('ContentModeration')}
          >
            <View className="bg-purple-500 p-4 rounded-lg items-center">
              <Ionicons name="shield-checkmark-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2 text-center">Content Moderation</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('UserManagement')}
          >
            <View className="bg-blue-500 p-4 rounded-lg items-center">
              <Ionicons name="people-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2 text-center">User Management</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('AdApproval')}
          >
            <View className="bg-orange-500 p-4 rounded-lg items-center">
              <Ionicons name="megaphone-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2 text-center">Ad Approval</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('PlatformAnalytics')}
          >
            <View className="bg-green-500 p-4 rounded-lg items-center">
              <Ionicons name="stats-chart-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2 text-center">Analytics</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
