import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const statuses = [
    { value: null, label: 'All', icon: 'apps', color: 'gray' },
    { value: 'PENDING', label: 'Pending', icon: 'time', color: 'yellow' },
    { value: 'PROCESSING', label: 'Processing', icon: 'hourglass', color: 'blue' },
    { value: 'SHIPPED', label: 'Shipped', icon: 'airplane', color: 'purple' },
    { value: 'DELIVERED', label: 'Delivered', icon: 'checkmark-circle', color: 'green' },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'close-circle', color: 'red' },
  ];

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/orders${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    const statusMap: any = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const renderOrder = ({ item }: any) => {
    const firstItem = item.items?.[0];
    const itemCount = item.items?.length || 0;

    return (
      <TouchableOpacity
        className="bg-white rounded-lg mb-3 p-4 shadow-sm"
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-gray-900 font-semibold">Order {item.orderNumber}</Text>
            <Text className="text-gray-500 text-xs mt-1">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
            <Text className="text-xs font-medium">{item.status}</Text>
          </View>
        </View>

        {/* Items Preview */}
        {firstItem && (
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: firstItem.image || 'https://via.placeholder.com/60' }}
              className="w-16 h-16 rounded"
              resizeMode="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900" numberOfLines={1}>
                {firstItem.name}
              </Text>
              <Text className="text-gray-500 text-sm">Qty: {firstItem.quantity}</Text>
              {itemCount > 1 && (
                <Text className="text-green-600 text-sm mt-1">
                  +{itemCount - 1} more item{itemCount > 2 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
          <View>
            <Text className="text-gray-500 text-xs">Total</Text>
            <Text className="text-gray-900 font-bold text-lg">₦{item.total.toLocaleString()}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-green-600 font-medium mr-2">View Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#10B981" />
          </View>
        </View>

        {/* Payment Status */}
        <View className="mt-2">
          <View className={`px-3 py-1 rounded inline-flex ${item.paymentStatus === 'PAID' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <Text className={`text-xs ${item.paymentStatus === 'PAID' ? 'text-green-700' : 'text-gray-700'}`}>
              Payment: {item.paymentStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Orders</Text>
      </View>

      {/* Status Filter */}
      <View className="bg-white border-b border-gray-200">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item.label}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${selectedStatus === item.value ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setSelectedStatus(item.value)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={selectedStatus === item.value ? 'white' : '#6B7280'}
              />
              <Text
                className={`ml-2 font-medium ${selectedStatus === item.value ? 'text-white' : 'text-gray-700'}`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-4 text-lg">No orders yet</Text>
              <Text className="text-gray-600 text-center mt-2 px-6">
                Your orders will appear here once you make a purchase
              </Text>
              <TouchableOpacity
                className="bg-green-500 px-6 py-3 rounded-lg mt-6"
                onPress={() => navigation.navigate('MarketplaceHome')}
              >
                <Text className="text-white font-semibold">Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
