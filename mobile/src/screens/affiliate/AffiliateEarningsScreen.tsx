import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AffiliateEarningsScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/affiliate/earnings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  const handleRequestPayout = () => {
    if (!earnings || earnings.totalEarnings < 1000) {
      Alert.alert('Insufficient Balance', 'Minimum payout is ₦1,000');
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request payout of ₦${earnings.totalEarnings.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              setRequesting(true);
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/affiliate/payout`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    amount: earnings.totalEarnings,
                  }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Payout request submitted successfully!');
                loadEarnings();
              } else {
                Alert.alert('Error', data.error || 'Failed to request payout');
              }
            } catch (error) {
              console.error('Error requesting payout:', error);
              Alert.alert('Error', 'Failed to request payout');
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !earnings) {
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
      <View className="bg-green-500 p-6">
        <Text className="text-white text-lg mb-2">Total Earnings</Text>
        <Text className="text-white text-4xl font-bold">
          ₦{earnings?.totalEarnings?.toLocaleString() || '0'}
        </Text>
        <View className="flex-row mt-4">
          <View className="flex-1 mr-2">
            <Text className="text-green-100 text-sm">Pending</Text>
            <Text className="text-white text-xl font-semibold mt-1">
              ₦{earnings?.pendingEarnings?.toLocaleString() || '0'}
            </Text>
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-green-100 text-sm">Paid</Text>
            <Text className="text-white text-xl font-semibold mt-1">
              ₦{earnings?.paidEarnings?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>
      </View>

      {/* Payout Button */}
      <View className="p-4">
        <TouchableOpacity
          className={`py-4 rounded-lg ${requesting || (earnings?.totalEarnings || 0) < 1000 ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleRequestPayout}
          disabled={requesting || (earnings?.totalEarnings || 0) < 1000}
        >
          {requesting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center">
              Request Payout (Min. ₦1,000)
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="px-4">
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="cart-outline" size={24} color="#10B981" className="mb-2" />
              <Text className="text-gray-600 text-sm">Total Sales</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                ₦{earnings?.totalSales?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="receipt-outline" size={24} color="#3B82F6" className="mb-2" />
              <Text className="text-gray-600 text-sm">Orders</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {earnings?.totalOrders || 0}
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="trending-up-outline" size={24} color="#F59E0B" className="mb-2" />
              <Text className="text-gray-600 text-sm">Conversion</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {earnings?.conversionRate?.toFixed(1) || '0.0'}%
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="eye-outline" size={24} color="#EF4444" className="mb-2" />
              <Text className="text-gray-600 text-sm">Clicks</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {earnings?.totalClicks || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Earnings by Merchant */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-3">
        <Text className="text-gray-900 font-semibold mb-3">Earnings by Merchant</Text>
        {earnings?.byMerchant?.map((merchant: any) => (
          <View
            key={merchant.merchantId}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">{merchant.merchantName}</Text>
              <Text className="text-gray-500 text-sm mt-1">
                {merchant.orders} orders • {merchant.commissionRate}% rate
              </Text>
            </View>
            <Text className="text-green-600 font-bold">
              ₦{merchant.earnings.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent Transactions */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-8">
        <Text className="text-gray-900 font-semibold mb-3">Recent Transactions</Text>
        {earnings?.recentTransactions?.map((transaction: any, idx: number) => (
          <View
            key={idx}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
          >
            <View className="flex-1">
              <Text className="text-gray-900">{transaction.productName}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(transaction.date).toLocaleDateString()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-green-600 font-semibold">
                +₦{transaction.commission.toLocaleString()}
              </Text>
              <View className="bg-gray-100 px-2 py-1 rounded mt-1">
                <Text className="text-gray-600 text-xs">{transaction.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
