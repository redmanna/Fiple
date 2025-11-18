import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { postService } from '../../api/services';
import { ContentType } from '../../../../shared/types';

export default function CreatePostScreen({ navigation }: any) {
  const [caption, setCaption] = useState('');
  const [mediaUris, setMediaUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setMediaUris([...mediaUris, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setMediaUris([...mediaUris, result.assets[0].uri]);
    }
  };

  const createPost = async () => {
    if (!caption && mediaUris.length === 0) {
      Alert.alert('Error', 'Please add some content');
      return;
    }

    setLoading(true);
    try {
      // In production, upload media to cloud storage first
      await postService.createPost({
        contentType: ContentType.POST,
        caption,
        mediaUrls: mediaUris, // This should be cloud URLs after upload
        mediaTypes: mediaUris.map(() => 'image'),
        hashtags: caption.match(/#\w+/g) || [],
        tags: [],
      });

      Alert.alert('Success', 'Post created successfully!');
      setCaption('');
      setMediaUris([]);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity onPress={createPost} disabled={loading}>
          <Text style={[styles.postButton, loading && styles.postButtonDisabled]}>
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="What's happening? Use #hashtags"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={500}
      />

      {mediaUris.length > 0 && (
        <View style={styles.mediaContainer}>
          {mediaUris.map((uri, idx) => (
            <View key={idx} style={styles.mediaItem}>
              <Image source={{ uri }} style={styles.mediaImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setMediaUris(mediaUris.filter((_, i) => i !== idx))}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="#6366f1" />
          <Text style={styles.actionText}>Photo/Video</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={24} color="#6366f1" />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="location-outline" size={24} color="#6366f1" />
          <Text style={styles.actionText}>Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={24} color="#fbbf24" />
        <Text style={styles.tipText}>
          Use hashtags and tag your campus to reach more people!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  postButton: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  postButtonDisabled: { opacity: 0.5 },
  captionInput: { padding: 16, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  mediaContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  mediaItem: { width: '48%', margin: '1%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%' },
  removeButton: { position: 'absolute', top: 8, right: 8 },
  actions: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { marginLeft: 8, fontSize: 14, color: '#6b7280' },
  tipCard: { flexDirection: 'row', backgroundColor: '#fffbeb', padding: 16, margin: 16, borderRadius: 8 },
  tipText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#92400e' },
});
