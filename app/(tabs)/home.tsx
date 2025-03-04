import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Chip, 
  Searchbar, 
  IconButton,
  ActivityIndicator 
} from 'react-native-paper';
import { postsService } from '../../services/postsService';

// Define interfaces
interface Category {
  id: number;
  name: string;
}

interface Post {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  photos?: string[];
  users?: {
    email: string;
    raw_user_meta_data?: {
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
  category?: {
    id: number;
    name: string;
  };
  collection_mode?: {
    id: number;
    name: string;
    icon: string;
  };
  post_item_types?: Array<{
    item_types: {
      id: number;
      name: string;
    };
  }>;
}

function formatTimeAgo(date: string) {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchPosts = async () => {
    try {
      const data = await postsService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await postsService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.logo}>POLY.TE</Text>
      <Searchbar
        placeholder="Search"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <IconButton icon="bell" onPress={() => {}} />
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categories}>
      <Chip
        key="all"
        selected={!selectedCategory}
        onPress={() => setSelectedCategory(null)}
        style={styles.categoryChip}
      >
        All
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={selectedCategory === category.id}
          onPress={() => setSelectedCategory(category.id)}
          style={styles.categoryChip}
        >
          {category.name}
        </Chip>
      ))}
    </View>
  );

  // Filter posts based on selected category
  const filteredPosts = selectedCategory 
    ? posts.filter(post => post.category_id === selectedCategory)
    : posts;

  const renderPost = ({ item }: { item: Post }) => (
    <Card style={styles.card}>
      <Card.Content>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text variant="titleMedium">
            {item.users?.raw_user_meta_data?.username || item.users?.email}
          </Text>
          <Text variant="bodySmall">
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>

        {/* Post Content */}
        <Text variant="bodyMedium" style={styles.type}>
          {item.category?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.category}>
          {item.collection_mode?.name}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {item.description}
        </Text>
        
        {/* Item Types List */}
        <View style={styles.itemList}>
          {item.post_item_types?.map((postItemType, index) => (
            <Chip key={index} style={styles.itemChip}>
              {postItemType.item_types.name}
            </Chip>
          ))}
        </View>

        {/* Post Image if exists */}
        {item.photos && item.photos.length > 0 && (
          <Card.Cover source={{ uri: item.photos[0] }} style={styles.postImage} />
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Add action buttons if needed */}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCategories()}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#023F0F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#023F0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#023F0F',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 16,
  },
  categories: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#023F0F',
  },
  categoryChip: {
    marginRight: 8,
  },
  card: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  type: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 8,
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  itemChip: {
    margin: 4,
  },
  postImage: {
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  errorText: {
    color: 'red',
  },
}); 