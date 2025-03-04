import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { Text, Button, Avatar, IconButton, Divider, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { postsService } from '../../../services/postsService';
import { useState, useEffect } from 'react';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'offers'

  useEffect(() => {
    const loadPost = async () => {
      try {
        const postData = await postsService.getPostById(id as string);
        setPost(postData);
      } catch (error) {
        console.error('Error loading post:', error);
      }
    };
    loadPost();
  }, [id]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>SEE POST</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Button
          mode={activeTab === 'post' ? 'contained' : 'text'}
          onPress={() => setActiveTab('post')}
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
        >
          POST
        </Button>
        <Button
          mode={activeTab === 'offers' ? 'contained' : 'text'}
          onPress={() => setActiveTab('offers')}
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
        >
          OFFERS
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {post && (
          <>
            {/* User Info */}
            <View style={styles.userInfo}>
              <Avatar.Image 
                size={40} 
                source={{ uri: post.users?.avatar_url || 'https://via.placeholder.com/40' }} 
              />
              <View style={styles.userText}>
                <Text style={styles.userName}>
                  {post.users?.raw_user_meta_data?.username || post.users?.email}
                </Text>
                <Text style={styles.location}>
                  {post.collection_mode?.name}
                </Text>
                <Text style={styles.timeAgo}>10mins</Text>
              </View>
              <IconButton icon="dots-vertical" onPress={() => {}} />
            </View>

            {/* Post Content */}
            <Text style={styles.description}>{post.description}</Text>
            
            {/* Item Types */}
            <View style={styles.itemTypes}>
              {post.post_item_types?.map((item, index) => (
                <Text key={index} style={styles.itemType}>
                  {item.item_types.name}
                </Text>
              ))}
            </View>

            {/* Post Image */}
            {post.photos && post.photos.length > 0 && (
              <Image
                source={{ uri: post.photos[0] }}
                style={styles.postImage}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="message-outline"
                onPress={() => {}}
                style={styles.actionButton}
              >
                SEND MESSAGE
              </Button>
              <Button
                mode="contained"
                icon="hand-coin-outline"
                onPress={() => {}}
                style={styles.actionButton}
              >
                SEND OFFER
              </Button>
            </View>

            {/* Comments Section */}
            <View style={styles.comments}>
              <TextInput
                placeholder="Add comment..."
                style={styles.commentInput}
                right={<TextInput.Icon icon="send" onPress={() => {}} />}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#023F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#023F0F',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#023F0F',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    borderRadius: 0,
  },
  activeTab: {
    backgroundColor: '#00FF57',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userText: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  location: {
    fontSize: 14,
    color: '#ccc',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  itemTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  itemType: {
    color: '#00FF57',
    backgroundColor: '#1A3620',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#1A3620',
  },
  comments: {
    marginTop: 16,
  },
  commentInput: {
    backgroundColor: '#1A3620',
  },
}); 