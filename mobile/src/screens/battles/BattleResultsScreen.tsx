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

export default function BattleResultsScreen({ route, navigation }: any) {
  const { battleId } = route.params;
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [battle, setBattle] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const [battleRes, leaderboardRes] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/battles/${battleId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const battleData = await battleRes.json();
      const leaderboardData = await leaderboardRes.json();

      setBattle(battleData.battle);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareResults = async () => {
    try {
      await Share.share({
        message: `I just participated in a battle on Fiple! Winner: ${battle.winnerId === battle.host1Id ? leaderboard.leaderboard[0]?.displayName : leaderboard.leaderboard[1]?.displayName}. Prize: ₦${battle.winnerPrize.toLocaleString()}`,
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

  const winner = leaderboard?.leaderboard?.find((p: any) => p.id === battle.winnerId);
  const runnerUp = leaderboard?.leaderboard?.find((p: any) => p.id !== battle.winnerId);
  const iWon = battle.winnerId === user?.id;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Winner Banner */}
      <View className="bg-gradient-to-b from-yellow-400 to-yellow-500 p-8 items-center">
        <View className="bg-white rounded-full w-20 h-20 items-center justify-center mb-4">
          <Text className="text-5xl">🏆</Text>
        </View>
        <Text className="text-gray-900 font-bold text-3xl mb-2">
          {iWon ? 'You Won!' : winner?.displayName || 'Winner'}
        </Text>
        <Text className="text-gray-900 text-lg">₦{battle.winnerPrize?.toLocaleString()}</Text>
      </View>

      {/* Battle Stats */}
      <View className="bg-white p-6 mx-4 rounded-lg shadow-sm -mt-8 mb-4">
        <Text className="text-gray-900 font-bold text-xl mb-4 text-center">Final Scores</Text>

        {/* Winner */}
        <View className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
          <View className="bg-yellow-100 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Ionicons name="trophy" size={24} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-lg">{winner?.displayName}</Text>
            <View className="flex-row mt-1">
              <Text className="text-gray-600 text-sm mr-3">
                Score: {Math.floor(winner?.score || 0)}
              </Text>
              {battle.battleType === 'GIFT_WAR' && (
                <Text className="text-gray-600 text-sm">Gifts: {winner?.gifts || 0}</Text>
              )}
              {battle.battleType === 'TALENT_SHOWDOWN' && (
                <Text className="text-gray-600 text-sm">Votes: {winner?.votes || 0}</Text>
              )}
            </View>
          </View>
          <Text className="text-yellow-600 font-bold text-xl">
            ₦{battle.winnerPrize?.toLocaleString()}
          </Text>
        </View>

        {/* Runner Up */}
        <View className="flex-row items-center">
          <View className="bg-gray-100 w-12 h-12 rounded-full items-center justify-center mr-3">
            <Ionicons name="medal-outline" size={24} color="#6B7280" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-lg">{runnerUp?.displayName}</Text>
            <View className="flex-row mt-1">
              <Text className="text-gray-600 text-sm mr-3">
                Score: {Math.floor(runnerUp?.score || 0)}
              </Text>
              {battle.battleType === 'GIFT_WAR' && (
                <Text className="text-gray-600 text-sm">Gifts: {runnerUp?.gifts || 0}</Text>
              )}
              {battle.battleType === 'TALENT_SHOWDOWN' && (
                <Text className="text-gray-600 text-sm">Votes: {runnerUp?.votes || 0}</Text>
              )}
            </View>
          </View>
          <Text className="text-gray-600 font-bold">
            ₦{(battle.prizePool * 0.3)?.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Prize Distribution */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-4">
        <Text className="text-gray-900 font-semibold mb-3">Prize Distribution</Text>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">Total Prize Pool</Text>
          <Text className="text-gray-900 font-bold">₦{battle.prizePool?.toLocaleString()}</Text>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">Winner (60%)</Text>
          <Text className="text-yellow-600 font-semibold">
            ₦{(battle.prizePool * 0.6)?.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-600">Runner-up (30%)</Text>
          <Text className="text-gray-600 font-semibold">
            ₦{(battle.prizePool * 0.3)?.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-gray-600">Platform (10%)</Text>
          <Text className="text-gray-600">₦{(battle.prizePool * 0.1)?.toLocaleString()}</Text>
        </View>
      </View>

      {/* Battle Info */}
      <View className="bg-white p-4 mx-4 rounded-lg shadow-sm mb-4">
        <Text className="text-gray-900 font-semibold mb-3">Battle Details</Text>

        <View className="flex-row items-center mb-2">
          <Ionicons name="trophy-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-2">Type: {battle.battleType.replace('_', ' ')}</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-2">
            Duration: {Math.floor(battle.duration / 60)} minutes
          </Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-2">
            {new Date(battle.endedAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="p-4 pb-8">
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-lg mb-3"
          onPress={shareResults}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="share-social-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Share Results</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 py-4 rounded-lg"
          onPress={() => navigation.navigate('CreateBattle')}
        >
          <Text className="text-gray-900 font-semibold text-center">Create New Battle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
