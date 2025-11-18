import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function BulletinManagerScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [bulletins, setBulletins] = useState([
    { id: '1', title: 'Welcome to my channel!', content: 'Thanks for subscribing...', tier: 'ALL', sentAt: new Date(), views: 120 },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tier, setTier] = useState('ALL');

  const handleCreate = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      // API call
      const newBulletin = {
        id: Date.now().toString(),
        title,
        content,
        tier,
        sentAt: new Date(),
        views: 0,
      };
      setBulletins([newBulletin, ...bulletins]);
      setShowCreate(false);
      setTitle('');
      setContent('');
      Alert.alert('Success', 'Bulletin sent to subscribers!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send bulletin');
    }
  };

  const renderBulletin = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-lg">{item.title}</Text>
          <Text className="text-gray-600 mt-1" numberOfLines={2}>{item.content}</Text>
        </View>
        <View className={`px-2 py-1 rounded ml-2 ${
          item.tier === 'ALL' ? 'bg-gray-100' :
          item.tier === 'PREMIUM' ? 'bg-purple-100' : 'bg-yellow-100'
        }`}>
          <Text className={`text-xs ${
            item.tier === 'ALL' ? 'text-gray-700' :
            item.tier === 'PREMIUM' ? 'text-purple-700' : 'text-yellow-700'
          }`}>
            {item.tier}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200">
        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-1">{item.views} views</Text>
        </View>
        <Text className="text-gray-500 text-sm">
          {new Date(item.sentAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Bulletin Manager</Text>
        <Text className="text-gray-600 mt-1">Send updates to your subscribers</Text>
      </View>

      <FlatList
        data={bulletins}
        renderItem={renderBulletin}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 font-semibold mt-4">No bulletins yet</Text>
            <Text className="text-gray-600 text-center mt-2">
              Send announcements to your subscribers
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-green-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">New Bulletin</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 mb-3"
              placeholder="Bulletin title"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 mb-3"
              placeholder="Bulletin content"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text className="text-gray-700 mb-2">Send to:</Text>
            <View className="flex-row mb-4">
              {['ALL', 'PREMIUM', 'VIP'].map(t => (
                <TouchableOpacity
                  key={t}
                  className={`px-4 py-2 rounded-lg mr-2 ${tier === t ? 'bg-green-500' : 'bg-gray-100'}`}
                  onPress={() => setTier(t)}
                >
                  <Text className={tier === t ? 'text-white' : 'text-gray-700'}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-green-500 py-4 rounded-lg"
              onPress={handleCreate}
            >
              <Text className="text-white font-bold text-center">Send Bulletin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
