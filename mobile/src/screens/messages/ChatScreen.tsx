import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { messageService } from '../../api/services';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, otherUser } = route.params;
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    navigation.setOptions({
      title: otherUser.displayName || otherUser.username,
    });
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await messageService.getMessages(token!, conversationId);
      setMessages(response.data.messages);
      setLoading(false);
    } catch (error) {
      console.error('Load messages error:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await messageService.sendMessage(token!, {
        recipientId: otherUser.id,
        content: messageText.trim(),
      });

      // Add message to list
      setMessages([...messages, response.data]);
      setMessageText('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.id;

    return (
      <View
        className={`mb-3 px-4 ${isMine ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
            isMine ? 'bg-green-500' : 'bg-gray-200'
          }`}
        >
          <Text className={isMine ? 'text-white' : 'text-gray-900'}>
            {item.content}
          </Text>
        </View>
        <Text className="text-gray-500 text-xs mt-1">
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pt-4"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message Input */}
      <View className="flex-row items-center p-3 border-t border-gray-200">
        <TouchableOpacity className="mr-2">
          <Ionicons name="image-outline" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 py-2"
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          className="ml-2 bg-green-500 w-10 h-10 rounded-full items-center justify-center"
          onPress={sendMessage}
          disabled={sending || !messageText.trim()}
        >
          <Ionicons name="send" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
