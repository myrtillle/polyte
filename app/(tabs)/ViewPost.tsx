// ViewPostScreen.tsx
import React,  { useState, useEffect }  from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert  } from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, Divider, IconButton } from 'react-native-paper';
import { commentsService } from '../../services/commentsService';
import { supabase } from '../../services/supabase';
import { Post } from '../../types/navigation'; 
import { Comment } from '../../types/navigation'; 
import { getOffersByPost } from '../../services/offersService'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postsService } from '../../services/postsService';
import { MaterialIcons } from '@expo/vector-icons';
import { Offer } from '../../services/offersService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';




type ViewPostRouteProp = RouteProp<RootStackParamList, 'ViewPost'>;
type viewPostNavigationProp = StackNavigationProp<RootStackParamList, 'ViewPost'>;

const ViewPost = () => {
  const route = useRoute<ViewPostRouteProp>();
  const navigation = useNavigation<viewPostNavigationProp>();

  // Only ONE state for post
  const greenMark = require('../../assets/images/greenmark.png');
  const [post, setPost] = useState<Post | null>(route.params?.post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [activeTab, setActiveTab] = useState('post');
  const [offers, setOffers] = useState<Offer[]>([]);

  function formatTimeAgo(dateString: string) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }






  const getModeData = (modeName: string) => {
    const lower = modeName.toLowerCase();
    if (lower.includes('pickup')) {
      return { icon: require('../../assets/images/pickup.png'), color: '#FFD700' }; // Yellow
    } else if (lower.includes('drop')) {
      return { icon: require('../../assets/images/dropoff.png'), color: '#FF8515' }; // Orange
    } else {
      return { icon: require('../../assets/images/meetup.png'), color: '#00FF57' }; // Green
    }
  };
  
  const fetchPostAndOffers = async () => {
    try {
      // ✅ Get post ID from existing state or route params
      const postId = post?.id || route.params?.post?.id;
  
      if (!postId) {
        console.error("❌ No valid post ID!");
        return;
      }
  
      console.log("🔄 Fetching post and offers for ID:", postId);
  
      // ✅ Fetch post details (including post_item_types)
      const fetchedPost = await postsService.getPostById(postId);
      setPost(fetchedPost);
  
      // ✅ Fetch offers for this post
      const fetchedOffers = await getOffersByPost(postId);
      setOffers(fetchedOffers);
  
    } catch (error) {
      console.error("❌ Error fetching post and offers:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      console.log('🔄 Fetching comments for post ID:', postId);
      const data = await commentsService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  
  const handleSendComment = async () => {
    console.log("🔍 Debugging handleSendComment:");
    console.log("➡️ commentText:", commentText);
    console.log("➡️ post.id:", post?.id);
    console.log("➡️ currentUser.id:", currentUser?.id);
    
    if (!commentText.trim() || !post?.id || !currentUser?.id) {
      console.warn("⚠️ Cannot send comment: Missing data!");
      return;
    }
    
    try {
      console.log("Sending comment:", commentText);
      const newComment = await commentsService.addComment(post.id, currentUser.id, commentText);
  
      if (newComment) {
        console.log("Comment Posted:", JSON.stringify(newComment, null, 2));
        fetchComments(post.id);
        setCommentText('');
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };
  
  const fetchOffers = async () => {
    if (!post?.id) return;
    try {
      console.log("Fetching offers for post ID:", post.id);
      const data = await getOffersByPost(post.id);
      
      if (!data) {
        console.error("No offers received.");
        setOffers([]);
        return;
      }
  
      // images parsed correctly
      const formattedOffers = data.map(offer => ({
        ...offer,
        images: typeof offer.images === "string" ? JSON.parse(offer.images) : offer.images ?? [],
      }));
  
      console.log("Fetched Offers:", JSON.stringify(formattedOffers, null, 2));
      setOffers(formattedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };
  
  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);
  
      if (error) throw error;
  
      console.log("✅ Offer deleted successfully");
      setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
    } catch (error) {
      console.error("❌ Error deleting offer:", error);
    }
  };

  const handleEditOffer = (offer: Offer) => {
    const offerWithPostTypes = {
      ...offer,
      post_item_types: post?.post_item_types ?? [],
    };
  
    console.log("✏️ Navigating to EditOffer with:", offerWithPostTypes);
    navigation.navigate("EditOffer", { offer: offerWithPostTypes });
  };    
  
  const handleDeclineOffer = async (offerId: string) => {
    console.log("Declining offer ID:", offerId);
    // logic 
  };
  
  const handleAcceptOffer = (offer: Offer) => {
    if (!post) {
      console.error("Cannot navigate to ScheduleOffer: post is null");
      return;
    }

    console.log("✅ Accepting offer, navigating to ScheduleOffer:", offer);
    
    navigation.navigate("ScheduleOffer", { offer, post });
  };
  
  const handleChatWithUser = (userId: string) => {
    console.log("Chatting with user ID:", userId);
    // Navigate to chat screen
    // navigation.navigate("Messages", { userId });
  };    

  const isOfferOwner = (offer: Offer) => {
    console.log(`Checking if ${currentUser?.id} is owner of offer ${offer.id}: ${offer.user_id === currentUser?.id}`);
    return offer.user_id === currentUser?.id;
  };
  
  const isPostOwner = () => {
    console.log(`Checking if ${currentUser?.id} is owner of post ${post?.id}: ${post?.user_id === currentUser?.id}`);
    return post?.user_id === currentUser?.id;
  };

  const handleSeeDetails = (offer: Offer) => {
    navigation.navigate("CollectionSchedule", { offerID: offer.id });
  };

  const isOfferAccepted = (offer: Offer) => {
    return offer.status === 'accepted';
  };

  // ✅ Ensure both post & offers are fetched on mount
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Resetting post and offers on focus...");
      setPost(route.params?.post || null);  // Reset post to the passed post data
      fetchPostAndOffers();  // Fetch the updated data
      return () => {
        setPost(null);  // Clean up when unfocused
        setOffers([]);  // Clear previous offers
      };
    }, [route.params?.post])
  );

  // Fetch comments only when a new post is received
  useEffect(() => {
    if (route.params?.post?.id) {
      fetchComments(route.params.post.id);
    }
  }, [route.params?.post]);

  // Logged in user
  useEffect(() => {
    const getUser = async () => {
      console.log("🔍 Fetching authenticated user...");
      const { data, error } = await supabase.auth.getUser();
  
      if (error) {
        console.error("❌ Error fetching user:", error.message);
      } else {
        console.log("✅ Authenticated User:", data.user);
        setCurrentUser(data.user);
      }
    };
  
    getUser();
  }, []);      
  
  useEffect(() => {
    console.log("Current User ID:", currentUser?.id);
    console.log("Post Owner ID:", post?.user_id);
    offers.forEach((offer) => {
      console.log(`Offer ID: ${offer.id}, Made By User ID: ${offer.user_id}`);
    });
  }, [currentUser, offers]);
  
  useEffect(() => {
    if (activeTab === 'offers' && offers.length === 0) {
      fetchOffers();
    }
  }, [activeTab, post?.id]);

  useEffect(() => {
    console.log("🔄 Resetting activeTab and clearing offers...");
    setActiveTab('post'); // ✅ Reset tab to "Post" when a new post is loaded
    setOffers([]); // ✅ Clear previous offers
    fetchPostAndOffers();
  }, [route.params?.post]);

  useEffect(() => {
    const commentSubscription = supabase
      .channel('realtime:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        console.log('🔄 New comment added:', payload.new);
  
        // Transform the payload to conform to the Comment type
        const newComment: Comment = {
          id: payload.new.id,
          post_id: payload.new.post_id,
          user_id: payload.new.user_id,
          user_name: payload.new.user_name,
          comment_text: payload.new.text,
          created_at: payload.new.created_at,
        };
  
        // Add the new comment to the existing state
        setComments((prevComments) => [...prevComments, newComment]);
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(commentSubscription);
    };
  }, []);  

  // console.log('ViewPost  Post Object:', post);
  // Move this block AFTER all hooks
  if (!post) {
    console.log("post is NULL before rendering!");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Post not found</Text>
      </View>
    );
  } else {
    console.log("Rendering ViewPost with post data:", post);  
  }

  return (
    <View style={styles.container}> 
      {/* Back Button */}
      <View style={styles.headerContainer}>
  <IconButton
    icon="arrow-left"
    size={24}
    iconColor="white"
    onPress={() => navigation.goBack()}
    style={{ position: 'absolute', left: 0 }}
  />
<Text style={styles.headerTitle}>See Post</Text>
</View>

      {/* Header Tabs */}
      <View style={styles.tabContainer}>
      <TouchableOpacity
    onPress={() => setActiveTab('post')}
    style={[
      styles.tabButton,
      activeTab === 'post' && styles.activeTabButton,
    ]}
  >
          <Text
            style={[
              styles.tabText,
              activeTab === 'post' && styles.activeTabText,
            ]}
          >
            POST
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('offers')}
          style={[
            styles.tabButton,
            activeTab === 'offers' && styles.activeTabButton,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'offers' && styles.activeTabText,
            ]}
          >
            OFFERS
          </Text>
        </TouchableOpacity>
            </View>

      {activeTab === 'post' ? (
        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
          <Image source={{ uri: 'https://i.pravatar.cc/40' }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{post.user?.name}</Text>
            <View style={styles.userLocationRow}>
            <Image source={greenMark} style={styles.greenMarkIcon} />
            <Text style={styles.userLocationText}>{post.user?.barangay}, Purok {post.user?.purok}</Text>
          </View>

          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}> {formatTimeAgo(post.created_at)}</Text>
          </View>
        </View>
          
        {post.collection_mode?.name && (
  <View style={styles.modeContainer}>
    {(() => {
      const mode = getModeData(post.collection_mode.name);
      return (
        <>
          <Image
            source={mode.icon}
            style={[styles.modeIcon, { tintColor: mode.color }]}
            resizeMode="contain"
          />
          <Text style={[styles.modeText, { color: mode.color }]}>
            {post.collection_mode.name}
          </Text>
        </>
      );
    })()}
  </View>
)}


          {/* Post Description */}
          <Text style={styles.description}>{post.description}</Text>

          {/* Item Types */}
          <View style={styles.itemList}>
          {post.post_item_types?.map((item, index) => (
            <TouchableOpacity key={index} style={styles.itemChip}>
              <Text style={styles.itemChipText}>{item.item_types.name}</Text>
            </TouchableOpacity>
          ))}
        </View>


          {/* Post Image */}
          {post.photos && post.photos.length > 0 && (
            <Image source={{ uri: post.photos[0] }} style={styles.postImage} />
          )}

          {/* Action Buttons */}
                <View style={styles.actionRow}>
        <TouchableOpacity style={styles.fullButton}>
          <Image
            source={require('../../assets/images/messagebubble.png')}
            style={styles.buttonIcon}
          />
          <Text style={styles.fullButtonText}>SEND MESSAGE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fullButton}
          onPress={() => {
            if (!post?.post_item_types?.length) {
              Alert.alert("Error", "Plastic item types are missing.");
              return;
            }
            navigation.navigate('MakeOffer', { post });
          }}
        >
          <Image
            source={require('../../assets/images/trashbag.png')}
            style={styles.buttonIcon}
          />
          <Text style={styles.fullButtonText}>SEND OFFER</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconOnlyButton}>
          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>
      </View>



          {/* Comments Section */}
          <Divider style={styles.divider} />
          <Text style={styles.commentsHeader}>Comments</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet.</Text>
          ) : (
            comments.map((comment, index) => (
              <View key={index} style={styles.comment}>
              <Image source={{ uri: 'https://i.pravatar.cc/30' }} style={styles.commentAvatar} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>{comment.user_name}</Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.comment_text}</Text>
              </View>
            </View>

            ))
          )}

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#A0A0A0"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            onPress={() => {
              console.log("📝 Comment button clicked!"); // ✅ Your original debug log
              handleSendComment();
            }}
            style={styles.sendButton}
          >
            <Image
              source={require('../../assets/images/paperplane.png')}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        activeTab === 'offers' ? (
          <ScrollView style={styles.content}>
            {offers.length === 0 ? (
              <Text style={styles.noOffers}>No offers yet.</Text>
            ) : (
              offers.map((offer, index) => {
                const isUserOfferOwner = isOfferOwner(offer);
                const isUserPostOwner = isPostOwner();
                const isAccepted = isOfferAccepted(offer);

                return (
                  <View key={index} style={styles.offerCard}>
                    <Text style={styles.offerUser}>👤 User ID: {offer.user_id}</Text>
                    <Text style={styles.offerDetails}>📦 Items: {offer.offered_items.join(', ')}</Text>
                    <Text style={styles.offerDetails}>⚖️ Weight: {offer.offered_weight} of {offer.requested_weight} kg</Text>
                    <Text style={styles.offerDetails}>💰 Price: ₱{offer.price.toFixed(2)}</Text>
                    <Text style={styles.offerMessage}>📩 {offer.message || 'No message provided'}</Text>
        
                    {/* Offer Images */}
                    {offer.images && offer.images.length > 0 ? (
                      <ScrollView horizontal style={styles.imageScroll}>
                        {offer.images.map((image, i) => (
                          <Image key={i} source={{ uri: image }} style={styles.offerImage} />
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noImage}>No images available</Text>
                    )}
        
                    {/* Conditional Buttons */}
                    <View style={styles.actionButton}>
                      {isAccepted ? (
                        <View style={styles.actionButtonContainer}>
                        <TouchableOpacity 
                          style={styles.moreOptions} 
                          onPress={() => handleSeeDetails(offer)}
                        >
                          <Text style={styles.buttonText}>See Details</Text>
                        </TouchableOpacity>                      
                      </View>
                      ) : isUserOfferOwner ? (
                        <View style={styles.actionButtonContainer}>
                          <TouchableOpacity 
                            style={styles.deleteButton} 
                            onPress={() => handleDeleteOffer(offer.id)}
                          >
                            <Text style={styles.buttonText}>🗑 Delete My Offer</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.editButton} onPress={() => handleEditOffer(offer)}>
                            <MaterialIcons name="edit" size={20} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : isUserPostOwner ? (
                        <View style={styles.actionButtonContainer}>
                          <TouchableOpacity 
                            style={styles.declineButton} 
                            onPress={() => handleDeclineOffer(offer.id)}
                          >
                            <Text style={styles.buttonText}>❌ Decline</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.chatButton} 
                            onPress={() => handleChatWithUser(offer.user_id)}
                          >
                            <Text style={styles.buttonText}>💬 Chat</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.acceptButton} 
                            onPress={() => handleAcceptOffer(offer)}
                          >
                            <Text style={styles.buttonText}>✅ Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.moreOptions}>
                            <Text style={styles.moreOptionsText}>⋮</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null
                    }
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : null
      )}
    </View>
  );
};

const styles = StyleSheet.create({

  sendButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendIcon: {
    width: 28,
    height: 28,
    // tintColor: '#00FF57', // optional if you want to recolor the icon
  },  
  
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  
  commentBody: {
    flex: 1,
    backgroundColor: '#1E3D28',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 10,
  },
  
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  commentUser: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  
  commentTime: {
    color: '#A9A9A9',
    fontSize: 12,
  },
  
  commentText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },
  

    actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },

  fullButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3D28',
    paddingVertical: 14,
    borderRadius: 5,
    gap: 8,
  },

  buttonIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  fullButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },

  iconOnlyButton: {
    width: 48,
    height: 46,
    backgroundColor: '#1E3D28',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dots: {
    color: '#FFFFFF',
    fontSize: 25,
  },

  userLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  
  greenMarkIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    resizeMode: 'contain',
  },
  
  userLocationText: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  
  itemChip: {
    backgroundColor: '#1E592B',
    borderRadius:5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  
  itemChipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },  
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 2,
  },
  
  modeIcon: {
    width: 18,
    height: 18,
  },
  
  modeText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  userAddress: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  
  timeContainer: {
    alignItems: 'flex-end',
  },
  
  timeText: {
    fontSize: 12,
    color: '#8F8F8F',
    fontStyle: 'normal',
  },
  

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#122C0F',
  },
  
  tabButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: '#1E3D28',
    borderRadius: 8,
    alignItems: 'center',
  },
  
  activeTabButton: {
    backgroundColor: '#0FC246',
  },
  
  tabText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  activeTabText: {
    color: '#FFFFFF',
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1A3620',
    position: 'relative',
  },
  
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  
  container: { 
    flex: 1, 
    backgroundColor: '#122C0F' 
  },
  backButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  tab: { 
    padding: 10, 
    borderRadius: 5 
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: 'white' 
  },

  content: { 
    padding: 15 
  },

  userLocation: { 
    fontSize: 14, 
    color: 'gray' 
  },
  timeAgo: { 
    fontSize: 12, 
    color: 'gray' 
  },
  description: { 
    fontSize: 12, 
    color: 'white', 
    marginBottom: 5 
  },
  itemTypes: { 
    fontSize: 14, 
    color: 'lightgray', 
    marginBottom: 10 
  },
  postImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 10 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  moreOptionsText: { 
    fontSize: 24, 
    color: 'white' 
  },
  divider: { 
    backgroundColor: 'gray', 
    height: 1, 
    marginVertical: 10 
  },
  commentsHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 5 
  },
  noComments: { 
    fontSize: 14, 
    color: 'gray', 
    textAlign: 'center' 
  },
  commentInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#234A2D', 
    borderRadius: 5,
    marginVertical: 5,
  },
  
  commentInput: { 
    flex: 1, 
    color: 'white', 
    padding: 10 
  },

  sendButtonText: { 
    fontSize: 18, 
    color: 'white' 
  },
  emptyTab: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  noOffers: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  
  offerCard: {
    backgroundColor: '#1F3D19',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  
  offerUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00FF57',
  },
  
  offerDetails: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  
  offerMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#B0B0B0',
    marginTop: 8,
  },  
  imageScroll: {
    marginTop: 10,
    flexDirection: 'row',
  },
  
  offerImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  
  noImage: {
    color: '#B0B0B0',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5,
  },

  // Buttons
  actionButton: {
    flex: 1, 
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5, 
  },
  actionButtonContainer:{
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  moreOptions: { 
    backgroundColor: '#ccc', // Gray
    padding: 8,
    borderRadius: 3, 
  },
  buttonText:{
    flex: 1, 
    marginHorizontal: 5 
  },
  deleteButton: {
    flex: 1, 
    marginHorizontal: 5,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  editButton:{
    backgroundColor: '#2C5735', // Gray
    padding: 8,
    borderRadius: 3,
  },
  declineButton: {
    backgroundColor: '#B22222', // Dark Red
    padding: 10,
    borderRadius: 5,
  },
  chatButton: {
    backgroundColor: '#007bff', // Blue
    padding: 10,
    borderRadius: 5,
  },
  
  acceptButton: {
    backgroundColor: '#28a745', // Green
    padding: 10,
    borderRadius: 5,
  },
  

});

export default ViewPost;
