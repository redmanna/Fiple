import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function UserManagementScreen({ navigation }: any) {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [users, setUsers] = useState([
    { id: '1', username: 'john_doe', displayName: 'John Doe', role: 'USER', isVerified: true, status: 'ACTIVE', followersCount: 1250 },
    { id: '2', username: 'jane_smith', displayName: 'Jane Smith', role: 'USER', isVerified: false, status: 'ACTIVE', followersCount: 580 },
  ]);

  const filters = ['all', 'verified', 'suspended', 'flagged'];

  const handleUserAction = (userId: string, action: string) => {
    Alert.alert(
      'Confirm Action',
      `${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'Ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // API call
              Alert.alert('Success', `User ${action.toLowerCase()}ed successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to ${action.toLowerCase()} user`);
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-gray-900 font-bold text-lg">{item.displayName}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={18} color="#10B981" className="ml-1" />
            )}
          </View>
          <Text className="text-gray-600">@{item.username}</Text>
          <View className="flex-row items-center mt-2">
            <View className="bg-gray-100 px-2 py-1 rounded mr-2">
              <Text className="text-gray-700 text-xs">{item.role}</Text>
            </View>
            <View className={`px-2 py-1 rounded ${item.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-xs ${item.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}`}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Ionicons name="people-outline" size={20} color="#6B7280" />
          <Text className="text-gray-600 font-semibold mt-1">{item.followersCount}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap">
        <TouchableOpacity
          className="bg-blue-500 px-4 py-2 rounded-lg mr-2 mb-2"
          onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        >
          <Text className="text-white text-sm font-medium">View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-500 px-4 py-2 rounded-lg mr-2 mb-2"
          onPress={() => handleUserAction(item.id, 'Verify')}
        >
          <Text className="text-white text-sm font-medium">Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-yellow-500 px-4 py-2 rounded-lg mr-2 mb-2"
          onPress={() => handleUserAction(item.id, 'Warn')}
        >
          <Text className="text-white text-sm font-medium">Warn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 px-4 py-2 rounded-lg mb-2"
          onPress={() => handleUserAction(item.id, 'Ban')}
        >
          <Text className="text-white text-sm font-medium">Ban</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-3">User Management</Text>

        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row">
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === filter ? 'bg-green-500' : 'bg-gray-100'}`}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text className={selectedFilter === filter ? 'text-white text-sm' : 'text-gray-700 text-sm'}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}
