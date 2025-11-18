import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AddProductScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Media, 3: Pricing, 4: Inventory

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  const [images, setImages] = useState<string[]>([]);

  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [allowAffiliate, setAllowAffiliate] = useState(true);
  const [affiliateRate, setAffiliateRate] = useState('10');

  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [shippingWeight, setShippingWeight] = useState('');

  const categories = ['Electronics', 'Fashion', 'Food', 'Books', 'Beauty', 'Sports', 'Home'];

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images allowed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // Validation
    if (!name || !description || !category || images.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/merchant/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            category,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            images,
            price: parseFloat(price),
            compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
            stock: parseInt(stock) || 0,
            sku,
            shippingWeight: shippingWeight ? parseFloat(shippingWeight) : undefined,
            allowAffiliate,
            affiliateRate: parseFloat(affiliateRate),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Product added successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Product Details</Text>

      <Text className="text-gray-700 mb-2">Product Name *</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="Enter product name"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-gray-700 mb-2">Description *</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="Describe your product"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text className="text-gray-700 mb-2">Category *</Text>
      <View className="flex-row flex-wrap mb-4">
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`px-4 py-2 rounded-full mr-2 mb-2 ${category === cat ? 'bg-green-500' : 'bg-gray-100'}`}
            onPress={() => setCategory(cat)}
          >
            <Text className={category === cat ? 'text-white' : 'text-gray-700'}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-gray-700 mb-2">Tags (comma-separated)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="e.g. wireless, bluetooth, headphones"
        value={tags}
        onChangeText={setTags}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Product Images *</Text>
      <Text className="text-gray-600 mb-4">Add up to 5 images (first image will be the main image)</Text>

      <View className="flex-row flex-wrap mb-4">
        {images.map((img, idx) => (
          <View key={idx} className="w-24 h-24 mr-2 mb-2 relative">
            <Image source={{ uri: img }} className="w-full h-full rounded-lg" resizeMode="cover" />
            <TouchableOpacity
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              onPress={() => removeImage(idx)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            {idx === 0 && (
              <View className="absolute bottom-0 left-0 right-0 bg-green-500 py-1">
                <Text className="text-white text-xs text-center font-medium">Main</Text>
              </View>
            )}
          </View>
        ))}

        {images.length < 5 && (
          <TouchableOpacity
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
            onPress={pickImage}
          >
            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs mt-1">Add Image</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Pricing</Text>

      <Text className="text-gray-700 mb-2">Price *</Text>
      <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3 mb-4">
        <Text className="text-gray-900 font-semibold mr-2">₦</Text>
        <TextInput
          className="flex-1"
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
      </View>

      <Text className="text-gray-700 mb-2">Compare at Price (optional)</Text>
      <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3 mb-4">
        <Text className="text-gray-900 font-semibold mr-2">₦</Text>
        <TextInput
          className="flex-1"
          placeholder="0.00"
          value={compareAtPrice}
          onChangeText={setCompareAtPrice}
          keyboardType="numeric"
        />
      </View>
      <Text className="text-gray-500 text-sm mb-4">
        Show a discount by setting a higher compare-at price
      </Text>

      <View className="border border-gray-200 rounded-lg p-4 mb-4">
        <Text className="text-gray-900 font-semibold mb-3">Affiliate Program</Text>

        <TouchableOpacity
          className="flex-row items-center justify-between mb-3"
          onPress={() => setAllowAffiliate(!allowAffiliate)}
        >
          <Text className="text-gray-700">Allow affiliates to promote</Text>
          <View className={`w-12 h-6 rounded-full ${allowAffiliate ? 'bg-green-500' : 'bg-gray-300'}`}>
            <View
              className={`w-5 h-5 rounded-full bg-white mt-0.5 ${allowAffiliate ? 'ml-6' : 'ml-1'}`}
            />
          </View>
        </TouchableOpacity>

        {allowAffiliate && (
          <>
            <Text className="text-gray-700 mb-2">Commission Rate (%)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3"
              placeholder="10"
              value={affiliateRate}
              onChangeText={setAffiliateRate}
              keyboardType="numeric"
            />
            <Text className="text-gray-500 text-sm mt-2">
              Affiliates will earn {affiliateRate}% commission on sales
            </Text>
          </>
        )}
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text className="text-lg font-semibold text-gray-900 mb-4">Inventory</Text>

      <Text className="text-gray-700 mb-2">Stock Quantity</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="0"
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />

      <Text className="text-gray-700 mb-2">SKU (optional)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="e.g. PROD-001"
        value={sku}
        onChangeText={setSku}
      />

      <Text className="text-gray-700 mb-2">Shipping Weight (kg)</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-3 py-3 mb-4"
        placeholder="0.0"
        value={shippingWeight}
        onChangeText={setShippingWeight}
        keyboardType="numeric"
      />
    </>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 ml-3">Add Product</Text>
        </View>

        {/* Progress */}
        <View className="flex-row mt-4">
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              className={`flex-1 h-1 rounded-full mx-1 ${s <= step ? 'bg-green-500' : 'bg-gray-200'}`}
            />
          ))}
        </View>
        <Text className="text-gray-600 text-sm mt-2">
          Step {step} of 4
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      {/* Actions */}
      <View className="border-t border-gray-200 p-4">
        <View className="flex-row">
          {step > 1 && (
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-4 rounded-lg mr-2"
              onPress={() => setStep(step - 1)}
            >
              <Text className="text-gray-700 font-semibold text-center">Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className={`flex-1 py-4 rounded-lg ${loading ? 'bg-gray-400' : 'bg-green-500'}`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-center">
                {step < 4 ? 'Next' : 'Add Product'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
