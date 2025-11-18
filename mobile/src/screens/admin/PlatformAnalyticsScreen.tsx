import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function PlatformAnalyticsScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [period, setPeriod] = useState('30');

  const analytics = {
    dau: 45230,
    mau: 125430,
    retention: 68.5,
    revenue: {
      total: 45678900,
      marketplace: 22000000,
      battles: 15000000,
      ads: 8678900,
    },
    topCreators: [
      { id: '1', name: 'Creator 1', followers: 52000, engagement: '8.5%' },
      { id: '2', name: 'Creator 2', followers: 48000, engagement: '7.2%' },
    ],
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Platform Analytics</Text>
        <View className="flex-row mt-3">
          {['7', '30', '90'].map(p => (
            <TouchableOpacity
              key={p}
              className={`px-4 py-2 rounded-lg mr-2 ${period === p ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setPeriod(p)}
            >
              <Text className={period === p ? 'text-white' : 'text-gray-700'}>{p} days</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="p-4">
        <Text className="text-gray-900 font-semibold mb-3">Key Metrics</Text>
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="people-outline" size={24} color="#10B981" />
              <Text className="text-gray-600 text-sm mt-2">DAU</Text>
              <Text className="text-gray-900 font-bold text-xl">{analytics.dau.toLocaleString()}</Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="pulse-outline" size={24} color="#3B82F6" />
              <Text className="text-gray-600 text-sm mt-2">MAU</Text>
              <Text className="text-gray-900 font-bold text-xl">{analytics.mau.toLocaleString()}</Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="repeat-outline" size={24} color="#F59E0B" />
              <Text className="text-gray-600 text-sm mt-2">Retention</Text>
              <Text className="text-gray-900 font-bold text-xl">{analytics.retention}%</Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="cash-outline" size={24} color="#10B981" />
              <Text className="text-gray-600 text-sm mt-2">Revenue</Text>
              <Text className="text-gray-900 font-bold text-xl">₦{(analytics.revenue.total / 1000000).toFixed(1)}M</Text>
            </View>
          </View>
        </View>

        <View className="bg-white p-4 rounded-lg shadow-sm mb-3">
          <Text className="text-gray-900 font-semibold mb-3">Revenue Breakdown</Text>
          {[
            { label: 'Marketplace', amount: analytics.revenue.marketplace, color: 'bg-green-500' },
            { label: 'Battles', amount: analytics.revenue.battles, color: 'bg-blue-500' },
            { label: 'Ads', amount: analytics.revenue.ads, color: 'bg-orange-500' },
          ].map(item => (
            <View key={item.label} className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <View className={`w-3 h-3 rounded-full ${item.color} mr-2`} />
                <Text className="text-gray-700">{item.label}</Text>
              </View>
              <Text className="text-gray-900 font-semibold">₦{(item.amount / 1000000).toFixed(1)}M</Text>
            </View>
          ))}
        </View>

        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-gray-900 font-semibold mb-3">Top Creators</Text>
          {analytics.topCreators.map(creator => (
            <View key={creator.id} className="flex-row items-center justify-between py-2 border-b border-gray-200">
              <View className="flex-1">
                <Text className="text-gray-900 font-medium">{creator.name}</Text>
                <Text className="text-gray-600 text-sm">{creator.followers.toLocaleString()} followers</Text>
              </View>
              <Text className="text-green-600 font-semibold">{creator.engagement}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
