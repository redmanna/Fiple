import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function HelpArticleScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<any>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);

  useEffect(() => {
    loadArticle();
  }, []);

  const loadArticle = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/help/articles/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setArticle(data.article);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (isHelpful: boolean) => {
    setHelpful(isHelpful);
    // API call to record feedback
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!article) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Article not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-3xl font-bold text-gray-900 mb-2">{article.title}</Text>

        <View className="flex-row items-center mb-4">
          <View className="bg-green-100 px-3 py-1 rounded mr-2">
            <Text className="text-green-700 text-xs font-medium">{article.category}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="eye-outline" size={14} color="#6B7280" />
            <Text className="text-gray-600 text-xs ml-1">{article.viewCount} views</Text>
          </View>
        </View>

        <View className="bg-gray-50 p-4 rounded-lg mb-4">
          <Text className="text-gray-900 leading-6">{article.content}</Text>
        </View>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <View className="mt-6">
            <Text className="text-gray-900 font-semibold text-lg mb-3">Related Articles</Text>
            {article.relatedArticles.map((related: any) => (
              <TouchableOpacity
                key={related.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-2"
                onPress={() => navigation.push('HelpArticle', { slug: related.slug })}
              >
                <Text className="text-gray-900 font-medium">{related.title}</Text>
                <Text className="text-gray-600 text-sm mt-1">{related.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Feedback */}
        <View className="mt-8 pt-8 border-t border-gray-200">
          <Text className="text-gray-900 font-semibold mb-4 text-center">Was this article helpful?</Text>
          <View className="flex-row justify-center">
            <TouchableOpacity
              className={`flex-1 mr-2 py-4 rounded-lg border-2 ${helpful === true ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'}`}
              onPress={() => handleFeedback(true)}
            >
              <View className="items-center">
                <Ionicons name="thumbs-up" size={24} color={helpful === true ? '#10B981' : '#6B7280'} />
                <Text className={`mt-2 font-medium ${helpful === true ? 'text-green-700' : 'text-gray-700'}`}>
                  Yes
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 ml-2 py-4 rounded-lg border-2 ${helpful === false ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}
              onPress={() => handleFeedback(false)}
            >
              <View className="items-center">
                <Ionicons name="thumbs-down" size={24} color={helpful === false ? '#EF4444' : '#6B7280'} />
                <Text className={`mt-2 font-medium ${helpful === false ? 'text-red-700' : 'text-gray-700'}`}>
                  No
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          className="bg-blue-500 py-4 rounded-lg mt-6"
          onPress={handleShare}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="share-social-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Share Article</Text>
          </View>
        </TouchableOpacity>

        {/* Still Need Help */}
        <View className="mt-8 bg-gray-50 p-4 rounded-lg">
          <Text className="text-gray-900 font-semibold mb-2">Still need help?</Text>
          <TouchableOpacity
            className="bg-green-500 py-3 rounded-lg mt-2"
            onPress={() => navigation.navigate('SupportTickets')}
          >
            <Text className="text-white font-semibold text-center">Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
