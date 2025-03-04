import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { Header } from '../components/Header/Header';
import { Post } from '../components/Post/Post';
import { supabase } from '../services/supabase';

type CategoryType = 'All' | 'Seeking For' | 'For Collection';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('posts').select(`
        *,
        users:user_id (
          first_name,
          last_name
        )
      `).order('timestamp', { ascending: false });

      if (selectedCategory !== 'All') {
        query = query.eq('collection_type', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }) => (
    <Post
      user={{
        name: `${item.users.first_name} ${item.users.last_name}`,
        timePosted: new Date(item.timestamp).toLocaleDateString(),
      }}
      collectionType={item.collection_type}
      itemList={item.item_list}
      image={item.post_image}
      onMessage={() => {}}
      onComment={() => {}}
      onMore={() => {}}
    />
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.categories}>
        {(['All', 'Seeking For', 'For Collection'] as CategoryType[]).map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={styles.chip}
          >
            {category}
          </Chip>
        ))}
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchPosts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categories: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
  },
  chip: {
    marginRight: 8,
  },
}); 