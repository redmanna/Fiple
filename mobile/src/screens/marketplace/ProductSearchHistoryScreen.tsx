import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@fiple_recent_searches';
const TRENDING_SEARCHES = [
  'iPhone 15',
  'Nike Shoes',
  'Samsung TV',
  'Gaming Laptop',
  'Wireless Earbuds',
];

export default function ProductSearchHistoryScreen({ navigation }: any) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

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

  const clearHistory = () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
              setRecentSearches([]);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const handleSearch = (query: string) => {
    navigation.navigate('ProductSearch', { query });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Search History</Text>
      </View>

      <View className="p-4">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-semibold">Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text className="text-red-600 text-sm">Clear All</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-lg shadow-sm mb-6">
              {recentSearches.map((search, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="flex-row items-center p-4 border-b border-gray-200"
                  onPress={() => handleSearch(search)}
                >
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-900 ml-3 flex-1">{search}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Trending Searches */}
        <Text className="text-gray-900 font-semibold mb-3">Trending Searches</Text>
        <View className="bg-white rounded-lg shadow-sm">
          {TRENDING_SEARCHES.map((search, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-row items-center p-4 border-b border-gray-200"
              onPress={() => handleSearch(search)}
            >
              <Ionicons name="trending-up-outline" size={20} color="#10B981" />
              <Text className="text-gray-900 ml-3 flex-1">{search}</Text>
              <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
