import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ContentModerationScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [flaggedContent, setFlaggedContent] = useState([
    { id: '1', type: 'post', reason: 'Spam', reporter: 'user123', content: { text: 'Sample flagged post...', image: null } },
    { id: '2', type: 'comment', reason: 'Harassment', reporter: 'user456', content: { text: 'Sample flagged comment...', image: null } },
  ]);

  const handleModerate = async (id: string, action: 'approve' | 'remove' | 'warn') => {
    Alert.alert(
      'Confirm Action',
      `${action.charAt(0).toUpperCase() + action.slice(1)} this content?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'remove' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              // API call would go here
              setFlaggedContent(prev => prev.filter(item => item.id !== id));
              Alert.alert('Success', `Content ${action}ed successfully`);
            } catch (error) {
              console.error('Error moderating content:', error);
              Alert.alert('Error', 'Failed to moderate content');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-start mb-3">
        <View className="bg-red-100 w-10 h-10 rounded-full items-center justify-center">
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-gray-900 font-semibold">{item.type.toUpperCase()}</Text>
            <View className="bg-red-100 px-2 py-1 rounded">
              <Text className="text-red-700 text-xs font-medium">{item.reason}</Text>
            </View>
          </View>
          <Text className="text-gray-600 text-sm">Reported by: @{item.reporter}</Text>
        </View>
      </View>

      {item.content.image && (
        <Image source={{ uri: item.content.image }} className="w-full h-48 rounded-lg mb-3" />
      )}

      <Text className="text-gray-900 mb-4">{item.content.text}</Text>

      <View className="flex-row">
        <TouchableOpacity
          className="flex-1 bg-green-500 py-3 rounded-lg mr-2"
          onPress={() => handleModerate(item.id, 'approve')}
        >
          <Text className="text-white font-semibold text-center">Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-yellow-500 py-3 rounded-lg mx-1"
          onPress={() => handleModerate(item.id, 'warn')}
        >
          <Text className="text-white font-semibold text-center">Warn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-red-500 py-3 rounded-lg ml-2"
          onPress={() => handleModerate(item.id, 'remove')}
        >
          <Text className="text-white font-semibold text-center">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Content Moderation</Text>
        <Text className="text-gray-600 mt-1">Review flagged content</Text>
      </View>

      <FlatList
        data={flaggedContent}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text className="text-gray-900 font-semibold mt-4">All caught up!</Text>
            <Text className="text-gray-600">No flagged content to review</Text>
          </View>
        }
      />
    </View>
  );
}
