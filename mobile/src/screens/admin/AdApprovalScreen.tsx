import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AdApprovalScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [pendingAds, setPendingAds] = useState([
    {
      id: '1',
      advertiser: 'TechCorp Ltd',
      type: 'SPONSORED_POST',
      budget: 50000,
      targeting: { age: '18-35', location: 'Lagos' },
      content: { title: 'New Product Launch', image: null, description: 'Check out our latest product...' },
    },
  ]);

  const handleApprove = async (id: string) => {
    Alert.alert('Approve Ad', 'Approve this advertisement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            setLoading(true);
            // API call
            setPendingAds(prev => prev.filter(ad => ad.id !== id));
            Alert.alert('Success', 'Ad approved successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to approve ad');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = async (id: string) => {
    Alert.prompt(
      'Reject Ad',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              setLoading(true);
              // API call with reason
              setPendingAds(prev => prev.filter(ad => ad.id !== id));
              Alert.alert('Success', 'Ad rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject ad');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderAd = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-gray-900 font-bold text-lg">{item.advertiser}</Text>
          <View className="bg-blue-100 px-2 py-1 rounded mt-1 inline-flex">
            <Text className="text-blue-700 text-xs font-medium">{item.type}</Text>
          </View>
        </View>
        <View>
          <Text className="text-gray-500 text-sm">Budget</Text>
          <Text className="text-green-600 font-bold text-lg">₦{item.budget.toLocaleString()}</Text>
        </View>
      </View>

      {item.content.image && (
        <Image source={{ uri: item.content.image }} className="w-full h-48 rounded-lg mb-3" />
      )}

      <View className="mb-3">
        <Text className="text-gray-900 font-semibold text-lg mb-1">{item.content.title}</Text>
        <Text className="text-gray-600">{item.content.description}</Text>
      </View>

      <View className="bg-gray-50 p-3 rounded-lg mb-3">
        <Text className="text-gray-700 font-medium mb-2">Targeting:</Text>
        <Text className="text-gray-600 text-sm">Age: {item.targeting.age}</Text>
        <Text className="text-gray-600 text-sm">Location: {item.targeting.location}</Text>
      </View>

      <View className="flex-row">
        <TouchableOpacity
          className="flex-1 bg-green-500 py-3 rounded-lg mr-2"
          onPress={() => handleApprove(item.id)}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Approve</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-red-500 py-3 rounded-lg ml-2"
          onPress={() => handleReject(item.id)}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="close-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Reject</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Ad Approval</Text>
        <Text className="text-gray-600 mt-1">Review pending advertisements</Text>
      </View>

      <FlatList
        data={pendingAds}
        renderItem={renderAd}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 font-semibold mt-4">No pending ads</Text>
            <Text className="text-gray-600">All ads have been reviewed</Text>
          </View>
        }
      />
    </View>
  );
}
