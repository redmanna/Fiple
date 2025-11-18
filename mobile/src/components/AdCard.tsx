import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adService } from '../api/services';
import { useAuthStore } from '../store/authStore';

interface AdCardProps {
  ad: any;
  onImpression?: () => void;
}

export default function AdCard({ ad, onImpression }: AdCardProps) {
  const { token, user } = useAuthStore();
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const viewabilityTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Record impression after 1 second of viewability
    viewabilityTimer.current = setTimeout(() => {
      recordImpression();
    }, 1000);

    return () => {
      if (viewabilityTimer.current) {
        clearTimeout(viewabilityTimer.current);
      }
    };
  }, []);

  const recordImpression = async () => {
    if (impressionRecorded) return;

    try {
      await adService.recordImpression(ad.id, user?.id);
      setImpressionRecorded(true);
      onImpression?.();
    } catch (error) {
      console.error('Record impression error:', error);
    }
  };

  const handleClick = async () => {
    try {
      // Record click
      await adService.recordClick(ad.id, user?.id);

      // Open CTA URL
      if (ad.ctaUrl) {
        await Linking.openURL(ad.ctaUrl);
      }
    } catch (error) {
      console.error('Ad click error:', error);
    }
  };

  // Render based on ad format
  const renderAdContent = () => {
    switch (ad.format) {
      case 'DISPLAY_BANNER':
        return renderDisplayBanner();
      case 'NATIVE_POST':
        return renderNativePost();
      case 'VIDEO_PREROLL':
        return renderVideoAd();
      case 'STORY_AD':
        return renderStoryAd();
      default:
        return renderNativePost();
    }
  };

  const renderDisplayBanner = () => (
    <TouchableOpacity
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4"
      onPress={handleClick}
    >
      <View className="relative">
        <Image source={{ uri: ad.imageUrl }} className="w-full h-32" resizeMode="cover" />
        <View className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded">
          <Text className="text-white text-xs font-medium">Sponsored</Text>
        </View>
      </View>
      {ad.ctaText && (
        <View className="p-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold">{ad.title}</Text>
            {ad.description && (
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                {ad.description}
              </Text>
            )}
          </View>
          <View className="bg-green-500 px-4 py-2 rounded-lg ml-3">
            <Text className="text-white font-semibold text-sm">{ad.ctaText}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderNativePost = () => (
    <TouchableOpacity
      className="bg-white border-t border-b border-gray-200 mb-4"
      onPress={handleClick}
    >
      {/* Sponsored Label */}
      <View className="p-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="megaphone-outline" size={16} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1">Sponsored</Text>
        </View>
      </View>

      {/* Ad Content */}
      <View className="p-4">
        <Text className="text-gray-900 font-bold text-lg mb-2">{ad.title}</Text>
        {ad.description && (
          <Text className="text-gray-700 mb-3">{ad.description}</Text>
        )}
        {ad.imageUrl && (
          <Image source={{ uri: ad.imageUrl }} className="w-full h-48 rounded-lg mb-3" />
        )}
        {ad.ctaText && (
          <View className="bg-green-500 px-6 py-3 rounded-lg items-center">
            <Text className="text-white font-semibold">{ad.ctaText}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderVideoAd = () => (
    <TouchableOpacity
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4"
      onPress={handleClick}
    >
      <View className="relative">
        {ad.videoUrl ? (
          <View className="w-full h-48 bg-black items-center justify-center">
            <Ionicons name="play-circle" size={64} color="white" />
          </View>
        ) : (
          <Image source={{ uri: ad.imageUrl }} className="w-full h-48" />
        )}
        <View className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded">
          <Text className="text-white text-xs font-medium">Sponsored Video</Text>
        </View>
      </View>
      <View className="p-3">
        <Text className="text-gray-900 font-semibold">{ad.title}</Text>
        {ad.description && (
          <Text className="text-gray-600 text-sm mt-1">{ad.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStoryAd = () => (
    <TouchableOpacity
      className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden mr-3 w-28 h-44"
      onPress={handleClick}
    >
      <Image source={{ uri: ad.imageUrl }} className="w-full h-full" resizeMode="cover" />
      <View className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80">
        <Text className="text-white text-xs font-bold" numberOfLines={2}>
          {ad.title}
        </Text>
        <Text className="text-white/80 text-xs">Sponsored</Text>
      </View>
    </TouchableOpacity>
  );

  return renderAdContent();
}
