import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function LiveBattleScreen({ route, navigation }: any) {
  const { battleId } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [battle, setBattle] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  const gifts = [
    { type: 'ROSE', name: 'Rose', price: 50, icon: '🌹' },
    { type: 'HEART', name: 'Heart', price: 100, icon: '❤️' },
    { type: 'STAR', name: 'Star', price: 200, icon: '⭐' },
    { type: 'DIAMOND', name: 'Diamond', price: 500, icon: '💎' },
    { type: 'CROWN', name: 'Crown', price: 1000, icon: '👑' },
    { type: 'ROCKET', name: 'Rocket', price: 2000, icon: '🚀' },
    { type: 'FERRARI', name: 'Ferrari', price: 5000, icon: '🏎️' },
    { type: 'MANSION', name: 'Mansion', price: 10000, icon: '🏰' },
  ];

  useEffect(() => {
    loadBattle();
    const interval = setInterval(loadLeaderboard, 2000); // Update every 2s
    return () => clearInterval(interval);
  }, []);

  const loadBattle = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setBattle(data.battle);
    } catch (error) {
      console.error('Error loading battle:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}/leaderboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleSendGift = async (recipientSide: 'host1' | 'host2', giftType: string, price: number) => {
    Alert.alert(
      'Send Gift',
      `Send ${giftType} for ₦${price.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}/gift`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    recipientSide,
                    giftType,
                    quantity: 1,
                  }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Gift sent!');
                loadLeaderboard();
              } else {
                Alert.alert('Error', data.error || 'Failed to send gift');
              }
            } catch (error) {
              console.error('Error sending gift:', error);
              Alert.alert('Error', 'Failed to send gift');
            }
          },
        },
      ]
    );
  };

  const handleVote = async (votedFor: 'host1' | 'host2') => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ votedFor }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Vote recorded!');
        loadLeaderboard();
      } else {
        Alert.alert('Error', data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const host1 = leaderboard?.leaderboard?.[0];
  const host2 = leaderboard?.leaderboard?.[1];
  const isTalentShowdown = battle?.battleType === 'TALENT_SHOWDOWN';

  return (
    <View className="flex-1 bg-black">
      {/* Split Screen */}
      <View className="flex-1 flex-row">
        {/* Host 1 */}
        <TouchableOpacity
          className="flex-1 bg-blue-900 items-center justify-center"
          onPress={() => !isTalentShowdown && setShowGifts(!showGifts)}
        >
          <Text className="text-white text-2xl font-bold mb-4">{host1?.displayName || 'Host 1'}</Text>
          <Text className="text-white text-5xl font-bold">
            {isTalentShowdown ? host1?.votes || 0 : Math.floor(host1?.score || 0)}
          </Text>
          <Text className="text-white text-sm mt-2">
            {isTalentShowdown ? 'votes' : 'points'}
          </Text>
          {!isTalentShowdown && (
            <View className="mt-4">
              <Text className="text-white text-lg">{host1?.gifts || 0} 🎁</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* VS Divider */}
        <View className="w-20 items-center justify-center bg-gray-900">
          <Text className="text-white font-bold text-2xl">VS</Text>
          <View className="mt-4 bg-red-500 px-3 py-2 rounded-full">
            <Text className="text-white font-bold">LIVE</Text>
          </View>
        </View>

        {/* Host 2 */}
        <TouchableOpacity
          className="flex-1 bg-red-900 items-center justify-center"
          onPress={() => !isTalentShowdown && setShowGifts(!showGifts)}
        >
          <Text className="text-white text-2xl font-bold mb-4">{host2?.displayName || 'Host 2'}</Text>
          <Text className="text-white text-5xl font-bold">
            {isTalentShowdown ? host2?.votes || 0 : Math.floor(host2?.score || 0)}
          </Text>
          <Text className="text-white text-sm mt-2">
            {isTalentShowdown ? 'votes' : 'points'}
          </Text>
          {!isTalentShowdown && (
            <View className="mt-4">
              <Text className="text-white text-lg">{host2?.gifts || 0} 🎁</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Prize Pool */}
      <View className="bg-yellow-500 py-2">
        <Text className="text-center text-gray-900 font-bold">
          Prize Pool: ₦{leaderboard?.battle?.prizePool?.toLocaleString() || '0'}
        </Text>
      </View>

      {/* Actions */}
      {showGifts ? (
        <View className="bg-gray-900 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-lg">Send Gift</Text>
            <TouchableOpacity onPress={() => setShowGifts(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap">
            {gifts.map((gift) => (
              <TouchableOpacity
                key={gift.type}
                className="w-1/4 items-center p-2"
                onPress={() => setSelectedGift(gift.type)}
              >
                <Text className="text-4xl mb-1">{gift.icon}</Text>
                <Text className="text-white text-xs">{gift.name}</Text>
                <Text className="text-yellow-400 text-xs">₦{gift.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedGift && (
            <View className="flex-row mt-4">
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-lg mr-2"
                onPress={() => {
                  const gift = gifts.find(g => g.type === selectedGift);
                  handleSendGift('host1', selectedGift, gift!.price);
                }}
              >
                <Text className="text-white font-bold text-center">Send to Host 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 py-3 rounded-lg ml-2"
                onPress={() => {
                  const gift = gifts.find(g => g.type === selectedGift);
                  handleSendGift('host2', selectedGift, gift!.price);
                }}
              >
                <Text className="text-white font-bold text-center">Send to Host 2</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : isTalentShowdown ? (
        <View className="bg-gray-900 p-4">
          <Text className="text-white font-bold text-center mb-3">Vote for Winner</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 bg-blue-500 py-3 rounded-lg mr-2"
              onPress={() => handleVote('host1')}
            >
              <Text className="text-white font-bold text-center">Vote Host 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-500 py-3 rounded-lg ml-2"
              onPress={() => handleVote('host2')}
            >
              <Text className="text-white font-bold text-center">Vote Host 2</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          className="bg-green-500 p-4"
          onPress={() => setShowGifts(true)}
        >
          <Text className="text-white font-bold text-center text-lg">Send Gift 🎁</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
