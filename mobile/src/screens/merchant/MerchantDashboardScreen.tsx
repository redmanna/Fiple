import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

export default function MerchantDashboardScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/merchant/dashboard?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !dashboard) {
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
        <Text className="text-2xl font-bold text-gray-900">Merchant Dashboard</Text>
        <Text className="text-gray-600 mt-1">Track your store performance</Text>
      </View>

      {/* Period Selector */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row">
          {['7', '30', '90'].map((p) => (
            <TouchableOpacity
              key={p}
              className={`px-4 py-2 rounded-lg mr-2 ${period === p ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setPeriod(p)}
            >
              <Text className={period === p ? 'text-white font-medium' : 'text-gray-700'}>
                {p} days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View className="p-4">
        <View className="flex-row flex-wrap -mx-2">
          {/* Revenue */}
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="cash-outline" size={24} color="#10B981" />
                <View className="bg-green-100 px-2 py-1 rounded">
                  <Text className="text-green-700 text-xs font-bold">+12%</Text>
                </View>
              </View>
              <Text className="text-gray-600 text-sm">Revenue</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                ₦{dashboard?.overview?.revenue?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* Orders */}
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
                <View className="bg-blue-100 px-2 py-1 rounded">
                  <Text className="text-blue-700 text-xs font-bold">+8%</Text>
                </View>
              </View>
              <Text className="text-gray-600 text-sm">Orders</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {dashboard?.overview?.totalOrders || 0}
              </Text>
            </View>
          </View>

          {/* Products */}
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="cube-outline" size={24} color="#F59E0B" className="mb-2" />
              <Text className="text-gray-600 text-sm">Products</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {dashboard?.overview?.totalProducts || 0}
              </Text>
            </View>
          </View>

          {/* Rating */}
          <View className="w-1/2 px-2 mb-3">
            <View className="bg-white p-4 rounded-lg shadow-sm">
              <Ionicons name="star-outline" size={24} color="#EF4444" className="mb-2" />
              <Text className="text-gray-600 text-sm">Rating</Text>
              <Text className="text-gray-900 font-bold text-xl mt-1">
                {dashboard?.overview?.rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Order Status */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-3">
        <Text className="text-gray-900 font-semibold mb-3">Order Status</Text>
        <View className="space-y-2">
          {[
            { label: 'Pending', count: dashboard?.orderStats?.pending || 0, color: 'bg-yellow-500' },
            { label: 'Processing', count: dashboard?.orderStats?.processing || 0, color: 'bg-blue-500' },
            { label: 'Shipped', count: dashboard?.orderStats?.shipped || 0, color: 'bg-purple-500' },
            { label: 'Delivered', count: dashboard?.orderStats?.delivered || 0, color: 'bg-green-500' },
          ].map((status) => (
            <View key={status.label} className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className={`w-3 h-3 rounded-full ${status.color} mr-2`} />
                <Text className="text-gray-700">{status.label}</Text>
              </View>
              <Text className="text-gray-900 font-semibold">{status.count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Products */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-900 font-semibold">Top Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MerchantProducts')}>
            <Text className="text-green-600 text-sm">View All</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.topProducts?.slice(0, 3).map((product: any, idx: number) => (
          <View
            key={product.id}
            className="flex-row items-center justify-between py-2 border-b border-gray-200"
          >
            <View className="flex-1">
              <Text className="text-gray-900" numberOfLines={1}>
                {product.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {product.salesCount} sales • ₦{product.price.toLocaleString()}
              </Text>
            </View>
            <View className="bg-gray-100 px-2 py-1 rounded">
              <Text className="text-gray-700 text-xs">{product.stock} left</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Orders */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-900 font-semibold">Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MerchantOrders')}>
            <Text className="text-green-600 text-sm">View All</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.recentOrders?.slice(0, 5).map((order: any) => (
          <TouchableOpacity
            key={order.id}
            className="flex-row items-center justify-between py-3 border-b border-gray-200"
            onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
          >
            <View>
              <Text className="text-gray-900 font-medium">{order.orderNumber}</Text>
              <Text className="text-gray-500 text-xs mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-900 font-semibold">
                ₦{order.total.toLocaleString()}
              </Text>
              <View className="bg-blue-100 px-2 py-1 rounded mt-1">
                <Text className="text-blue-700 text-xs">{order.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View className="p-4 mb-8">
        <Text className="text-gray-900 font-semibold mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap -mx-2">
          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('AddProduct')}
          >
            <View className="bg-green-500 p-4 rounded-lg items-center">
              <Ionicons name="add-circle-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2">Add Product</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('MerchantOrders')}
          >
            <View className="bg-blue-500 p-4 rounded-lg items-center">
              <Ionicons name="list-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2">View Orders</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('MerchantProducts')}
          >
            <View className="bg-purple-500 p-4 rounded-lg items-center">
              <Ionicons name="cube-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2">My Products</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-1/2 px-2 mb-3"
            onPress={() => navigation.navigate('AffiliatePartners')}
          >
            <View className="bg-orange-500 p-4 rounded-lg items-center">
              <Ionicons name="people-outline" size={32} color="white" />
              <Text className="text-white font-medium mt-2">Affiliates</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
