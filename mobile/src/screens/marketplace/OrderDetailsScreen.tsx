import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    Alert.alert(
      'Pay Order',
      `Pay ₦${order.total.toLocaleString()} from your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              setPaying(true);
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/orders/${orderId}/pay`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ paymentMethod: 'wallet' }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Payment processed successfully!');
                loadOrder();
              } else {
                Alert.alert('Error', data.error || 'Payment failed');
              }
            } catch (error) {
              console.error('Error paying order:', error);
              Alert.alert('Error', 'Payment failed');
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Tracking number copied to clipboard');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    );
  }

  const timeline = [
    { status: 'PENDING', label: 'Order Placed', completed: true },
    {
      status: 'PROCESSING',
      label: 'Processing',
      completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
    },
    {
      status: 'SHIPPED',
      label: 'Shipped',
      completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
    },
    { status: 'DELIVERED', label: 'Delivered', completed: order.status === 'DELIVERED' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-gray-500 text-sm">Order Number</Text>
        <Text className="text-gray-900 font-bold text-xl mt-1">{order.orderNumber}</Text>
        <Text className="text-gray-500 text-sm mt-2">
          {new Date(order.createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Timeline */}
      {order.status !== 'CANCELLED' && (
        <View className="bg-white p-4 mt-3">
          <Text className="text-gray-900 font-semibold mb-4">Order Status</Text>
          <View className="space-y-3">
            {timeline.map((step, idx) => (
              <View key={step.status} className="flex-row items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  {step.completed ? (
                    <Ionicons name="checkmark" size={20} color="white" />
                  ) : (
                    <View className="w-3 h-3 bg-white rounded-full" />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <View className="bg-white p-4 mt-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-sm">Tracking Number</Text>
              <Text className="text-gray-900 font-semibold mt-1">{order.trackingNumber}</Text>
            </View>
            <TouchableOpacity
              className="bg-gray-100 p-2 rounded-lg"
              onPress={() => copyToClipboard(order.trackingNumber)}
            >
              <Ionicons name="copy-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Items */}
      <View className="bg-white p-4 mt-3">
        <Text className="text-gray-900 font-semibold mb-3">Order Items</Text>
        {order.items.map((item: any, idx: number) => (
          <View key={idx} className="flex-row mb-3 pb-3 border-b border-gray-200">
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/80' }}
              className="w-20 h-20 rounded"
              resizeMode="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-medium" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">Qty: {item.quantity}</Text>
              <Text className="text-green-600 font-bold mt-1">
                ₦{item.price.toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Shipping Address */}
      <View className="bg-white p-4 mt-3">
        <Text className="text-gray-900 font-semibold mb-2">Shipping Address</Text>
        <View className="flex-row">
          <Ionicons name="location-outline" size={20} color="#6B7280" />
          <View className="ml-2 flex-1">
            <Text className="text-gray-900">{order.shippingAddress.fullName}</Text>
            <Text className="text-gray-600 mt-1">{order.shippingAddress.address}</Text>
            <Text className="text-gray-600">
              {order.shippingAddress.city}, {order.shippingAddress.state}
            </Text>
            <Text className="text-gray-600">{order.shippingAddress.phone}</Text>
          </View>
        </View>
      </View>

      {/* Merchant */}
      <View className="bg-white p-4 mt-3">
        <Text className="text-gray-900 font-semibold mb-2">Merchant</Text>
        <View className="flex-row items-center">
          <Ionicons name="storefront-outline" size={20} color="#6B7280" />
          <Text className="text-gray-900 ml-2">{order.merchant.businessName}</Text>
        </View>
        <Text className="text-gray-600 text-sm mt-1">{order.merchant.businessPhone}</Text>
      </View>

      {/* Payment Summary */}
      <View className="bg-white p-4 mt-3 mb-3">
        <Text className="text-gray-900 font-semibold mb-3">Payment Summary</Text>

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="text-gray-900">₦{order.subtotal.toLocaleString()}</Text>
        </View>

        {order.discount > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Discount</Text>
            <Text className="text-green-600">-₦{order.discount.toLocaleString()}</Text>
          </View>
        )}

        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Shipping Fee</Text>
          <Text className="text-gray-900">₦{order.shippingFee.toLocaleString()}</Text>
        </View>

        <View className="border-t border-gray-200 pt-2 mt-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-900 font-bold text-lg">Total</Text>
            <Text className="text-green-600 font-bold text-lg">
              ₦{order.total.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <View className={`px-3 py-2 rounded-lg ${order.paymentStatus === 'PAID' ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <Text className={`text-center font-medium ${order.paymentStatus === 'PAID' ? 'text-green-700' : 'text-yellow-700'}`}>
              Payment Status: {order.paymentStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {order.paymentStatus === 'PENDING' && (
        <View className="p-4">
          <TouchableOpacity
            className={`py-4 rounded-lg ${paying ? 'bg-gray-400' : 'bg-green-500'}`}
            onPress={handlePayNow}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-center text-base">Pay Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
