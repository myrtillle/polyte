import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, IconButton, ActivityIndicator } from 'react-native-paper';
import { postsService } from '../../services/postsService';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import meetupIcon from '../../assets/images/meetup.png';
import pickupIcon from '../../assets/images/pickup.png';
import dropoffIcon from '../../assets/images/dropoff.png';
import paperplaneIcon from '../../assets/images/paperplane.png';
import messagebubbleIcon from '../../assets/images/messagebubble.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { notificationService } from '@/services/notificationService';

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
    barangay: number;
    purok: string;
    first_name: string;
    last_name: string;
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBadge, setShowBadge] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getModeIcon = (modeName: string) => {
    switch (modeName.toLowerCase()) {
      case 'meetup':
        return meetupIcon;
      case 'pickup':
        return pickupIcon;
      case 'drop off':
      case 'dropoff':
        return dropoffIcon;
      default:
        return meetupIcon;
    }
  };
  
  const fetchPosts = async () => {
    try {
      const data = await postsService.getPosts();
      // console.log('Fetched posts:', data);
      // console.log('Fetched posts:', JSON.stringify(data, null, 2)); 
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleSendMessage = (post: Post) => {
    navigation.navigate('ChatScreen', { chatId: post.id, post });
  };

  const navigateToViewPost = async (post: Post) => {
    try {
      console.log("🚀 Navigating to ViewPost with post:", post);
      await AsyncStorage.setItem('lastViewedPost', JSON.stringify(post));
      
      navigation.navigate('ViewPost', { post });
    } catch (error) {
      console.error("❌ Error saving post:", error);
    }
  };  

  //get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    getCurrentUser();
  }, []);
  //fetch post
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

  useEffect(() => {
    const fetchUnread = async () => {
      const session = await supabase.auth.getSession();
      const userId = session?.data?.session?.user?.id;
      if (userId) {
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);
      }
    };
  
    fetchUnread();
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

  const getModeData = (modeName: string) => {
    const lower = modeName.toLowerCase();
    if (lower.includes('pickup')) {
      return { icon: pickupIcon, color: '#FFD700' }; // yellow
    } else if (lower.includes('drop')) {
      return { icon: dropoffIcon, color: '#FF8515' }; 
    } else {
      return { icon: meetupIcon, color: '#00FF57' }; 
    }
  };
  
  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.headerBox}>
        <Image 
          source={require('../../assets/images/polyte-logo.png')} 
          style={styles.logo} 
        />
  
        <View style={styles.searchWrapper}>
          <Searchbar
          placeholder="PLASTIC, OBRERO USEP"
          placeholderTextColor="#888E96" // 👈 makes placeholder not red
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{
            color: '#888E96',         // user input text color
            fontWeight: '100',        // super thin
            letterSpacing: 0.5,
            fontSize:10,
          }}
          iconColor="white"
        />
        </View>
  
        <TouchableOpacity style={styles.notificationWrapper}>
          <IconButton icon="bell" iconColor="white" size={24} onPress={() => navigation.navigate('Notifications', { onViewed: () => setShowBadge(false) })} />
          {unreadCount > 0 && showBadge && (
            <View style={{
              position: 'absolute',
              top: -5,
              right: -5,
              backgroundColor: 'red',
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
              <Text style={{ color: 'white', fontSize: 12 }}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoryWrapper}>
      <TouchableOpacity
        style={[
          styles.categoryButtonSmall,
          selectedCategory === null && styles.categoryActive,
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[
          styles.categoryText,
          selectedCategory === null && styles.categoryTextActive,
        ]}>
          ALL
        </Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        style={[
          styles.categoryButtonWide,
          selectedCategory === 1 && styles.categoryActive,
        ]}
        onPress={() => setSelectedCategory(1)}
      >
        <Text style={[
          styles.categoryText,
          selectedCategory === 1 && styles.categoryTextActive,
        ]}>
          FOR COLLECTION
        </Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        style={[
          styles.categoryButtonWide,
          selectedCategory === 2 && styles.categoryActive,
        ]}
        onPress={() => setSelectedCategory(2)}
      >
        <Text style={[
          styles.categoryText,
          selectedCategory === 2 && styles.categoryTextActive,
        ]}>
          SEEKING FOR
        </Text>
      </TouchableOpacity>
    </View>
  );
  

  const filteredPosts = posts.filter(post => {
    const isNotMyPost = post.user_id !== currentUserId;
    const matchesCategory = selectedCategory ? post.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.user?.barangay?.toString().includes(searchQuery) ||
        post.user?.purok?.toString().includes(searchQuery) ||
        post.post_item_types?.some(item =>
          item.item_types?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;
    return isNotMyPost && matchesCategory && matchesSearch;
  });
  


  const renderPost = ({ item }: { item: Post }) => (
    <Card style={[
      styles.card,
      item.category_id === 2 && { backgroundColor: '#172B1F' } // Darker for SEEKING
    ]}>
      <Card.Content>
        <View style={styles.cardWrapper}>
          <View style={styles.infoWrapper}>
            {/* Name and time */}
            <View style={styles.userInfo}>
  <Text style={styles.userName}>
    {item.user?.name ?? item.user?.email ?? 'Unknown User'}
  </Text>
  <Text style={styles.timePosted}>
    {formatTimeAgo(item.created_at)}
  </Text>
</View>


      
            {/* Mode label (yellow icon + text) */}
            <View style={styles.labelRow}>
              {(() => {
                const mode = getModeData(item.collection_mode?.name || '');
                return (
                  <>
                    <Image
                      source={mode.icon}
                      style={[styles.labelImage, { tintColor: mode.color }]}
                      resizeMode="contain"
                    />
                    <Text style={[styles.labelText, { color: mode.color }]}>
                      {item.collection_mode?.name || 'MEET UP'}
                    </Text>
                  </>
                );
              })()}
            </View>
      
            {/* Item labels */}
            <View style={styles.itemList}>
            {(item.post_item_types ?? []).map((type, index) => (
              <Chip
                key={index}
                style={styles.itemChip}
                textStyle={styles.itemChipText}
              >
                {type?.item_types?.name ?? 'Unknown'}
              </Chip>
            ))}
            </View>
          </View>

          {/* Image from database */}
          {item.photos && item.photos.length > 0 && (
            <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.photos[0] }}
              style={styles.postImage}
            />
          </View>
        )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSendMessage(item)}>
          <Image source={paperplaneIcon} style={styles.actionIconImage} />

            <Text style={styles.actionText}>SEND MESSAGE</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ViewPost', { post: item })}
          >
            <Image source={messagebubbleIcon} style={styles.actionIconImage} />

            <Text style={styles.actionText}>COMMENT</Text>
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.actionMenu}
            onPress={() => {
              setSelectedPost(item);
                console.log('Navigating to ViewPost with post:', item);
                console.log('🚀 Navigating to ViewPost with post:', JSON.stringify(item, null, 2));
                // navigation.navigate('ViewPost', { post: item });
                navigateToViewPost(item);
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
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {renderHeader()}
  
      {/* Sticky Category Bar */}
      <View style={styles.categoryStickyWrapper}>
        {renderCategories()}
      </View>
  
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
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.modalOption}>Option 1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.modalOption}>Option 2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  imageContainer: {
    alignItems: 'flex-end',
    marginTop: 1,
  },
  
  
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#023F0F',
  },

  cardWrapper:{
    flexDirection: 'row',
  },
  infoWrapper:{
    width: '75%',
  },
  categoryStickyWrapper: {
    zIndex: 1,
    backgroundColor: '#235F30',
    paddingBottom: 8,
  },  

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },

  labelImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },

  labelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    textTransform: 'uppercase',
  },

  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
    gap: 2,
    
  },

  itemChip: {
    backgroundColor: '#1E592B', // or whatever green you want
    borderRadius: 5,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginRight: 6,
    marginBottom: 6,
  },

  itemChipText: {
    color: '#fff',
    fontWeight: 'thin',
    fontSize: 10,
    textTransform: 'uppercase',
  },


  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C5735',
    borderRadius: 6,
    paddingVertical: 10,
    justifyContent: 'center',
  },

  actionIconImage: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
    tintColor: '#00FF66', // matches your green color
  },


  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },

  actionMenu: {
    backgroundColor: '#2C5735',
    borderRadius: 8,
    width: 40,           
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center',
  },

  dots: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  categoryWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  
  categoryButtonSmall: {
    flex: 1, // takes less space
    maxWidth: 80,
    backgroundColor: '#1A3620',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  
  categoryButtonWide: {
    flex: 1.5, // takes more space
    backgroundColor: '#1A3620',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  
  categoryActive: {
    backgroundColor: '#00FF66',
  },
  
  categoryText: {
    color: '#FFFFFF',
    fontWeight: 'normal',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  
  categoryTextActive: {
    color: '#023F0F',
    fontWeight: 'bold',
  },
  
  headerWrapper: {
    backgroundColor: '#235F30', // overall screen background
    padding: 16,
  },

  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 100,
    height: 24,
    resizeMode: 'contain',
    marginRight: 8,
  },

  searchWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },

  searchBar: {
    backgroundColor: '#1A3620',
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
  },

  notificationWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categories: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#023F0F',
    color: '#fff',
  },
  categoryChip: {
    marginRight: 8,
  },
  card: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#1A3620',

  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  userName: {
    fontWeight: 'bold',
    color: '#fff',
  },
  timePosted: {
    color: '#BFBFBF',
    fontSize: 10,
    marginHorizontal:8,
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
 
  postImage: {
    marginVertical: 8,
    borderRadius: 8,
    width: 80,  
    height: 80, 
    marginTop: 2,
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
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
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