import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ContentOriginalityReportScreen({ route, navigation }: any) {
  const { contentId } = route.params;
  const { token } = useAuthStore();
  const [report] = useState({
    contentId,
    originalityScore: 65,
    hasWatermark: true,
    watermarkSource: 'TikTok',
    platformMentions: ['TikTok', 'Instagram'],
    restrictionType: 'FYP_SUPPRESSED',
    restrictionReason: 'Originality score below 70',
    canAppeal: true,
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleAppeal = () => {
    navigation.navigate('AppealSubmission', { contentId, report });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Originality Report</Text>
        <Text className="text-gray-600 mt-1">Content analysis results</Text>
      </View>

      {/* Originality Score */}
      <View className="bg-white p-6 mx-4 mt-4 rounded-lg shadow-sm">
        <View className="items-center">
          <View className={`w-32 h-32 rounded-full items-center justify-center ${getScoreBgColor(report.originalityScore)}`}>
            <Text className={`text-4xl font-bold ${getScoreColor(report.originalityScore)}`}>
              {report.originalityScore}
            </Text>
            <Text className="text-gray-600 text-sm">/ 100</Text>
          </View>
          <Text className="text-gray-900 font-semibold text-lg mt-4">Originality Score</Text>
          <Text className="text-gray-600 text-center mt-2">
            {report.originalityScore >= 90 ? 'Excellent! Your content is highly original.' :
             report.originalityScore >= 70 ? 'Good! Your content is mostly original.' :
             'Low score. Your content may be restricted from FYP.'}
          </Text>
        </View>
      </View>

      {/* Issues Detected */}
      <View className="bg-white p-4 mx-4 mt-3 rounded-lg shadow-sm">
        <Text className="text-gray-900 font-semibold mb-3">Issues Detected</Text>

        {report.hasWatermark && (
          <View className="flex-row items-start bg-red-50 p-3 rounded-lg mb-2">
            <Ionicons name="water-outline" size={20} color="#EF4444" />
            <View className="ml-3 flex-1">
              <Text className="text-red-900 font-medium">Watermark Detected</Text>
              <Text className="text-red-700 text-sm mt-1">
                Source: {report.watermarkSource}
              </Text>
            </View>
          </View>
        )}

        {report.platformMentions.length > 0 && (
          <View className="flex-row items-start bg-yellow-50 p-3 rounded-lg">
            <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-900 font-medium">Platform Mentions</Text>
              <Text className="text-yellow-700 text-sm mt-1">
                Found: {report.platformMentions.join(', ')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Current Status */}
      <View className="bg-white p-4 mx-4 mt-3 rounded-lg shadow-sm">
        <Text className="text-gray-900 font-semibold mb-3">Current Status</Text>

        <View className="bg-red-50 p-3 rounded-lg">
          <View className="flex-row items-center mb-2">
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text className="text-red-900 font-medium ml-2">
              {report.restrictionType?.replace('_', ' ')}
            </Text>
          </View>
          <Text className="text-red-700 text-sm">{report.restrictionReason}</Text>
        </View>

        <View className="mt-4">
          <Text className="text-gray-700 font-medium mb-2">What this means:</Text>
          <View className="space-y-1">
            {report.restrictionType === 'FYP_SUPPRESSED' && (
              <>
                <View className="flex-row items-start">
                  <Text className="text-gray-600">• Your content won't appear in For You Page</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-gray-600">• Followers can still see your posts</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-gray-600">• Limited discovery potential</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Improvement Tips */}
      <View className="bg-white p-4 mx-4 mt-3 rounded-lg shadow-sm">
        <Text className="text-gray-900 font-semibold mb-3">Improvement Tips</Text>

        {[
          { icon: 'camera-outline', tip: 'Create original content without watermarks' },
          { icon: 'brush-outline', tip: 'Add your unique style and creativity' },
          { icon: 'megaphone-outline', tip: 'Avoid mentioning other platforms' },
          { icon: 'images-outline', tip: 'Use your own photos and videos' },
        ].map((item, idx) => (
          <View key={idx} className="flex-row items-center mb-2">
            <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
              <Ionicons name={item.icon as any} size={16} color="#10B981" />
            </View>
            <Text className="text-gray-700 ml-3 flex-1">{item.tip}</Text>
          </View>
        ))}
      </View>

      {/* Appeal */}
      {report.canAppeal && (
        <View className="p-4 mb-8">
          <TouchableOpacity
            className="bg-blue-500 py-4 rounded-lg"
            onPress={handleAppeal}
          >
            <Text className="text-white font-bold text-center">Submit Appeal</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
