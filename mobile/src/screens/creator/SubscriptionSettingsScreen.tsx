import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionSettingsScreen({ navigation }: any) {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [basicPrice, setBasicPrice] = useState('500');
  const [premiumPrice, setPremiumPrice] = useState('1000');
  const [vipPrice, setVipPrice] = useState('2000');

  const MIN_PRICES = { basic: 300, premium: 800, vip: 1500 };

  const handleSave = async () => {
    // Validation
    if (parseFloat(basicPrice) < MIN_PRICES.basic) {
      Alert.alert('Error', `Basic tier minimum is ₦${MIN_PRICES.basic}`);
      return;
    }
    if (parseFloat(premiumPrice) < MIN_PRICES.premium) {
      Alert.alert('Error', `Premium tier minimum is ₦${MIN_PRICES.premium}`);
      return;
    }
    if (parseFloat(vipPrice) < MIN_PRICES.vip) {
      Alert.alert('Error', `VIP tier minimum is ₦${MIN_PRICES.vip}`);
      return;
    }

    try {
      setLoading(true);
      // API call to save subscription settings
      Alert.alert('Success', 'Subscription settings updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Subscription Settings</Text>
        <Text className="text-gray-600 mt-1">Set your monthly subscription pricing</Text>
      </View>

      {user?.followersCount < 5000 && (
        <View className="bg-yellow-50 border border-yellow-200 p-4 m-4 rounded-lg">
          <View className="flex-row">
            <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-900 font-semibold">5,000 Followers Required</Text>
              <Text className="text-yellow-700 mt-1">
                You need {(5000 - (user?.followersCount || 0)).toLocaleString()} more followers to offer subscriptions
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="p-4">
        {/* Basic Tier */}
        <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-gray-900 font-bold text-lg">Basic Tier</Text>
              <Text className="text-gray-600 text-sm">Minimum: ₦{MIN_PRICES.basic}</Text>
            </View>
            <View className="bg-gray-100 px-3 py-1 rounded">
              <Text className="text-gray-700 text-xs">Monthly</Text>
            </View>
          </View>

          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3">
            <Text className="text-gray-900 font-semibold mr-2">₦</Text>
            <TextInput
              className="flex-1 text-gray-900 font-bold text-lg"
              placeholder="500"
              value={basicPrice}
              onChangeText={setBasicPrice}
              keyboardType="numeric"
            />
          </View>

          <Text className="text-gray-600 text-sm mt-3">Basic tier benefits:</Text>
          <View className="mt-2">
            {['Exclusive posts', 'Behind-the-scenes content', 'Monthly bulletin'].map(benefit => (
              <View key={benefit} className="flex-row items-center mb-1">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-gray-700 text-sm ml-2">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Premium Tier */}
        <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-gray-900 font-bold text-lg">Premium Tier</Text>
              <Text className="text-gray-600 text-sm">Minimum: ₦{MIN_PRICES.premium}</Text>
            </View>
            <View className="bg-purple-100 px-3 py-1 rounded">
              <Text className="text-purple-700 text-xs font-medium">Popular</Text>
            </View>
          </View>

          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3">
            <Text className="text-gray-900 font-semibold mr-2">₦</Text>
            <TextInput
              className="flex-1 text-gray-900 font-bold text-lg"
              placeholder="1000"
              value={premiumPrice}
              onChangeText={setPremiumPrice}
              keyboardType="numeric"
            />
          </View>

          <Text className="text-gray-600 text-sm mt-3">Premium tier benefits:</Text>
          <View className="mt-2">
            {['All Basic benefits', 'Priority responses', 'Weekly live Q&A', 'Special badges'].map(benefit => (
              <View key={benefit} className="flex-row items-center mb-1">
                <Ionicons name="checkmark-circle" size={16} color="#8B5CF6" />
                <Text className="text-gray-700 text-sm ml-2">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* VIP Tier */}
        <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-gray-900 font-bold text-lg">VIP Tier</Text>
              <Text className="text-gray-600 text-sm">Minimum: ₦{MIN_PRICES.vip}</Text>
            </View>
            <View className="bg-yellow-100 px-3 py-1 rounded">
              <Text className="text-yellow-700 text-xs font-medium">Exclusive</Text>
            </View>
          </View>

          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3">
            <Text className="text-gray-900 font-semibold mr-2">₦</Text>
            <TextInput
              className="flex-1 text-gray-900 font-bold text-lg"
              placeholder="2000"
              value={vipPrice}
              onChangeText={setVipPrice}
              keyboardType="numeric"
            />
          </View>

          <Text className="text-gray-600 text-sm mt-3">VIP tier benefits:</Text>
          <View className="mt-2">
            {['All Premium benefits', '1-on-1 chat access', 'Private content', 'Exclusive events', 'VIP badge'].map(benefit => (
              <View key={benefit} className="flex-row items-center mb-1">
                <Ionicons name="checkmark-circle" size={16} color="#F59E0B" />
                <Text className="text-gray-700 text-sm ml-2">{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-lg mb-8 ${loading || (user?.followersCount || 0) < 5000 ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleSave}
          disabled={loading || (user?.followersCount || 0) < 5000}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center">Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
