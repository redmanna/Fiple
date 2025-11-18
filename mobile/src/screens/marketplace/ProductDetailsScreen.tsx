import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/marketplace/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      });
      alert('Added to cart!');
      navigation.navigate('Cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Product not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        {/* Images */}
        <View className="bg-gray-100">
          <Image
            source={{ uri: product.images[selectedImage] || 'https://via.placeholder.com/400' }}
            className="w-full h-96"
            resizeMode="contain"
          />
          {product.discountPercent && (
            <View className="absolute top-4 right-4 bg-red-500 px-3 py-2 rounded-lg">
              <Text className="text-white font-bold">-{product.discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Image Thumbnails */}
        <ScrollView horizontal className="px-4 py-2 bg-gray-100">
          {product.images.map((img: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedImage(idx)}
              className={`mr-2 border-2 rounded ${selectedImage === idx ? 'border-green-500' : 'border-gray-300'}`}
            >
              <Image source={{ uri: img }} className="w-16 h-16" resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Details */}
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>

          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-gray-600 ml-1">
              {product.rating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0} reviews)
            </Text>
          </View>

          <View className="flex-row items-end mt-4">
            <Text className="text-3xl font-bold text-green-600">
              ₦{product.price.toLocaleString()}
            </Text>
            {product.compareAtPrice && (
              <Text className="text-gray-400 text-lg line-through ml-2 mb-1">
                ₦{product.compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>

          <View className="bg-gray-100 p-3 rounded-lg mt-4">
            <Text className="text-gray-600">
              <Text className="font-semibold">{product.stock}</Text> items available
            </Text>
          </View>

          {/* Merchant */}
          <TouchableOpacity
            className="flex-row items-center mt-4 p-3 bg-gray-50 rounded-lg"
            onPress={() => navigation.navigate('MerchantProfile', { merchantId: product.merchant.id })}
          >
            <Ionicons name="storefront-outline" size={24} color="#374151" />
            <View className="ml-3 flex-1">
              <Text className="text-gray-900 font-semibold">{product.merchant.businessName}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="text-gray-600 text-sm ml-1">
                  {product.merchant.rating?.toFixed(1) || '0.0'}
                </Text>
                {product.merchant.isVerified && (
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" className="ml-2" />
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Description */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
            <Text className="text-gray-600 leading-6">{product.description}</Text>
          </View>

          {/* Reviews */}
          <View className="mt-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Reviews</Text>
            {product.reviews?.slice(0, 3).map((review: any) => (
              <View key={review.id} className="mb-4 pb-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-gray-900">{review.user.displayName}</Text>
                  <View className="flex-row">
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
                {review.title && (
                  <Text className="font-medium text-gray-800 mt-1">{review.title}</Text>
                )}
                <Text className="text-gray-600 mt-1">{review.review}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View className="border-t border-gray-200 p-4 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center bg-gray-100 rounded-lg">
            <TouchableOpacity
              className="p-3"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#374151" />
            </TouchableOpacity>
            <Text className="px-4 font-semibold text-gray-900">{quantity}</Text>
            <TouchableOpacity
              className="p-3"
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              <Ionicons name="add" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-green-500 px-8 py-3 rounded-lg flex-1 ml-3"
            onPress={handleAddToCart}
          >
            <Text className="text-white font-semibold text-center text-base">Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
