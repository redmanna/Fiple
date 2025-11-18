import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function MarketplaceHomeScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Electronics',
    'Fashion',
    'Food',
    'Books',
    'Beauty',
    'Sports',
    'Home',
  ]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/products?${selectedCategory !== 'All' ? `category=${selectedCategory}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      className="bg-white rounded-lg mb-3 overflow-hidden shadow-sm"
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/300' }}
        className="w-full h-48"
        resizeMode="cover"
      />
      {item.discountPercent && (
        <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded">
          <Text className="text-white text-xs font-bold">-{item.discountPercent}%</Text>
        </View>
      )}
      <View className="p-3">
        <Text className="text-gray-900 font-semibold text-base" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text className="text-gray-600 text-sm ml-1">
            {item.rating?.toFixed(1) || '0.0'} ({item.reviewsCount || 0})
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <View>
            <Text className="text-green-600 font-bold text-lg">
              ₦{item.price.toLocaleString()}
            </Text>
            {item.compareAtPrice && (
              <Text className="text-gray-400 text-sm line-through">
                ₦{item.compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>
          <View className="bg-gray-100 px-2 py-1 rounded">
            <Text className="text-gray-600 text-xs">{item.stock} left</Text>
          </View>
        </View>
        <Text className="text-gray-500 text-xs mt-2">
          by {item.merchant.businessName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Marketplace</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="mr-4"
              onPress={() => navigation.navigate('ProductSearch')}
            >
              <Ionicons name="search-outline" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
              <Ionicons name="cart-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200"
      >
        <View className="flex-row px-2 py-3">
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category ? 'bg-green-500' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                className={`font-medium ${
                  selectedCategory === category ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Products */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="bag-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No products found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
