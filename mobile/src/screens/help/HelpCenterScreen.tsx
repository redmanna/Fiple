import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function HelpCenterScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadHelpArticles();
  }, [selectedCategory]);

  const loadHelpArticles = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/help/articles${selectedCategory ? `?category=${selectedCategory}` : ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setArticles(data.articles || []);
      if (data.categories) {
        setCategories(['All', ...data.categories]);
      }
    } catch (error) {
      console.error('Error loading help articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderArticle = ({ item }: any) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 shadow-sm"
      onPress={() => navigation.navigate('HelpArticle', { slug: item.slug })}
    >
      <View className="flex-row items-start">
        <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
          <Ionicons name="document-text-outline" size={20} color="#10B981" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-gray-900 mb-1">{item.title}</Text>
          <View className="flex-row items-center">
            <View className="bg-gray-100 px-2 py-1 rounded mr-2">
              <Text className="text-gray-600 text-xs">{item.category}</Text>
            </View>
            <Text className="text-gray-500 text-xs">
              {item.viewCount} views
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Help Center</Text>
        <Text className="text-gray-600">Find answers and get support</Text>

        <View className="flex-row mt-3">
          <TouchableOpacity
            className="flex-1 bg-green-50 p-3 rounded-lg mr-2 flex-row items-center justify-center"
            onPress={() => navigation.navigate('HelpSearch')}
          >
            <Ionicons name="search-outline" size={20} color="#10B981" />
            <Text className="text-green-700 font-medium ml-2">Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-blue-50 p-3 rounded-lg ml-2 flex-row items-center justify-center"
            onPress={() => navigation.navigate('SupportTicket')}
          >
            <Ionicons name="headset-outline" size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-medium ml-2">Contact Support</Text>
          </TouchableOpacity>
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
                (selectedCategory === null && category === 'All') || selectedCategory === category
                  ? 'bg-green-500'
                  : 'bg-gray-100'
              }`}
              onPress={() => setSelectedCategory(category === 'All' ? null : category)}
            >
              <Text
                className={`font-medium ${
                  (selectedCategory === null && category === 'All') || selectedCategory === category
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Articles */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4">No articles found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
