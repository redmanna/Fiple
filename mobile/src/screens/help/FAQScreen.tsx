import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function FAQScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [groupedFAQs, setGroupedFAQs] = useState<Record<string, any[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/help/faqs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setGroupedFAQs(data.groupedFAQs || {});
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Frequently Asked Questions</Text>
        <Text className="text-gray-600 mt-1">Find quick answers to common questions</Text>
      </View>

      <View className="p-4">
        {Object.entries(groupedFAQs).map(([category, faqs]) => (
          <View key={category} className="mb-6">
            <Text className="text-gray-900 font-bold text-lg mb-3">{category}</Text>

            {faqs.map((faq: any) => (
              <View key={faq.id} className="bg-white rounded-lg mb-2 shadow-sm overflow-hidden">
                <TouchableOpacity
                  className="p-4 flex-row items-center justify-between"
                  onPress={() => toggleExpand(faq.id)}
                >
                  <Text className="text-gray-900 font-medium flex-1 pr-2">{faq.question}</Text>
                  <Ionicons
                    name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {expandedId === faq.id && (
                  <View className="px-4 pb-4 border-t border-gray-200">
                    <Text className="text-gray-700 mt-3 leading-6">{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Still Need Help */}
        <View className="bg-white p-4 rounded-lg mt-4">
          <Text className="text-gray-900 font-semibold mb-2 text-center">
            Didn't find what you're looking for?
          </Text>
          <TouchableOpacity
            className="bg-green-500 py-4 rounded-lg mt-3"
            onPress={() => navigation.navigate('HelpCenter')}
          >
            <Text className="text-white font-semibold text-center">Browse Help Articles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-lg mt-2"
            onPress={() => navigation.navigate('SupportTickets')}
          >
            <Text className="text-white font-semibold text-center">Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
