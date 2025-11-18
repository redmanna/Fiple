import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/cart`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setCart(data.cart);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/cart?itemId=${itemId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      loadCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Ionicons name="cart-outline" size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-900 mt-4">Your cart is empty</Text>
        <Text className="text-gray-600 text-center mt-2">
          Start shopping to add items to your cart
        </Text>
        <TouchableOpacity
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
          onPress={() => navigation.navigate('MarketplaceHome')}
        >
          <Text className="text-white font-semibold">Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView>
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Shopping Cart ({cart.totalItems} items)
          </Text>

          {cart.items.map((item: any) => (
            <View key={item.id} className="bg-white rounded-lg mb-3 p-3 shadow-sm">
              <View className="flex-row">
                <Image
                  source={{ uri: item.product.images[0] || 'https://via.placeholder.com/100' }}
                  className="w-24 h-24 rounded"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold" numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    by {item.product.merchant.businessName}
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-green-600 font-bold text-lg">
                      ₦{item.priceSnapshot.toLocaleString()}
                    </Text>
                    <Text className="text-gray-600">Qty: {item.quantity}</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <Text className="text-gray-900 font-semibold">
                  Subtotal: ₦{item.subtotal.toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id)}
                  className="flex-row items-center"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text className="text-red-500 ml-1">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Summary */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-600">Subtotal</Text>
          <Text className="text-gray-900 font-semibold text-lg">
            ₦{cart.subtotal.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-green-500 py-4 rounded-lg"
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text className="text-white font-bold text-center text-base">
            Proceed to Checkout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
