import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { businessService } from '../../api/services';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessDashboardScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessAccount, setBusinessAccount] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountRes, analyticsRes, adsRes] = await Promise.all([
        businessService.getBusinessAccount(token!),
        businessService.getAnalytics(token!, '7d'),
        businessService.getAds(token!, { page: 1, pageSize: 5 }),
      ]);

      setBusinessAccount(accountRes.data);
      setAnalytics(analyticsRes.data);
      setAds(adsRes.data.ads);
    } catch (error) {
      console.error('Load business data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!businessAccount) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons name="business-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-900 mt-4">
          No Business Account
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Create a business account to start promoting your products and services
        </Text>
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
          onPress={() => navigation.navigate('CreateBusinessAccount')}
        >
          <Text className="text-white font-semibold">Create Business Account</Text>
        </TouchableOpacity>
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
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {businessAccount.businessName}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-green-100 px-2 py-1 rounded">
                <Text className="text-green-700 text-xs font-medium">
                  {businessAccount.tier}
                </Text>
              </View>
              {businessAccount.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" className="ml-2" />
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BusinessSettings')}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Overview (Last 7 Days)</Text>
        <View className="flex-row flex-wrap">
          <View className="bg-white rounded-lg p-4 w-[48%] mr-[2%] mb-3">
            <Text className="text-gray-600 text-sm">Active Ads</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.overview?.activeAds || 0}
            </Text>
          </View>
          <View className="bg-white rounded-lg p-4 w-[48%] mb-3">
            <Text className="text-gray-600 text-sm">Total Impressions</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.overview?.totalImpressions?.toLocaleString() || 0}
            </Text>
          </View>
          <View className="bg-white rounded-lg p-4 w-[48%] mr-[2%] mb-3">
            <Text className="text-gray-600 text-sm">Total Clicks</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.overview?.totalClicks?.toLocaleString() || 0}
            </Text>
          </View>
          <View className="bg-white rounded-lg p-4 w-[48%] mb-3">
            <Text className="text-gray-600 text-sm">Average CTR</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.overview?.averageCTR?.toFixed(2) || 0}%
            </Text>
          </View>
          <View className="bg-white rounded-lg p-4 w-[48%] mr-[2%]">
            <Text className="text-gray-600 text-sm">Total Spent</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">
              ₦{analytics?.overview?.totalSpent?.toLocaleString() || 0}
            </Text>
          </View>
          <View className="bg-white rounded-lg p-4 w-[48%]">
            <Text className="text-gray-600 text-sm">Budget Remaining</Text>
            <Text className="text-2xl font-bold text-green-600 mt-1">
              ₦{analytics?.overview?.budgetRemaining?.toLocaleString() || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Ads */}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">Recent Ads</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ManageAds')}>
            <Text className="text-green-600 font-medium">View All</Text>
          </TouchableOpacity>
        </View>

        {ads.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Text className="text-gray-600">No ads yet</Text>
          </View>
        ) : (
          ads.map(ad => (
            <TouchableOpacity
              key={ad.id}
              className="bg-white rounded-lg p-4 mb-3"
              onPress={() => navigation.navigate('AdDetails', { adId: ad.id })}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{ad.title}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{ad.format}</Text>
                  <View className="flex-row items-center mt-2">
                    <View
                      className={`px-2 py-1 rounded ${
                        ad.status === 'ACTIVE'
                          ? 'bg-green-100'
                          : ad.status === 'PENDING_REVIEW'
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          ad.status === 'ACTIVE'
                            ? 'text-green-700'
                            : ad.status === 'PENDING_REVIEW'
                            ? 'text-yellow-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {ad.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-gray-600 text-sm">{ad.impressions} views</Text>
                  <Text className="text-gray-600 text-sm">{ad.clicks} clicks</Text>
                  <Text className="text-green-600 font-semibold mt-1">
                    {ad.ctr?.toFixed(2)}% CTR
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Action Buttons */}
      <View className="p-4 pb-8">
        <TouchableOpacity
          className="bg-green-500 rounded-lg p-4 flex-row items-center justify-center mb-3"
          onPress={() => navigation.navigate('CreateAd')}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">Create New Ad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-blue-500 rounded-lg p-4 flex-row items-center justify-center"
          onPress={() => navigation.navigate('PromotePost')}
        >
          <Ionicons name="trending-up-outline" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">Promote a Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
