import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@fiple_recent_searches';

export default function ProductSearchScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Food', 'Books', 'Beauty', 'Sports', 'Home'];
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounce = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
    }
  }, [searchQuery, selectedCategory, sortBy, minPrice, maxPrice]);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    try {
      setLoading(true);
      saveRecentSearch(searchQuery.trim());

      const params = new URLSearchParams({
        q: searchQuery,
        ...(selectedCategory && { category: selectedCategory }),
        ...(sortBy && { sort: sortBy }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/products/search?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setResults(data.products || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      className="flex-row bg-white rounded-lg mb-2 p-3 shadow-sm"
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/100' }}
        className="w-20 h-20 rounded"
        resizeMode="cover"
      />
      <View className="ml-3 flex-1">
        <Text className="text-gray-900 font-semibold" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center mt-1">
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text className="text-gray-600 text-xs ml-1">
            {item.rating?.toFixed(1) || '0.0'}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-green-600 font-bold">₦{item.price.toLocaleString()}</Text>
          {item.discountPercent && (
            <View className="bg-red-100 px-2 py-1 rounded">
              <Text className="text-red-600 text-xs font-bold">-{item.discountPercent}%</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-gray-900"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="ml-3"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="bg-white p-4 border-b border-gray-200">
          {/* Categories */}
          <Text className="text-sm font-semibold text-gray-900 mb-2">Category</Text>
          <View className="flex-row flex-wrap mb-4">
            <TouchableOpacity
              className={`px-3 py-2 rounded-full mr-2 mb-2 ${!selectedCategory ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setSelectedCategory(null)}
            >
              <Text className={!selectedCategory ? 'text-white' : 'text-gray-700'}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                className={`px-3 py-2 rounded-full mr-2 mb-2 ${selectedCategory === cat ? 'bg-green-500' : 'bg-gray-100'}`}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text className={selectedCategory === cat ? 'text-white' : 'text-gray-700'}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort */}
          <Text className="text-sm font-semibold text-gray-900 mb-2">Sort By</Text>
          <View className="flex-row flex-wrap mb-4">
            {sortOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                className={`px-3 py-2 rounded-full mr-2 mb-2 ${sortBy === opt.value ? 'bg-green-500' : 'bg-gray-100'}`}
                onPress={() => setSortBy(opt.value)}
              >
                <Text className={sortBy === opt.value ? 'text-white text-xs' : 'text-gray-700 text-xs'}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Range */}
          <Text className="text-sm font-semibold text-gray-900 mb-2">Price Range</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2"
              placeholder="Min"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="number-pad"
            />
            <Text className="text-gray-500">-</Text>
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 ml-2"
              placeholder="Max"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : searchQuery.length < 2 ? (
        <View className="p-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 font-semibold">Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text className="text-green-600 text-sm">Clear All</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="flex-row items-center py-3 border-b border-gray-200"
                  onPress={() => setSearchQuery(search)}
                >
                  <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                  <Text className="ml-3 text-gray-900 flex-1">{search}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="search-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-4 text-lg">
                No products found
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
