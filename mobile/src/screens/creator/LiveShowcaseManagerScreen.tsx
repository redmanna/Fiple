import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LiveShowcaseManagerScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [showcasedProducts, setShowcasedProducts] = useState([
    {
      id: '1',
      name: 'Product Name',
      price: 5000,
      image: null,
      merchantName: 'Merchant ABC',
      commissionRate: 15,
      clicks: 45,
      sales: 8,
      earnings: 6000,
    },
  ]);

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove Product',
      'Remove this product from showcase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setShowcasedProducts(prev => prev.filter(p => p.id !== id));
            Alert.alert('Success', 'Product removed from showcase');
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row">
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/80' }}
          className="w-20 h-20 rounded"
          resizeMode="cover"
        />
        <View className="ml-3 flex-1">
          <Text className="text-gray-900 font-semibold" numberOfLines={2}>{item.name}</Text>
          <Text className="text-gray-600 text-sm mt-1">{item.merchantName}</Text>
          <Text className="text-green-600 font-bold mt-1">₦{item.price.toLocaleString()}</Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600 text-sm">Commission Rate</Text>
          <Text className="text-gray-900 font-semibold">{item.commissionRate}%</Text>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600 text-sm">Clicks</Text>
          <Text className="text-gray-900 font-semibold">{item.clicks}</Text>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600 text-sm">Sales</Text>
          <Text className="text-green-600 font-semibold">{item.sales}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-gray-600 text-sm">Earnings</Text>
          <Text className="text-green-600 font-bold">₦{item.earnings.toLocaleString()}</Text>
        </View>
      </View>

      <View className="flex-row mt-3">
        <TouchableOpacity
          className="flex-1 bg-green-500 py-3 rounded-lg mr-2"
          onPress={() => {/* Add to live stream */}}
        >
          <Text className="text-white font-semibold text-center">Showcase Live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 px-4 py-3 rounded-lg"
          onPress={() => handleRemove(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Live Showcase</Text>
        <Text className="text-gray-600 mt-1">Promote products during live streams</Text>
      </View>

      <FlatList
        data={showcasedProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="bag-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 font-semibold mt-4">No products in showcase</Text>
            <Text className="text-gray-600 text-center mt-2 px-6">
              Add affiliated products to showcase during your live streams
            </Text>
            <TouchableOpacity
              className="bg-green-500 px-6 py-3 rounded-lg mt-6"
              onPress={() => navigation.navigate('MyPartnerships')}
            >
              <Text className="text-white font-semibold">View Partnerships</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
