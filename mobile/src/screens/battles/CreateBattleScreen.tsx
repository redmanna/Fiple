import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function CreateBattleScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [battleType, setBattleType] = useState('PK_BATTLE');
  const [inviteType, setInviteType] = useState('FOLLOWERS');
  const [duration, setDuration] = useState(300); // 5 minutes

  const battleTypes = [
    { value: 'PK_BATTLE', label: 'PK Battle', icon: 'flash', desc: 'Head-to-head competition' },
    { value: 'TEAM_BATTLE', label: 'Team Battle', icon: 'people', desc: 'Team vs Team' },
    { value: 'GIFT_WAR', label: 'Gift War', icon: 'gift', desc: 'Highest gifts wins' },
    { value: 'TALENT_SHOWDOWN', label: 'Talent Showdown', icon: 'mic', desc: 'Viewers vote for winner' },
  ];

  const inviteTypes = [
    { value: 'PRIVATE', label: 'Private', icon: 'lock-closed', desc: 'Invite specific users' },
    { value: 'FOLLOWERS', label: 'Followers', icon: 'people', desc: 'Any follower can join' },
    { value: 'OPEN', label: 'Open', icon: 'globe', desc: 'Anyone can join' },
  ];

  const durations = [
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
  ];

  const handleCreateBattle = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/battles/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            battleType,
            inviteType,
            duration,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Battle created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('LiveBattle', { battleId: data.battle.id }),
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to create battle');
      }
    } catch (error) {
      console.error('Error creating battle:', error);
      Alert.alert('Error', 'Failed to create battle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Battle Type */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Battle Type</Text>

          {battleTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`border-2 rounded-lg p-3 mb-3 ${battleType === type.value ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
              onPress={() => setBattleType(type.value)}
            >
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${battleType === type.value ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <Ionicons name={type.icon as any} size={24} color={battleType === type.value ? 'white' : '#6B7280'} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-gray-900">{type.label}</Text>
                  <Text className="text-gray-600 text-sm">{type.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invite Type */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Who Can Join?</Text>

          {inviteTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`border-2 rounded-lg p-3 mb-3 ${inviteType === type.value ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
              onPress={() => setInviteType(type.value)}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={inviteType === type.value ? '#10B981' : '#6B7280'}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-gray-900">{type.label}</Text>
                  <Text className="text-gray-600 text-sm">{type.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Battle Duration</Text>

          <View className="flex-row flex-wrap">
            {durations.map((d) => (
              <TouchableOpacity
                key={d.value}
                className={`px-4 py-3 rounded-lg mr-2 mb-2 ${duration === d.value ? 'bg-green-500' : 'bg-gray-200'}`}
                onPress={() => setDuration(d.value)}
              >
                <Text className={`font-medium ${duration === d.value ? 'text-white' : 'text-gray-700'}`}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prize Pool Info */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-yellow-900 mb-1">
                Prize Distribution
              </Text>
              <Text className="text-yellow-700 text-sm">
                • Winner: 60% of prize pool{'\n'}
                • Runner-up: 30% of prize pool{'\n'}
                • Platform: 10% platform fee
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleCreateBattle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center text-base">
              Create Battle
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
