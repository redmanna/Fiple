import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { messageService } from '../../api/services';

export default function MessagesListScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await messageService.getConversations(token!);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return msgDate.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-100"
      onPress={() => navigation.navigate('ChatScreen', {
        conversationId: item.id,
        otherUser: item.otherUser,
      })}
    >
      <Image
        source={{ uri: item.otherUser?.avatar || 'https://via.placeholder.com/50' }}
        className="w-12 h-12 rounded-full"
      />

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-gray-900 font-semibold">
            {item.otherUser?.displayName || item.otherUser?.username}
          </Text>
          <Text className="text-gray-500 text-xs">
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm flex-1 ${
              item.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
            numberOfLines={1}
          >
            {item.lastMessageText || 'No messages yet'}
          </Text>

          {item.unreadCount > 0 && (
            <View className="bg-green-500 rounded-full w-5 h-5 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-green-500 p-4 pt-12">
        <Text className="text-white text-2xl font-bold">Messages</Text>
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 font-bold text-xl mt-4">No messages yet</Text>
          <Text className="text-gray-600 text-center mt-2">
            Follow users and start conversations
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadConversations(true)} />
          }
        />
      )}
    </View>
  );
}
