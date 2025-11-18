import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function AppealSubmissionScreen({ route, navigation }: any) {
  const { contentId, report } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');

  const appealReasons = [
    'Content is original',
    'Watermark is my own',
    'Fair use of copyrighted material',
    'Technical error in detection',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!reason || !explanation.trim()) {
      Alert.alert('Error', 'Please select a reason and provide an explanation');
      return;
    }

    if (explanation.trim().length < 50) {
      Alert.alert('Error', 'Please provide a more detailed explanation (minimum 50 characters)');
      return;
    }

    try {
      setLoading(true);
      // API call to submit appeal
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Appeal Submitted',
        'Your appeal has been submitted for review. You will be notified of the decision within 24-48 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting appeal:', error);
      Alert.alert('Error', 'Failed to submit appeal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Submit Appeal</Text>
        <Text className="text-gray-600 mt-1">Request review of content restriction</Text>
      </View>

      {/* Current Restriction */}
      <View className="bg-red-50 border border-red-200 p-4 m-4 rounded-lg">
        <View className="flex-row items-start">
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <View className="ml-3 flex-1">
            <Text className="text-red-900 font-semibold">Current Restriction</Text>
            <Text className="text-red-700 mt-1">{report.restrictionType?.replace('_', ' ')}</Text>
            <Text className="text-red-600 text-sm mt-2">{report.restrictionReason}</Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        {/* Reason Selection */}
        <Text className="text-gray-900 font-semibold mb-3">Reason for Appeal *</Text>
        <View className="mb-4">
          {appealReasons.map((r) => (
            <TouchableOpacity
              key={r}
              className={`flex-row items-center p-4 rounded-lg mb-2 ${reason === r ? 'bg-green-50 border-2 border-green-500' : 'bg-white border border-gray-300'}`}
              onPress={() => setReason(r)}
            >
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${reason === r ? 'border-green-500' : 'border-gray-300'}`}>
                {reason === r && <View className="w-3 h-3 rounded-full bg-green-500" />}
              </View>
              <Text className={`ml-3 ${reason === r ? 'text-green-900 font-medium' : 'text-gray-900'}`}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        <Text className="text-gray-900 font-semibold mb-2">Detailed Explanation *</Text>
        <Text className="text-gray-600 text-sm mb-3">
          Please provide a detailed explanation for your appeal (minimum 50 characters)
        </Text>
        <View className="bg-white border border-gray-300 rounded-lg p-3 mb-4">
          <TextInput
            className="text-gray-900"
            placeholder="Explain why this restriction should be lifted..."
            value={explanation}
            onChangeText={setExplanation}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text className="text-gray-500 text-xs text-right mt-2">
            {explanation.length} / 500 characters
          </Text>
        </View>

        {/* Guidelines */}
        <View className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-900 font-semibold mb-2">Appeal Guidelines</Text>
              <Text className="text-blue-700 text-sm mb-1">• Be honest and specific</Text>
              <Text className="text-blue-700 text-sm mb-1">• Provide evidence if available</Text>
              <Text className="text-blue-700 text-sm mb-1">• Review typically takes 24-48 hours</Text>
              <Text className="text-blue-700 text-sm">• False appeals may result in account penalties</Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`py-4 rounded-lg ${loading || !reason || explanation.length < 50 ? 'bg-gray-400' : 'bg-green-500'}`}
          onPress={handleSubmit}
          disabled={loading || !reason || explanation.length < 50}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-center">Submit Appeal</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
