import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { livestreamService } from '../../api/services';

const GIFTS = [
  { type: 'ROSE', name: 'Rose', price: 50, icon: '🌹', effect: 1 },
  { type: 'HEART', name: 'Heart', price: 100, icon: '❤️', effect: 1 },
  { type: 'STAR', name: 'Star', price: 200, icon: '⭐', effect: 1 },
  { type: 'DIAMOND', name: 'Diamond', price: 500, icon: '💎', effect: 2 },
  { type: 'CROWN', name: 'Crown', price: 1000, icon: '👑', effect: 2 },
  { type: 'ROCKET', name: 'Rocket', price: 2000, icon: '🚀', effect: 2 },
  { type: 'FERRARI', name: 'Ferrari', price: 5000, icon: '🏎️', effect: 3 },
  { type: 'MANSION', name: 'Mansion', price: 10000, icon: '🏰', effect: 3 },
];

export default function LiveStreamScreen({ route, navigation }: any) {
  const { stream } = route.params;
  const { token, user } = useAuthStore();
  const [viewerId, setViewerId] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [rankings, setRankings] = useState<any[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [streamStats, setStreamStats] = useState({
    currentViewers: 0,
    totalGifts: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    joinStream();
    loadRankings();
    const interval = setInterval(loadRankings, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const joinStream = async () => {
    try {
      const response = await livestreamService.joinStream(stream.id, {
        userId: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        avatar: user?.avatar,
      });
      setViewerId(response.data.id);
    } catch (error) {
      console.error('Join stream error:', error);
    }
  };

  const loadRankings = async () => {
    try {
      const response = await livestreamService.getRankings(stream.id);
      setRankings(response.data);
    } catch (error) {
      console.error('Load rankings error:', error);
    }
  };

  const sendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await livestreamService.sendComment(token!, stream.id, {
        content: commentText,
        username: user?.username,
      });

      setComments([...comments, response.data]);
      setCommentText('');
    } catch (error) {
      console.error('Send comment error:', error);
    }
  };

  const sendGift = async (gift: any) => {
    try {
      await livestreamService.sendGift(token!, stream.id, {
        giftType: gift.type,
        quantity: 1,
      });

      Alert.alert('Success', `Sent ${gift.name} (₦${gift.price})!`);
      setShowGifts(false);
      loadRankings();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send gift');
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View className="bg-black/50 rounded-lg p-2 mb-1">
      <Text className="text-white font-semibold text-sm">{item.username}</Text>
      <Text className="text-white text-sm">{item.content}</Text>
    </View>
  );

  const renderRanking = ({ item, index }: { item: any; index: number }) => (
    <View className="flex-row items-center p-3 border-b border-gray-100">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center ${
          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'
        }`}
      >
        <Text className="text-white font-bold">{index + 1}</Text>
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-gray-900 font-semibold">{item.displayName}</Text>
        <View className="flex-row items-center mt-1">
          {item.badges?.map((badge: string) => (
            <View key={badge} className="bg-purple-100 rounded px-2 py-0.5 mr-1">
              <Text className="text-purple-700 text-xs font-medium">{badge}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="items-end">
        <Text className="text-gray-900 font-bold">{item.giftsCount} 🎁</Text>
        <Text className="text-gray-600 text-sm">₦{item.giftsValue?.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Stream Video Area (Placeholder) */}
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <Ionicons name="videocam" size={64} color="white" />
        <Text className="text-white mt-4">Live Stream View</Text>
        <Text className="text-gray-400 text-sm mt-2">{stream.title}</Text>

        {/* Stats Overlay */}
        <View className="absolute top-4 right-4 bg-black/70 rounded-lg p-2">
          <View className="flex-row items-center">
            <Ionicons name="eye" size={16} color="white" />
            <Text className="text-white ml-1 font-bold">{streamStats.currentViewers}</Text>
          </View>
        </View>

        {/* Comments Overlay */}
        <View className="absolute bottom-20 left-0 right-0 px-4">
          <FlatList
            data={comments.slice(-5)}
            renderItem={renderComment}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            style={{ maxHeight: 200 }}
          />
        </View>
      </View>

      {/* Bottom Controls */}
      <View className="bg-black/80 p-3">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2"
            placeholder="Say something..."
            placeholderTextColor="#9CA3AF"
            value={commentText}
            onChangeText={setCommentText}
          />

          <TouchableOpacity
            className="ml-2 bg-green-500 w-10 h-10 rounded-full items-center justify-center"
            onPress={sendComment}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-2 bg-purple-500 w-10 h-10 rounded-full items-center justify-center"
            onPress={() => setShowGifts(!showGifts)}
          >
            <Ionicons name="gift" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="ml-2 bg-yellow-500 w-10 h-10 rounded-full items-center justify-center"
            onPress={() => setShowRankings(!showRankings)}
          >
            <Ionicons name="trophy" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gifts Panel */}
      {showGifts && (
        <View className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-80">
          <Text className="text-gray-900 font-bold text-lg mb-3">Send Gift</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GIFTS.map((gift) => (
              <TouchableOpacity
                key={gift.type}
                className="items-center mr-4"
                onPress={() => sendGift(gift)}
              >
                <View className="bg-purple-100 w-16 h-16 rounded-full items-center justify-center">
                  <Text className="text-3xl">{gift.icon}</Text>
                </View>
                <Text className="text-gray-900 font-semibold text-sm mt-1">{gift.name}</Text>
                <Text className="text-green-600 font-bold text-xs">₦{gift.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Rankings Panel */}
      {showRankings && (
        <View className="absolute top-0 bottom-0 right-0 w-80 bg-white shadow-lg">
          <View className="bg-yellow-500 p-4 flex-row items-center justify-between">
            <Text className="text-white font-bold text-lg">Top Viewers</Text>
            <TouchableOpacity onPress={() => setShowRankings(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={rankings}
            renderItem={renderRanking}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}
    </View>
  );
}
