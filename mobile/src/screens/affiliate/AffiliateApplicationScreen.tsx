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

export default function AffiliateApplicationScreen({ route, navigation }: any) {
  const { merchantId } = route.params;
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');

  const handleApply = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/affiliate/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            merchantId,
            applicationNote,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Application submitted successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (response.status === 403) {
        Alert.alert(
          'Insufficient Followers',
          data.error || 'You need at least 2,500 followers to become an affiliate.'
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert('Error', 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Info Card */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-blue-900 mb-1">
                Affiliate Program Requirements
              </Text>
              <Text className="text-blue-700 text-sm">
                • Minimum 2,500 followers required{'\n'}
                • Active engagement with your audience{'\n'}
                • Professional content creation{'\n'}
                • Commitment to promoting products authentically
              </Text>
            </View>
          </View>
        </View>

        {/* Current Status */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Your Status</Text>

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600">Current Followers</Text>
            <Text className="font-semibold text-gray-900">
              {user?.followersCount?.toLocaleString() || 0}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-600">Required Followers</Text>
            <Text className="font-semibold text-gray-900">2,500</Text>
          </View>

          <View className="mt-3">
            {user?.followersCount >= 2500 ? (
              <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-green-700 ml-2 font-medium">Eligible to apply</Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-lg">
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text className="text-red-700 ml-2 font-medium">
                  Need {(2500 - (user?.followersCount || 0)).toLocaleString()} more followers
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Application Note */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Application Note</Text>
          <Text className="text-gray-600 text-sm mb-3">
            Tell the merchant why you'd be a great affiliate partner
          </Text>

          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Introduce yourself and your audience..."
            value={applicationNote}
            onChangeText={setApplicationNote}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          className={`py-4 rounded-lg ${loading || (user?.followersCount || 0) < 2500 ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleApply}
          disabled={loading || (user?.followersCount || 0) < 2500}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center text-base">
              Submit Application
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
