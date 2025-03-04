import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Post } from './Post';
import { ActivityIndicator } from 'react-native-paper';

interface PostListProps {
  posts: any[];
  loading: boolean;
  onRefresh: () => void;
  onMessage: (postId: string) => void;
  onComment: (postId: string) => void;
  onMore: (postId: string) => void;
}

export function PostList({
  posts,
  loading,
  onRefresh,
  onMessage,
  onComment,
  onMore,
}: PostListProps) {
  const renderPost = ({ item }) => (
    <Post
      user={{
        name: `${item.users.first_name} ${item.users.last_name}`,
        timePosted: new Date(item.timestamp).toLocaleDateString(),
        location: `Purok ${item.users.purok}`,
      }}
      collectionType={item.collection_type}
      itemList={item.item_list}
      description={item.description}
      image={item.post_image}
      onMessage={() => onMessage(item.id)}
      onComment={() => onComment(item.id)}
      onMore={() => onMore(item.id)}
    />
  );

  if (loading && !posts.length) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 