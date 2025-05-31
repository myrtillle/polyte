import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, FlatList, RefreshControl, Modal, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, IconButton, ActivityIndicator } from 'react-native-paper';
import { postsService } from '../../services/postsService';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { HomeStackParamList, MessagesStackParamList, RootStackParamList } from '../../types/navigation';
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
import { messagesService } from '@/services/messagesService';
import { Post } from '../../services/postsService';
import Constants from 'expo-constants';


interface Category {
  id: number;
  name: string;
}

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

function formatTimeAgo(date: string) {
  // Ensure the date string is interpreted as UTC
  const utcDateString = date.endsWith('Z') ? date : date + 'Z';
  const now = new Date();
  const postDate = new Date(utcDateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  console.log('🔍 Time Debug:', {
    inputDate: date,
    utcDateString: utcDateString,
    parsedDate: postDate.toISOString(),
    now: now.toISOString(),
    diffInSeconds,
    diffInMinutes: Math.floor(diffInSeconds / 60),
    diffInHours: Math.floor(diffInSeconds / 3600)
  });

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
  //navigation
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  
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
  const [showBadge, setShowBadge] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Add a ref to track if the component is mounted
  const mounted = useRef(false);

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
      // console.log('🔄 Fetched posts:', posts);
    }
  };
  
  const handleSendMessage = async (post: Post) => {
    if (!currentUserId) {
      Alert.alert("Error", "Please log in to send messages");
      return;
    }

    const senderId = currentUserId;
    const receiverId = post.user_id;

    try {
      // First check if a chat already exists
      const { data: existingChat, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
        .or(`user1_id.eq.${receiverId},user2_id.eq.${receiverId}`)
        .single();

      let chatId;

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No chat exists, create a new one
          const { data: newChat, error: createError } = await supabase
            .from('chats')
            .insert([
              { user1_id: senderId, user2_id: receiverId }
            ])
            .select('id')
            .single();

          if (createError) throw createError;
          chatId = newChat.id;
        } else {
          throw fetchError;
        }
      } else {
        chatId = existingChat.id;
      }

      navigation.navigate('Main', {
        screen: 'Messages',
        params: {
          screen: 'ChatScreen',
          params: {
            chatId,
            userId: senderId,
            post,
          }
        }
      });
    } catch (error) {
      console.error("❌ Failed to get or create chat:", error);
      Alert.alert("Error", "Could not start chat. Please try again.");
    }   
  };

  const navigateToViewPost = async (post: Post) => {
    try {
      console.log("🚀 Navigating to ViewPost with post:", post);
      await AsyncStorage.setItem('lastViewedPost', JSON.stringify(post));
      
      homeNavigation.navigate('ViewPost', { post });
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

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Home screen focused, refreshing posts...');
      fetchPosts();
    }, [])
  );

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
        setShowBadge(count > 0);
      }
    };
  
    fetchUnread();
  }, []);

  // Add real-time subscription for notifications
  useEffect(() => {
    mounted.current = true;
  
    if (!currentUserId) {
      console.log('🚫 No currentUserId, skipping notification subscription.');
      return;
    }
  
    console.log('🔔 Attempting to subscribe to notifications for user:', currentUserId);
  
    const notificationSubscription = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        async (payload) => {
          const newRow = payload.new as { user_id: string };

  if (!newRow || newRow.user_id !== currentUserId) return; // ✅ manually filter only your own notifications
  
          if (payload.eventType === 'INSERT') {
            setShowBadge(true);
          }
  
          try {
            const count = await notificationService.getUnreadCount(currentUserId);
            if (!mounted.current) return;
            setUnreadCount(count);
            setShowBadge(count > 0);
          } catch (error) {
            console.error('❌ Error updating notification count:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Notification subscription active');
        } else {
          console.warn('⚠️ Subscription status:', status);
        }
      });
  
    return () => {
      mounted.current = false;
      supabase.removeChannel(notificationSubscription);
    };
  }, [currentUserId]);
  

  const handleNotificationPress = () => {
    setShowBadge(false); // Hide badge when notification icon is clicked
    homeNavigation.navigate('Notifications');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FF57" />
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
    {/* Top Row: Logo + Notification */}
    <View style={styles.headerTopRow}>
      <Image 
        source={require('../../assets/images/polyte-logo.png')} 
        style={styles.logo} 
      />
      <TouchableOpacity style={styles.notificationWrapper} onPress={handleNotificationPress}>
        <IconButton icon="bell" iconColor="#00FF57" size={24} />
        {unreadCount > 0 && showBadge && (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </TouchableOpacity>
    </View>

    {/* Second Row: Searchbar */}
    <View style={styles.searchWrapper}>
      <Searchbar
        placeholder="PLASTIC, OBRERO USEP"
        placeholderTextColor="#888E96"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={{
          color: '#CCCCCC',
          fontWeight: '400',
          fontSize: 12,
          textAlign: 'center',
          paddingHorizontal: 20,
          marginRight: 26,
        }}
        iconColor="#888E96"
      />
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
          SEEKING
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
          SELLING
        </Text>
      </TouchableOpacity>
    </View>
  );
  

  const filteredPosts = posts.filter(post => {
    const isNotMyPost = post.user_id !== currentUserId;
    const matchesCategory = selectedCategory ? post.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.barangay?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.purok?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.post_item_types?.some(item =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <View style={[
          styles.cardWrapper,
          (!item.photos || item.photos.length === 0) && { flexDirection: 'column' }
        ]}>
          <View style={[
            styles.infoWrapper,
            (!item.photos || item.photos.length === 0) && { width: '100%', alignItems: 'flex-start' }
          ]}>
            {/* Name and time */}
            <View style={styles.userInfo}>
            <Text style={styles.userName}>
              { item.user?.username || 'Anonymous User' }
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
              {(item.post_item_types ?? []).slice(0, 2).map((type, index) => (
                <Chip
                  key={index}
                  style={styles.itemChip}
                  textStyle={styles.itemChipText}
                >
                  {type?.name ?? 'Unknown'}
                </Chip>
              ))}
              {(item.post_item_types && item.post_item_types.length > 2) && (
                <Chip
                  key="more"
                  style={styles.itemChip}
                  textStyle={styles.itemChipText}
                >
                  +{item.post_item_types.length - 2}
                </Chip>
              )}
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
            onPress={() => homeNavigation.navigate('ViewPost', { post: item })}
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

headerTopRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

logo: {
  width: 100,
  height: 30,
  resizeMode: 'contain',
},

searchWrapper: {
  backgroundColor: '#1A3620',
  borderRadius: 16,
  paddingHorizontal: 6,
  
},

searchBar: {
  backgroundColor: 'transparent',
  borderRadius: 16,
  height: 44,
  elevation: 0,
},

notificationWrapper: {
  position: 'relative',
},

badge: {
  position: 'absolute',
  top: 4,
  right: 4,
},

badgeDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: 'red',
},


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
  
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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