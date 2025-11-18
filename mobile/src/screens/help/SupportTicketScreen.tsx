import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function SupportTicketScreen({ route, navigation }: any) {
  const { ticketId } = route.params;
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadTicket();
    const interval = setInterval(loadTicket, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const loadTicket = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/help/tickets/${ticketId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/help/tickets/${ticketId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNewMessage('');
        loadTicket();
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ASSIGNED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-purple-100 text-purple-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender.id === user?.id;
    const isSupport = item.sender.role === 'ADMIN';

    return (
      <View className={`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
        <View className="flex-row items-end max-w-[80%]">
          {!isMe && (
            <View className="w-8 h-8 rounded-full bg-gray-300 items-center justify-center mr-2">
              <Text className="text-gray-600 font-bold">
                {item.sender.displayName?.[0] || 'S'}
              </Text>
            </View>
          )}

          <View>
            {!isMe && (
              <View className="flex-row items-center mb-1">
                <Text className="text-gray-900 font-medium text-sm">
                  {item.sender.displayName}
                </Text>
                {isSupport && (
                  <View className="bg-blue-100 px-2 py-0.5 rounded ml-2">
                    <Text className="text-blue-700 text-xs font-medium">Support</Text>
                  </View>
                )}
              </View>
            )}

            <View
              className={`p-3 rounded-lg ${
                isMe ? 'bg-green-500' : isSupport ? 'bg-blue-50' : 'bg-gray-100'
              }`}
            >
              <Text className={isMe ? 'text-white' : 'text-gray-900'}>{item.message}</Text>
            </View>

            <Text className="text-gray-500 text-xs mt-1">
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {isMe && (
            <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center ml-2">
              <Text className="text-white font-bold">{user?.displayName?.[0] || 'Y'}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-lg">{ticket.subject}</Text>
            <Text className="text-gray-500 text-sm mt-1">Ticket #{ticket.ticketNumber}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
            <Text className="text-xs font-medium">{ticket.status}</Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3">
          <View className="flex-row items-center mr-4">
            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-1">{ticket.category}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="flag-outline" size={16} color="#6B7280" />
            <Text className={`text-sm ml-1 font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </Text>
          </View>
        </View>

        {ticket.assignedTo && (
          <View className="bg-blue-50 p-2 rounded-lg mt-3 flex-row items-center">
            <Ionicons name="person-circle-outline" size={20} color="#3B82F6" />
            <Text className="text-blue-900 ml-2 text-sm">
              Assigned to: {ticket.assignedTo.displayName}
            </Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4">No messages yet</Text>
          </View>
        }
      />

      {/* Input */}
      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
        <View className="border-t border-gray-200 p-4 bg-white">
          <View className="flex-row items-end">
            <View className="flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2">
              <TextInput
                className="text-gray-900"
                placeholder="Type your message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              className={`w-12 h-12 rounded-lg items-center justify-center ${
                sending || !newMessage.trim() ? 'bg-gray-400' : 'bg-green-500'
              }`}
              onPress={handleSendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
        <View className="border-t border-gray-200 p-4 bg-green-50">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text className="text-green-700 ml-2 font-medium">
              This ticket has been {ticket.status.toLowerCase()}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
