import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { businessService } from '../../api/services';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const AD_FORMATS = [
  { value: 'DISPLAY_BANNER', label: 'Display Banner', icon: 'image-outline' },
  { value: 'NATIVE_POST', label: 'Native Post', icon: 'newspaper-outline' },
  { value: 'VIDEO_PREROLL', label: 'Video Ad', icon: 'videocam-outline' },
  { value: 'STORY_AD', label: 'Story Ad', icon: 'play-outline' },
];

const PRICING_MODELS = [
  { value: 'CPM', label: 'CPM (Cost Per 1000 Impressions)', min: 500, max: 10000 },
  { value: 'CPC', label: 'CPC (Cost Per Click)', min: 50, max: 500 },
  { value: 'CPV', label: 'CPV (Cost Per View)', min: 20, max: 200 },
];

export default function CreateAdScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Ad Details
  const [format, setFormat] = useState('NATIVE_POST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [ctaUrl, setCtaUrl] = useState('');

  // Pricing
  const [pricingModel, setPricingModel] = useState('CPM');
  const [bidAmount, setBidAmount] = useState('1000');
  const [totalBudget, setTotalBudget] = useState('10000');
  const [dailyBudget, setDailyBudget] = useState('2000');

  // Targeting
  const [targetAgeMin, setTargetAgeMin] = useState('18');
  const [targetAgeMax, setTargetAgeMax] = useState('35');
  const [targetGender, setTargetGender] = useState('ALL');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateAd = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter ad title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter ad description');
      return;
    }

    if (!imageUri && format !== 'NATIVE_POST') {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      setLoading(true);

      const adData = {
        format,
        title,
        description,
        imageUrl: imageUri, // In production, upload to S3 first
        ctaText,
        ctaUrl,
        pricingModel,
        bidAmount: parseFloat(bidAmount),
        totalBudget: parseFloat(totalBudget),
        dailyBudget: parseFloat(dailyBudget),
        targeting: {
          ageMin: parseInt(targetAgeMin),
          ageMax: parseInt(targetAgeMax),
          gender: targetGender !== 'ALL' ? targetGender : undefined,
        },
      };

      await businessService.createAd(token!, adData);

      Alert.alert(
        'Success',
        'Your ad has been submitted for review. You will be notified once it is approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Ad Format */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Ad Format</Text>
        <View className="flex-row flex-wrap mb-6">
          {AD_FORMATS.map(f => (
            <TouchableOpacity
              key={f.value}
              className={`w-[48%] ${f.value === 'NATIVE_POST' || f.value === 'STORY_AD' ? 'mr-0' : 'mr-[2%]'} mb-3 p-4 rounded-lg border-2 ${
                format === f.value ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              }`}
              onPress={() => setFormat(f.value)}
            >
              <Ionicons
                name={f.icon as any}
                size={32}
                color={format === f.value ? '#10B981' : '#6B7280'}
              />
              <Text
                className={`mt-2 font-medium ${
                  format === f.value ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ad Content */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Ad Content</Text>

        <Text className="text-gray-700 mb-2">Title *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Enter ad title"
          value={title}
          onChangeText={setTitle}
          maxLength={60}
        />

        <Text className="text-gray-700 mb-2">Description *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Enter ad description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <Text className="text-gray-700 mb-2">Ad Image</Text>
        <TouchableOpacity
          className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 items-center mb-4"
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-40 rounded-lg" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2">Tap to upload image</Text>
              <Text className="text-gray-400 text-sm">Recommended: 1200x628px</Text>
            </>
          )}
        </TouchableOpacity>

        <Text className="text-gray-700 mb-2">Call to Action Text</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="Learn More"
          value={ctaText}
          onChangeText={setCtaText}
        />

        <Text className="text-gray-700 mb-2">CTA URL</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-6"
          placeholder="https://yourwebsite.com"
          value={ctaUrl}
          onChangeText={setCtaUrl}
          keyboardType="url"
          autoCapitalize="none"
        />

        {/* Pricing */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Pricing & Budget</Text>

        <Text className="text-gray-700 mb-2">Pricing Model</Text>
        <View className="mb-4">
          {PRICING_MODELS.map(pm => (
            <TouchableOpacity
              key={pm.value}
              className={`bg-white border-2 rounded-lg p-3 mb-2 ${
                pricingModel === pm.value ? 'border-green-500' : 'border-gray-200'
              }`}
              onPress={() => setPricingModel(pm.value)}
            >
              <Text
                className={`font-medium ${
                  pricingModel === pm.value ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {pm.label}
              </Text>
              <Text className="text-gray-500 text-sm">
                ₦{pm.min.toLocaleString()} - ₦{pm.max.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-gray-700 mb-2">Bid Amount (₦)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="1000"
          value={bidAmount}
          onChangeText={setBidAmount}
          keyboardType="numeric"
        />

        <Text className="text-gray-700 mb-2">Total Budget (₦)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-4"
          placeholder="10000"
          value={totalBudget}
          onChangeText={setTotalBudget}
          keyboardType="numeric"
        />

        <Text className="text-gray-700 mb-2">Daily Budget (₦)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg p-3 mb-6"
          placeholder="2000"
          value={dailyBudget}
          onChangeText={setDailyBudget}
          keyboardType="numeric"
        />

        {/* Targeting */}
        <Text className="text-lg font-bold text-gray-900 mb-3">Audience Targeting</Text>

        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-gray-700 mb-2">Min Age</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg p-3"
              placeholder="18"
              value={targetAgeMin}
              onChangeText={setTargetAgeMin}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-gray-700 mb-2">Max Age</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg p-3"
              placeholder="35"
              value={targetAgeMax}
              onChangeText={setTargetAgeMax}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text className="text-gray-700 mb-2">Gender</Text>
        <View className="flex-row mb-6">
          {['ALL', 'MALE', 'FEMALE'].map(g => (
            <TouchableOpacity
              key={g}
              className={`flex-1 p-3 rounded-lg border-2 ${
                targetGender === g ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
              } ${g !== 'ALL' ? 'ml-2' : ''}`}
              onPress={() => setTargetGender(g)}
            >
              <Text
                className={`text-center font-medium ${
                  targetGender === g ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-green-500 rounded-lg p-4 items-center mb-8"
          onPress={handleCreateAd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Submit Ad for Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
