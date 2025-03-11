import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, IconButton, ActivityIndicator } from 'react-native-paper';
import { postsService } from '../../services/postsService';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

export interface Post {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  photos?: string[];
  user?: {
    email: string;
    name: string;
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

interface Category {
  id: number;
  name: string;
}

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const fetchPosts = async () => {
    try {
      const data = await postsService.getPosts();
      console.log('Fetched posts:', data);
      console.log('Fetched posts:', JSON.stringify(data, null, 2)); 
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

  const filteredPosts = selectedCategory 
    ? posts.filter(post => post.category_id === selectedCategory)
    : posts;

  // const navigateToViewPost = (post: Post) => {
  //   navigation.navigate('ViewPost', { post });
  // };

  const renderPost = ({ item }: { item: Post }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.userInfo}>
        <Text variant="titleMedium" style={styles.userName}>
          
        {item.user?.name ?? item.user?.email ?? 'Unknown User'}
        </Text>


          <Text variant="bodySmall" style={styles.timePosted}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      
        <Text variant="bodyMedium" style={styles.collectionType}>
          {item.collection_mode?.name || 'No Collection Mode'}
        </Text>

        <Text variant="bodyMedium" style={styles.description}>
          {item.description || 'No Description'}
        </Text>

        <View style={styles.itemList}>
          {(item.post_item_types ?? []).length > 0 ? ( // ✅ Ensures it's always an array
            (item.post_item_types ?? []).map((type, index) => (
              <Chip key={index} style={styles.itemChip}>
                {type?.item_types?.name ?? "Unknown Type"} 
              </Chip>
            ))
          ) : (
            <Text>No Item Types</Text>
          )}
        </View>

        {item.photos && item.photos.length > 0 && (
          <Card.Cover source={{ uri: item.photos[0] }} style={styles.postImage} />
        )}

        <View style={styles.actions}>
          <Button mode="contained" onPress={() => {/* Handle send message action */}}>Send Message</Button>
          <View style={styles.commentContainer}>
            <Button mode="outlined" onPress={() => {
              navigation.navigate('Comment', { post: item }); 
            }}>Comment</Button>
          </View>
          <TouchableOpacity
            style={styles.dotsContainer}
            onPress={() => {
              setSelectedPost(item);
              if (!selectedPost) { // Prevent duplicate navigation
                setSelectedPost(item);
                console.log('Navigating to ViewPost with post:', item);
                navigation.navigate('ViewPost', { post: item });
              }
              // navigation.navigate('ViewPost', { post:item  });
              // navigation.getParent()?.navigate('ViewPost', { post: item });
             }}
          >
            <Text style={styles.dots}>⋮</Text>
          </TouchableOpacity>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Options</Text>
            <TouchableOpacity onPress={() => {/* Handle option 1 */}}>
              <Text style={styles.modalOption}>Option 1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {/* Handle option 2 */}}>
              <Text style={styles.modalOption}>Option 2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#fff',
  },
  categoryChip: {
    marginRight: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#1A3620',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontWeight: 'bold',
    color: '#fff',
  },
  timePosted: {
    color: '#888',
  },
  collectionType: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff',
  },
  description: {
    marginBottom: 8,
    color: '#fff',
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
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    color: '#fff',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C5735',
    borderRadius: 4,
  },
  dotsContainer: {
    // borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    padding: 4,
    marginLeft: 8,
    backgroundColor: '#2C5735',
  },
  dots: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  errorText: {
    color: 'red',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalOption: {
    fontSize: 16,
    marginVertical: 10,
  },
  modalClose: {
    fontSize: 16,
    color: 'red',
    marginTop: 20,
  },
}); 