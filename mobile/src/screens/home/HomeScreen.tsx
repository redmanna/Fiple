import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedService, postService } from '../../api/services';
import type { Post } from '../../../../shared/types';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const loadFeed = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(1);
      }

      const feed = await feedService.getFeed({ page: refresh ? 1 : page, pageSize: 20 });
      setPosts(refresh ? feed.data : [...posts, ...feed.data]);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleLike = async (postId: string) => {
    try {
      const result = await postService.likePost(postId);
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: result.liked,
                likesCount: result.liked ? post.likesCount + 1 : post.likesCount - 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.user?.avatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.user?.displayName}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.user?.currentTier && (
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{item.user.currentTier}</Text>
          </View>
        )}
      </View>

      {/* Caption */}
      {item.caption && <Text style={styles.caption}>{item.caption}</Text>}

      {/* Media */}
      {item.mediaUrls && item.mediaUrls.length > 0 && (
        <Image
          source={{ uri: item.mediaUrls[0] }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.isLiked ? '#ef4444' : '#6b7280'}
          />
          <Text style={styles.actionText}>{item.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>{item.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="#6b7280" />
          <Text style={styles.actionText}>{item.sharesCount}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="gift-outline" size={24} color="#6366f1" />
          <Text style={styles.actionText}>Tip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fiple</Text>
        <Text style={styles.headerSubtitle}>Connect. Create. Hustle.</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} />
        }
        onEndReached={() => {
          setPage(page + 1);
          loadFeed();
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#6366f1',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  tierBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  caption: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  media: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
});
