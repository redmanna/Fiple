import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function CheckoutScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');

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

  const handleCheckout = async () => {
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shippingAddress,
            shippingMethod,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Order created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Orders'),
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const shippingFee = shippingMethod === 'express' ? 2500 : 1000;
  const total = (cart?.subtotal || 0) + shippingFee;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Shipping Address */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Shipping Address</Text>

          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            placeholder="Full Name *"
            value={shippingAddress.fullName}
            onChangeText={(text) => setShippingAddress({ ...shippingAddress, fullName: text })}
          />

          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            placeholder="Phone Number *"
            value={shippingAddress.phone}
            onChangeText={(text) => setShippingAddress({ ...shippingAddress, phone: text })}
            keyboardType="phone-pad"
          />

          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            placeholder="Street Address *"
            value={shippingAddress.address}
            onChangeText={(text) => setShippingAddress({ ...shippingAddress, address: text })}
            multiline
            numberOfLines={2}
          />

          <View className="flex-row mb-3">
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 mr-2"
              placeholder="City *"
              value={shippingAddress.city}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
              placeholder="State *"
              value={shippingAddress.state}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, state: text })}
            />
          </View>

          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Zip Code"
            value={shippingAddress.zipCode}
            onChangeText={(text) => setShippingAddress({ ...shippingAddress, zipCode: text })}
            keyboardType="number-pad"
          />
        </View>

        {/* Shipping Method */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Shipping Method</Text>

          <TouchableOpacity
            className={`border-2 rounded-lg p-3 mb-3 ${shippingMethod === 'standard' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
            onPress={() => setShippingMethod('standard')}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-semibold text-gray-900">Standard Delivery</Text>
                <Text className="text-gray-600 text-sm">3-5 business days</Text>
              </View>
              <Text className="font-bold text-gray-900">₦1,000</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`border-2 rounded-lg p-3 ${shippingMethod === 'express' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
            onPress={() => setShippingMethod('express')}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-semibold text-gray-900">Express Delivery</Text>
                <Text className="text-gray-600 text-sm">1-2 business days</Text>
              </View>
              <Text className="font-bold text-gray-900">₦2,500</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Order Summary</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-900">₦{cart?.subtotal.toLocaleString()}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Shipping Fee</Text>
            <Text className="text-gray-900">₦{shippingFee.toLocaleString()}</Text>
          </View>

          <View className="border-t border-gray-200 pt-2 mt-2">
            <View className="flex-row justify-between">
              <Text className="font-bold text-gray-900 text-lg">Total</Text>
              <Text className="font-bold text-green-600 text-lg">₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-lg ${processing ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleCheckout}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center text-base">
              Place Order
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
