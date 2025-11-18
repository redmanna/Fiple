import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { livestreamService } from '../../api/services';

export default function CreateStreamScreen({ navigation }: any) {
  const { token, user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subscribersOnly, setSubscribersOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const canUseSubscribersOnly = (user?.followersCount || 0) >= 5000;

  const handleCreateStream = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your stream');
      return;
    }

    try {
      setLoading(true);
      const response = await livestreamService.createStream(token!, {
        title,
        description,
        subscribersOnly: subscribersOnly && canUseSubscribersOnly,
      });

      Alert.alert('Success', 'Stream created! Ready to go live', [
        {
          text: 'Start Stream',
          onPress: () => navigation.replace('LiveStreamScreen', { stream: response.data }),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Start Live Stream</Text>

      {/* Title */}
      <Text className="text-gray-700 font-medium mb-2">Stream Title *</Text>
      <TextInput
        className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="What's your stream about?"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      {/* Description */}
      <Text className="text-gray-700 font-medium mb-2">Description</Text>
      <TextInput
        className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Tell viewers more about your stream..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      {/* Subscribers Only */}
      <View className="bg-gray-50 rounded-lg p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold">Subscribers Only</Text>
            <Text className="text-gray-600 text-sm mt-1">
              {canUseSubscribersOnly
                ? 'Only your subscribers can watch this stream'
                : 'Requires 5,000+ followers'}
            </Text>
          </View>
          <Switch
            value={subscribersOnly}
            onValueChange={setSubscribersOnly}
            disabled={!canUseSubscribersOnly}
            trackColor={{ true: '#10B981', false: '#D1D5DB' }}
          />
        </View>

        {!canUseSubscribersOnly && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
            <Text className="text-yellow-800 text-xs">
              You need {(5000 - (user?.followersCount || 0)).toLocaleString()} more followers to
              enable subscribers-only streams
            </Text>
          </View>
        )}
      </View>

      {/* Info Box */}
      <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <Text className="text-blue-900 font-semibold mb-2">Live Stream Tips:</Text>
        <Text className="text-blue-800 text-sm mb-1">• Good lighting and clear audio</Text>
        <Text className="text-blue-800 text-sm mb-1">
          • Engage with viewers through comments
        </Text>
        <Text className="text-blue-800 text-sm mb-1">• Thank gifters and top viewers</Text>
        <Text className="text-blue-800 text-sm">• Only highlights are saved (storage-friendly)</Text>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        className="bg-green-500 rounded-lg p-4 items-center mb-4"
        onPress={handleCreateStream}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="videocam" size={24} color="white" />
            <Text className="text-white font-semibold text-lg mt-1">Go Live Now</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
