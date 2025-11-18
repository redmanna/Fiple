import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

export default function MyPartnershipsScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    loadPartnerships();
  }, [selectedStatus]);

  const loadPartnerships = async () => {
    try {
      setLoading(true);
      const params = selectedStatus ? `?status=${selectedStatus}` : '';
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/affiliate/partnerships${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setPartnerships(data.partnerships || []);
      setTotals(data.totals || {});
    } catch (error) {
      console.error('Error loading partnerships:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPartnerships();
  };

  const shareAffiliateLink = async (link: string) => {
    try {
      await Share.share({
        message: `Check out these products! ${link}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPartnership = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-lg">{item.merchant.businessName}</Text>
          <Text className="text-gray-500 text-sm mt-1">{item.merchant.businessType}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${
          item.status === 'APPROVED' ? 'bg-green-100' :
          item.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          <Text className={`text-xs font-medium ${
            item.status === 'APPROVED' ? 'text-green-700' :
            item.status === 'PENDING' ? 'text-yellow-700' : 'text-red-700'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Stats */}
      {item.status === 'APPROVED' && (
        <>
          <View className="flex-row flex-wrap mb-3">
            <View className="w-1/3 pr-2 mb-2">
              <Text className="text-gray-500 text-xs">Commission</Text>
              <Text className="text-gray-900 font-bold">{item.commissionRate}%</Text>
            </View>
            <View className="w-1/3 px-1 mb-2">
              <Text className="text-gray-500 text-xs">Orders</Text>
              <Text className="text-gray-900 font-bold">{item.totalOrders || 0}</Text>
            </View>
            <View className="w-1/3 pl-2 mb-2">
              <Text className="text-gray-500 text-xs">Sales</Text>
              <Text className="text-green-600 font-bold">₦{item.totalSales?.toLocaleString() || '0'}</Text>
            </View>
          </View>

          <View className="bg-gray-50 p-3 rounded-lg mb-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-xs">Total Earnings</Text>
                <Text className="text-gray-900 font-bold text-lg">₦{item.totalEarnings.toLocaleString()}</Text>
              </View>
              <View>
                <Text className="text-gray-500 text-xs text-right">Pending</Text>
                <Text className="text-yellow-600 font-bold">₦{item.pendingEarnings.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Affiliate Link */}
          <View className="border border-gray-200 rounded-lg p-3 mb-3">
            <Text className="text-gray-500 text-xs mb-2">Affiliate Link</Text>
            <Text className="text-gray-900 text-sm" numberOfLines={1}>{item.affiliateLink}</Text>
            <View className="flex-row mt-2">
              <TouchableOpacity
                className="flex-1 bg-green-500 py-2 rounded-lg mr-2"
                onPress={() => shareAffiliateLink(item.affiliateLink)}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="share-social-outline" size={16} color="white" />
                  <Text className="text-white font-medium ml-1 text-sm">Share</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-2 rounded-lg ml-2"
                onPress={() => {/* TODO: Show QR code modal */}}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="qr-code-outline" size={16} color="white" />
                  <Text className="text-white font-medium ml-1 text-sm">QR Code</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Code */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-sm">Code: {item.affiliateCode}</Text>
            <TouchableOpacity>
              <Ionicons name="copy-outline" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {item.status === 'PENDING' && (
        <Text className="text-gray-600 text-sm">Awaiting merchant approval...</Text>
      )}

      {item.status === 'REJECTED' && (
        <Text className="text-red-600 text-sm">
          {item.rejectionReason || 'Application was rejected'}
        </Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Partnerships</Text>

        {/* Stats */}
        {totals && (
          <View className="flex-row mt-3">
            <View className="flex-1 mr-2 bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-500 text-xs">Total Earnings</Text>
              <Text className="text-gray-900 font-bold text-lg">
                ₦{totals.totalEarnings?.toLocaleString() || '0'}
              </Text>
            </View>
            <View className="flex-1 ml-2 bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-500 text-xs">Active Partnerships</Text>
              <Text className="text-green-600 font-bold text-lg">{totals.approved || 0}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Status Filter */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row">
          {[
            { value: null, label: `All (${totals?.total || 0})` },
            { value: 'PENDING', label: `Pending (${totals?.pending || 0})` },
            { value: 'APPROVED', label: `Approved (${totals?.approved || 0})` },
            { value: 'REJECTED', label: `Rejected (${totals?.rejected || 0})` },
          ].map((status) => (
            <TouchableOpacity
              key={status.label}
              className={`px-3 py-2 rounded-full mr-2 ${selectedStatus === status.value ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setSelectedStatus(status.value)}
            >
              <Text
                className={`text-xs font-medium ${selectedStatus === status.value ? 'text-white' : 'text-gray-700'}`}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Partnerships List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={partnerships}
          renderItem={renderPartnership}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="briefcase-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-4 text-lg">
                No partnerships yet
              </Text>
              <Text className="text-gray-600 text-center mt-2 px-6">
                Apply to merchant affiliate programs to start earning
              </Text>
              <TouchableOpacity
                className="bg-green-500 px-6 py-3 rounded-lg mt-6"
                onPress={() => navigation.navigate('MarketplaceHome')}
              >
                <Text className="text-white font-semibold">Browse Merchants</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
