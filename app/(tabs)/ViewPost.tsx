// ViewPostScreen.tsx
import React,  { useState, useEffect, useRef }  from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList, RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, Chip, Divider, IconButton } from 'react-native-paper';
import { commentsService } from '../../services/commentsService';
import { supabase } from '../../services/supabase';
import { Post } from '../../services/postsService';
import { Comment } from '../../types/navigation'; 
import { getOffersByPost, offersService } from '../../services/offersService'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postsService } from '../../services/postsService';
import { MaterialIcons } from '@expo/vector-icons';
import { Offer } from '../../services/offersService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { notificationService } from '@/services/notificationService';
import { messagesService } from '@/services/messagesService';
import Constants from 'expo-constants';
import ConfettiCannon from 'react-native-confetti-cannon';


type ViewPostRouteProp = RouteProp<HomeStackParamList, 'ViewPost'>;
type viewPostNavigationProp = StackNavigationProp<HomeStackParamList, 'ViewPost'>;

const ViewPost = () => {
  const route = useRoute<ViewPostRouteProp>();
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();  
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const { postId } = route.params;
  // Only ONE state for post  
  const greenMark = require('../../assets/images/greenmark.png');
  const cashIcon = require('../../assets/images/cash.png');
  const [post, setPost] = useState<Post | null>(route.params?.post ?? null)

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('post');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [showWeightGoalDialog, setShowWeightGoalDialog] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  // const [confettiRef, setConfettiRef] = useState<any>(null);
  
  const confettiRef = useRef<ConfettiCannon>(null);

  function formatTimeAgo(dateString: string) {
    // Ensure the date string is interpreted as UTC
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const now = new Date();
    const postDate = new Date(utcDateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    console.log('🔍 Time Debug:', {
      inputDate: dateString,
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
  
  const isSellingPost = post?.category_id === 2;

  const fetchPostAndOffers = async () => {
    try {
      setLoading(true);
      const postId = post?.id || route.params?.postId || route.params?.post?.id;
      if (!postId) {
        console.error("❌ No valid post ID!");
        return;
      }
  
      console.log("🔄 Fetching post and offers for ID:", postId);
  
      // ✅ Fetch post details (including post_item_types)
      const fetchedPost = await postsService.getPostById(postId);
      console.log("📦 Fetched post data:", {
        id: fetchedPost.id,
        kilograms: fetchedPost.kilograms,
        remaining_weight: fetchedPost.remaining_weight,
        status: fetchedPost.status
      });
      setPost(fetchedPost);
      
      setLoading(false);
      // ✅ Fetch offers for this post
      const fetchedOffers = await getOffersByPost(postId);
      setOffers(fetchedOffers);
    } catch (error) {
      console.error("❌ Error fetching post and offers:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser?.id || !post?.user_id) {
      Alert.alert("Error", "Cannot start chat: Missing user info.");
      return;
    }
  
    try {
      // First try to get an existing chat
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .or(
          `and(user1_id.eq.${currentUser.id},user2_id.eq.${post.user_id}),and(user1_id.eq.${post.user_id},user2_id.eq.${currentUser.id})`
        );

      if (fetchError) {
        throw fetchError;
      }

      let chatId;
      
      // If we have existing chats, use the most recent one
      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new chat if none exists
        const { data: newChat, error: insertError } = await supabase
          .from('chats')
          .insert({ user1_id: currentUser.id, user2_id: post.user_id })
          .select()
          .single();

        if (insertError) throw insertError;
        chatId = newChat.id;
      }
  
      navigation.navigate('Main', {
        screen: 'Messages',
        params: {
          screen: 'ChatScreen',
          params: {
            chatId,
            userId: currentUser.id,
            post,
          }
        }
      });
    } catch (err) {
      console.error("❌ Failed to navigate to ChatScreen:", err);
      Alert.alert("Error", "Failed to start chat.");
    }
  };
  
  console.log('RAW location:', post?.location);

  const extractCoords = (pointStr: string) => {
    const match = pointStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) return null;
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  };
  
  const coords = typeof post?.location === 'string' ? extractCoords(post.location) : null;

  console.log('coords: ', coords);

  const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';

  const reverseGeocode = async (latitude: number, longitude: number) => {
    console.log('📍 Trying to reverse geocode (Google) lat:', latitude, 'lng:', longitude);
    console.log("🌍 Sending coords to Google:", latitude, longitude);
    console.log("Current Google Maps API Key:", GOOGLE_MAPS_API_KEY);

    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      // console.log('🏠 Google Maps Geocode Response:', data);
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('⚠️ No address found in Google Maps.');  
        return null;
      }
    } catch (error) {
      console.error('❌ Error reverse geocoding with Google Maps:', error);
      return null;
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
      Alert.alert("Error", "Cannot send comment: Missing required information");
      return;
    }
    
    try {
      console.log("Sending comment:", commentText);
      const newComment = await commentsService.addComment(
        post.id, 
        currentUser.id, 
        commentText
      );

      if (newComment) {
        console.log("Comment Posted:", JSON.stringify(newComment, null, 2));
        fetchComments(post.id);
        setCommentText('');
      } else {
        console.error("Failed to post comment: No comment data returned");
        Alert.alert("Error", "Failed to post comment. Please try again.");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert("Error", "Failed to post comment. Please try again.");
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
    try {
      console.log("❌ Attempting to decline offer:", offerId);
      
      const { error } = await supabase
        .from("offers")
        .update({ status: 'declined' })
        .eq("id", offerId);

      if (error) throw error;

      console.log("✅ Offer declined successfully:", offerId);
      setOffers((prev) => prev.map((offer) => {
        console.log(`Updating offer ${offer.id} status:`, offer.status);
        return offer.id === offerId ? { ...offer, status: 'declined' } : offer;
      }));

      // Send notification to the offerer
      const declinedOffer = offers.find(o => o.id === offerId);
      if (declinedOffer) {
        console.log("📬 Sending decline notification to user:", declinedOffer.buyer_id);
        await notificationService.sendNotification(
          declinedOffer.buyer_id,
          'Offer Declined',
          'Your offer has been declined by the post owner.',
          'offer_declined',
          {
            type: 'offer',
            id: offerId
          }
        );
      }

    } catch (error) {
      console.error("❌ Error declining offer:", error);
      Alert.alert("Error", "Failed to decline offer. Please try again.");
    }
  };
  
  const handleAcceptOffer = async (offer: Offer) => {
    if (!post) {
      console.error("Cannot navigate to ScheduleOffer: post is null");
      return;
    }

    console.log("✅ Accepting offer:", {
      offerId: offer.id,
      currentStatus: offer.status,
      postId: post.id
    });

    navigation.navigate("ScheduleOffer", { offer, post });
  };
  
  const handleChatWithUser = async (userId: string) => {
    if (!currentUser?.id || !post) {
      Alert.alert("Error", "Cannot start chat: Missing required information.");
      return;
    }

    try {
      // First try to get an existing chat
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .or(
          `and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`
        );

      if (fetchError) {
        throw fetchError;
      }

      let chatId;
      
      // If we have existing chats, use the most recent one
      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new chat if none exists
        const { data: newChat, error: insertError } = await supabase
          .from('chats')
          .insert({ user1_id: currentUser.id, user2_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        chatId = newChat.id;
      }

      // Navigate to chat screen through the root navigator
      navigation.navigate('Main', {
        screen: 'Messages',
        params: {
          screen: 'ChatScreen',
          params: {
            chatId,
            userId: currentUser.id,
            post,
          }
        }
      });
    } catch (err) {
      console.error("❌ Failed to navigate to ChatScreen:", err);
      Alert.alert("Error", "Failed to start chat. Please try again.");
    }
  };    

  const isUserOfferer = (offer: Offer) => {
    if (!currentUser) return false;
    // For seeking posts (category_id === 1), current user is seller
    // For selling posts (category_id === 2), current user is buyer
    return currentUser.id === offer.seller_id;
  };
  
  const isUserCollector = (offer: Offer) => {
    if (!currentUser) return false;
    return currentUser.id === offer.buyer_id;
  };   

  const isOfferAccepted = (offer: Offer) => {
    return offer.status === 'accepted';
  };
  
  const isActualPostOwner = () => {
    console.log(`Checking if ${currentUser?.id} is owner of post ${post?.id}: ${post?.user_id === currentUser?.id}`);
    return currentUser?.id === post?.user_id;
  };
  
  const isOfferer = (offer: Offer) => {
    const isOfferer = offer.seller_id === currentUser?.id; // assuming seller initiates the offer
    console.log(`Checking if ${currentUser?.id} is the offerer (seller) of offer ${offer.id}: ${isOfferer}`);
    return isOfferer;
  };  
  
  const isPostOwner = () => {
    console.log(`Checking if ${currentUser?.id} is owner of post ${post?.id}: ${post?.user_id === currentUser?.id}`);
    return post?.user_id === currentUser?.id;
  };

  const handleSeeDetails = (offer: Offer) => {
    rootNavigation.navigate('Main', {
                screen: 'Profile',
                params: {
                    screen: 'ViewTransaction',
                    params: { offerId: offer.id }
                }
              });
  };

  const handleInterested = async () => {
    if (!currentUser?.id) {
      console.error("Cannot express interest: No authenticated user!");
      return;
    }

    if (!post?.id) {
      console.error("Cannot express interest: No valid post!");
      return;
    }

    try {
      // Check if user already has an interest for this post
      const { data: existingOffers, error: checkError } = await supabase
        .from('offers')
        .select(`
          id, 
          status,
          offer_schedules (
            status
          )
        `)
        .eq('post_id', post.id)
        .eq('buyer_id', currentUser.id); // For selling posts, current user is buyer

      if (checkError) {
        console.error("Error checking existing interests:", checkError);
        Alert.alert("Error", "Failed to check existing interests. Please try again.");
        return;
      }

      if (existingOffers && existingOffers.length > 0) {
        const existingOffer = existingOffers[0];
        const scheduleStatus = existingOffer.offer_schedules?.[0]?.status;
        
        // If the interest is pending or accepted, show message
        if (existingOffer.status === 'pending' || existingOffer.status === 'accepted' || 
            scheduleStatus === 'pending' || scheduleStatus === 'accepted') {
          Alert.alert(
            "Existing Interest",
            "You have already shown interest in this post.",
            [{ text: "OK", style: "cancel" }]
          );
          return;
        }
        
        // If the interest was declined or completed, allow showing interest again
        if (existingOffer.status === 'declined' || existingOffer.status === 'completed' || 
            scheduleStatus === 'declined' || scheduleStatus === 'completed') {
          const { data: insertData, error: insertError } = await supabase
            .from('offers')
            .insert([
              {
                post_id: post.id,
                buyer_id: currentUser.id,
                seller_id: post.user_id,
                offered_items: post.post_item_types,
                // Set offered_weight based on post category
                offered_weight: post.kilograms,
                requested_weight: 0,
                price: post.price,
                message: 'Interested in collecting your plastics!',
                images: [],
                status: 'pending',
              },
            ])
            .select();

          if (insertError) {
            console.error('❌ Failed to register interest:', insertError.message);
            Alert.alert('Error', 'Failed to show interest. Please try again.');
            return;
          }

          const insertedOffer = insertData?.[0];
          if (!insertedOffer) {
            console.warn('⚠️ No offer returned after insertion.');
            return;
          }

          console.log('✅ Interest registered successfully:', insertedOffer);

          // Send notification to post owner
          await notificationService.sendNotification(
            post.user_id,
            'New Interest',
            'Someone is interested in your post',
            'new_interest',
            {
              type: 'offer',
              id: post.id
            }
          );

          Alert.alert('Success', 'You are now listed as interested!');
          return;
        }
      }

      // If no existing interest, proceed with new interest
      const { data: insertData, error: insertError } = await supabase
        .from('offers')
        .insert([
          {
            post_id: post.id,
            buyer_id: currentUser.id,
            seller_id: post.user_id,
            offered_items: post.post_item_types,
            // Set offered_weight based on post category
            offered_weight: post?.category_id === 2 ? post.kilograms : 0,
            requested_weight: 0,
            price: post.price,
            message: 'Interested in collecting your plastics!',
            images: [],
            status: 'pending',
          },
        ])
        .select();

      if (insertError) {
        console.error('❌ Failed to register interest:', insertError.message);
        Alert.alert('Error', 'Failed to show interest. Please try again.');
        return;
      }

      const insertedOffer = insertData?.[0];
      if (!insertedOffer) {
        console.warn('⚠️ No offer returned after insertion.');
        return;
      }

      console.log('✅ Interest registered successfully:', insertedOffer);

      // Send notification to post owner
      await notificationService.sendNotification(
        post.user_id,
        'New Interest',
        'Someone is interested in your post',
        'new_interest',
        {
          type: 'offer',
          id: post.id
        }
      );

      Alert.alert('Success', 'You are now listed as interested!');
    } catch (err) {
      console.error('❌ Unexpected error in handleInterested:', err);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  const handleMakeOffer = async () => {
    if (!currentUser?.id || !post?.id) {
      Alert.alert("Error", "Cannot make offer: Missing user or post information.");
      return;
    }
  
    try {
      console.log("🔍 Checking offers for post:", post.id, "by user:", currentUser.id);
  
      // Step 1: Fetch existing offers
      const { data: existingOffers, error: checkError } = await supabase
        .from('offers')
        .select(`
          id,
          status,
          offer_schedules (
            status
          )
        `)
        .eq('post_id', post.id)
        .eq('seller_id', currentUser.id);
  
      if (checkError) {
        console.error("❌ Error checking offers:", checkError);
        Alert.alert("Error", "Failed to check existing offers. Please try again.");
        return;
      }
  
      console.log("📦 Found offers:", existingOffers);
  
      if (existingOffers && existingOffers.length > 0) {
        // Step 2: Fetch offer_schedules per offer
        const scheduleResults = await Promise.all(
          existingOffers.map((offer) =>
            supabase
              .from('offer_schedules')
              .select('status')
              .eq('offer_id', offer.id)
              .maybeSingle()
          )
        );
  
        console.log("📆 Schedule results:", scheduleResults.map(r => r.data));
  
        // Step 3: Check for active offers
          
        // Step 4: Check for completed or declined offers
        const hasValidOldOffer = existingOffers.some((offer, index) => {
          const schedStatus = scheduleResults[index]?.data?.status;
          console.log(`✅ Valid check Offer ${offer.id}: status=${offer.status}, schedule_status=${schedStatus}`);
          return (
            offer.status === 'declined' || offer.status === 'completed' ||
            schedStatus === 'declined' || schedStatus === 'completed'
          );
        });
  
        if (hasValidOldOffer) {
          console.log("✅ Valid old offer found. Proceeding to MakeOffer.");
          if (!post?.post_item_types?.length) {
            Alert.alert("Error", "Plastic item types are missing.");
            return;
          }
          homeNavigation.navigate('MakeOffer', { post });
          return;
        }
        
        // ✅ This prevents false positives
        const hasBlockingOffer = existingOffers.some((offer, index) => {
          const schedStatus = scheduleResults[index]?.data?.status;
          const isInProgress = 
            (offer.status === 'pending' || offer.status === 'accepted') &&
            (schedStatus === 'pending' || schedStatus === 'accepted');

          console.log(`🟡 Offer ${offer.id}: inProgress=${isInProgress}`);
          return isInProgress;
        });

        if (hasBlockingOffer) {
          const activeOffer = existingOffers.find((offer, index) => {
            const schedStatus = scheduleResults[index]?.data?.status;
            const isInProgress = 
              (offer.status === 'pending' || offer.status === 'accepted') &&
              (schedStatus === 'pending' || schedStatus === 'accepted');
            return isInProgress;
          });

          console.log("⛔ Blocking offer detected. Preventing duplicate offer.");
          Alert.alert(
            "Existing Offer",
            "You have already made an offer for this post. You can edit your existing offer instead.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Edit Offer",
                onPress: () => {
                  const foundOffer = offers.find(o => o.id === activeOffer?.id);
                  if (foundOffer) handleEditOffer(foundOffer);
                }
              }
            ]
          );
          return;
        }
  
        console.log("⚠️ No valid old offer matched.");
      }
  
      // Step 5: No existing offers at all
      console.log("🆕 No previous offers found. Proceeding to MakeOffer.");
      if (!post?.post_item_types?.length) {
        Alert.alert("Error", "Plastic item types are missing.");
        return;
      }
  
      homeNavigation.navigate('MakeOffer', { post });
    } catch (error) {
      console.error("❌ Unexpected error in handleMakeOffer:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };
  
  const hasUserShownInterest = () => {
    if (!currentUser?.id || !offers) return false;
    return offers.some(offer => offer.buyer_id === currentUser.id); // For selling posts, check if current user is buyer
  };

  // both post & offers are fetched on mount
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Resetting post and offers on focus...");
      setPost(route.params?.post || null);  // Reset post to the passed post data
      fetchPostAndOffers();  // Fetch the updated data
      return () => {
        setPost(null);  // Clean up when unfocused
        setOffers([]);  // Clear previous offers
      };
    }, [route.params?.post, route.params?.postId])
  );

  useEffect(() => {
    const getAddress = async () => {
      if (coords) {
        console.log('🛰 Fetching readable address for coords:', coords);
        const addressResult = await reverseGeocode(coords.latitude, coords.longitude);
        if (addressResult) {
          console.log('✅ Address received:', addressResult);
          setAddress(addressResult);
        } else {
          console.warn('⚠️ No address found from coords.');
        }
      } else {
        console.warn('⚠️ No coordinates available to reverse geocode.');
      }
    };
    getAddress();
  }, [coords]);
  
  
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
      console.log(`Offer ID: ${offer.id}, Buyer ID: ${offer.buyer_id}, Seller ID: ${offer.seller_id}`);
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

  // Add this useEffect to handle notifications
  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUser?.id}`
        }, 
        (payload) => {
          const notification = payload.new;
          if (notification.type === 'offer' && notification.data?.type === 'offer') {
            setShowWeightGoalDialog(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (post?.remaining_weight === 0) {
        setShowCelebrationModal(true);
        setTimeout(() => {
          confettiRef.current?.start();
        }, 100);
      }
    }, [post?.id]) // depend on post.id to avoid early triggers
  );

  // Move this block AFTER all hooks
  if (loading) return <Text style={{ color: 'black' }}>Loading post...</Text>;

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

  const renderWeightGoalDialog = () => (
    <Modal
      visible={showWeightGoalDialog}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWeightGoalDialog(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Weight Goal Met! 🎉</Text>
          <Text style={styles.modalText}>
            Your post has reached its weight goal!
          </Text>
          {/* <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.greenButton]}
              onPress={handleMarkAsSolved}
            >
              <Text style={styles.modalButtonText}>Mark as Solved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.grayButton]}
              onPress={() => setShowWeightGoalDialog(false)}
            >
              <Text style={styles.modalButtonText}>Not Yet</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}> 
      {successMessage ? (
        <View style={styles.successMessageContainer}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Back Button
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="white"
          onPress={() => navigation.goBack()}
          style={{ position: 'absolute', left: 0 }}
        />
        <Text style={styles.headerTitle}>See Post</Text>
      </View> */}

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
            {post?.category_id === 2 ? 'INTERESTED USERS' : 'OFFERS'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'post' ? (
        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
          <Image source={{ uri: post.user?.profile_photo_url || 'https://i.pravatar.cc/40' }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {post.user?.username || 'Anonymous User'}
            </Text>
{/* 
            <View style={styles.userLocationRow}>
              <Image source={greenMark} style={styles.greenMarkIcon} />
              <Text style={styles.userLocationText}>{post.user?.purok}, {post.user?.barangay}</Text>
            </View> */}

          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeText}> {formatTimeAgo(post.created_at)}</Text>
          </View>
        </View>

        {/* meetup locs */}
        {/* {coords && (
          <Text style={styles.userAddress}>
            📍 {address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}
          </Text>
        )} */}

        {/* Post Description */}
        <Text style={styles.description}>{post.description}</Text>

        {/* Mode of collection */}
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

        {/* Location */}
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={20} color="#00FF57" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {coords ? (address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`) : 'No location specified'}
            </Text>
          </View>
        </View>

        {/* Weight & Price in one row */}
        <View style={styles.detailRowHorizontal}>
          <View style={[styles.detailRow, styles.detailRowFlexItem]}>
            <MaterialIcons name="scale" size={20} color="#00FF57" />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>
                {isSellingPost ? 'Available weight' : 'Remaining weight needed'}
              </Text>
              <View style={styles.weightContainer}>
                <Text style={styles.detailValue}>
                  {isSellingPost ? (
                    `${post.kilograms} kg`
                  ) : (
                    `${post.remaining_weight} kg to go out of ${post.kilograms} kg`
                  )}
                </Text>
                {!isSellingPost && (
                  <View style={styles.weightBar}>
                    <View 
                      style={[
                        styles.weightProgress, 
                        { 
                          width: `${((post.kilograms - (post.remaining_weight )) / post.kilograms) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
          {isSellingPost && (
            <View style={[styles.detailRow, styles.detailRowFlexItem, { marginLeft: 8 }]}> 
              <MaterialIcons name="payments" size={20} color="#00FF57" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>₱{post.price?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Plastic Item Types */}
        <View style={styles.itemTypesContainer}>
          <Text style={styles.itemTypesTitle}>Plastic Items</Text>
          <View style={styles.itemList}>
            {post.post_item_types?.map((type, index) => (
              <View key={index} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{type?.name ?? 'Unknown'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Post Images Grid */}
        {post.photos && post.photos.length > 0 && (
          <View style={styles.imagesGridContainer}>
            {post.photos.length === 1 ? (
              <TouchableOpacity onPress={() => {
                setPreviewImages(post.photos ?? []);
                setPreviewIndex(0);
                setPreviewImage(post.photos?.[0] ?? null);
                setPreviewVisible(true);
              }}>
                <Image 
                  source={{ uri: post.photos?.[0] }} 
                  style={styles.singleImage} 
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : post.photos.length === 2 ? (
              <View style={styles.twoImagesContainer}>
                {post.photos?.slice(0, 2).map((uri, idx) => (
                  <TouchableOpacity key={idx} onPress={() => {
                    setPreviewImages(post.photos ?? []);
                    setPreviewIndex(idx);
                    setPreviewImage(post.photos?.[idx] ?? null);
                    setPreviewVisible(true);
                  }} style={{ flex: 1 }}>
                    <Image 
                      source={{ uri }} 
                      style={styles.twoImages} 
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : post.photos.length === 3 ? (
              <View style={styles.threeImagesContainer}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                  setPreviewImages(post.photos ?? []);
                  setPreviewIndex(0);
                  setPreviewImage(post.photos?.[0] ?? null);
                  setPreviewVisible(true);
                }}>
                  <Image 
                    source={{ uri: post.photos?.[0] }} 
                    style={styles.threeImagesMain} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <View style={styles.threeImagesRight}>
                  {[1,2].map(idx => (
                    <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => {
                      setPreviewImages(post.photos ?? []);
                      setPreviewIndex(idx);
                      setPreviewImage(post.photos?.[idx] ?? null);
                      setPreviewVisible(true);
                    }}>
                      <Image 
                        source={{ uri: post.photos?.[idx] }} 
                        style={styles.threeImagesSub} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : post.photos.length === 4 ? (
              <View style={styles.fourImagesContainer}>
                <View style={styles.fourImagesTop}>
                  {[0,1].map(idx => (
                    <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => {
                      setPreviewImages(post.photos ?? []);
                      setPreviewIndex(idx);
                      setPreviewImage(post.photos?.[idx] ?? null);
                      setPreviewVisible(true);
                    }}>
                      <Image 
                        source={{ uri: post.photos?.[idx] }} 
                        style={styles.fourImages} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.fourImagesBottom}>
                  {[2,3].map(idx => (
                    <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => {
                      setPreviewImages(post.photos ?? []);
                      setPreviewIndex(idx);
                      setPreviewImage(post.photos?.[idx] ?? null);
                      setPreviewVisible(true);
                    }}>
                      <Image 
                        source={{ uri: post.photos?.[idx] }} 
                        style={styles.fourImages} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.manyImagesContainer}>
                <View style={styles.manyImagesTop}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                    setPreviewImages(post.photos ?? []);
                    setPreviewIndex(0);
                    setPreviewImage(post.photos?.[0] ?? null);
                    setPreviewVisible(true);
                  }}>
                    <Image 
                      source={{ uri: post.photos?.[0] }} 
                      style={styles.manyImagesMain} 
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <View style={styles.manyImagesRight}>
                    {[1,2].map(idx => (
                      <TouchableOpacity key={idx} style={{ flex: 1 }} onPress={() => {
                        setPreviewImages(post.photos ?? []);
                        setPreviewIndex(idx);
                        setPreviewImage(post.photos?.[idx] ?? null);
                        setPreviewVisible(true);
                      }}>
                        <Image 
                          source={{ uri: post.photos?.[idx] }} 
                          style={styles.manyImagesSub} 
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {post.photos.length > 3 && (
                  <View style={styles.manyImagesBottom}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                      setPreviewImages(post.photos ?? []);
                      const lastIdx = (post.photos?.length ?? 1) - 1;
                      setPreviewIndex(lastIdx);
                      setPreviewImage(post.photos?.[lastIdx] ?? null);
                      setPreviewVisible(true);
                    }}>
                      {(() => { const lastIdx = (post.photos?.length ?? 1) - 1; return (
                        <Image 
                          source={{ uri: post.photos?.[lastIdx] }} 
                          style={styles.manyImagesBottomImage} 
                          resizeMode="cover"
                        />
                      ); })()}
                      {post.photos.length > 4 && (
                        <View style={styles.moreImagesOverlay}>
                          <Text style={styles.moreImagesText}>+{post.photos.length - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Image Preview Modal */}
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPressOut={() => setPreviewVisible(false)}>
            {previewImages.length > 0 && previewIndex >= 0 && previewIndex < previewImages.length && (
              <Image source={{ uri: previewImages[previewIndex] }} style={{ width: '90%', height: 300, borderRadius: 12, resizeMode: 'contain' }} />
            )}
            {/* Prev Button */}
            {previewImages.length > 1 && previewIndex > 0 && (
              <TouchableOpacity onPress={() => {
                const newIndex = previewIndex - 1;
                setPreviewIndex(newIndex);
                setPreviewImage(previewImages[newIndex]);
              }} style={{ position: 'absolute', left: 20, top: '50%', marginTop: -30, backgroundColor: '#222', borderRadius: 20, padding: 8 }}>
                <Text style={{ color: 'white', fontSize: 32 }}>{'‹'}</Text>
              </TouchableOpacity>
            )}
            {/* Next Button */}
            {previewImages.length > 1 && previewIndex < previewImages.length - 1 && (
              <TouchableOpacity onPress={() => {
                const newIndex = previewIndex + 1;
                setPreviewIndex(newIndex);
                setPreviewImage(previewImages[newIndex]);
              }} style={{ position: 'absolute', right: 20, top: '50%', marginTop: -30, backgroundColor: '#222', borderRadius: 20, padding: 8 }}>
                <Text style={{ color: 'white', fontSize: 32 }}>{'›'}</Text>
              </TouchableOpacity>
            )}
            {/* Close Button */}
            <TouchableOpacity onPress={() => setPreviewVisible(false)} style={{ position: 'absolute', top: 40, right: 30, backgroundColor: '#222', borderRadius: 20, padding: 8 }}>
              <Text style={{ color: 'white', fontSize: 22 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Action Buttons */}
        {isActualPostOwner() ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.fullButton}
              onPress={() => navigation.navigate('EditPost', { post })}
            >
              <MaterialIcons name="edit" size={20} color="white" />
              <Text style={styles.fullButtonText}>Edit post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fullButton}
              onPress={() => {
                Alert.alert(
                  "Delete Post",
                  "Are you sure you want to delete this post?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          console.log('🗑️ Attempting to delete post:', post.id);
                          const { error } = await supabase
                            .from('posts')
                            .delete()
                            .eq('id', post.id);

                          if (error) {
                            console.error('❌ Error deleting post:', error);
                            Alert.alert('Error', 'Failed to delete post. Please try again.');
                            return;
                          }

                          console.log('✅ Post deleted successfully');
                          setSuccessMessage('Post deleted successfully');
                          setTimeout(() => {
                            setSuccessMessage('');
                            profileNavigation.navigate('MyPosts');
                          }, 1500);
                        } catch (error) {
                          console.error('❌ Unexpected error deleting post:', error);
                          Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="delete" size={20} color="white" />
              <Text style={styles.fullButtonText}>Delete post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
            {!isActualPostOwner() && (
              <>
                <TouchableOpacity style={styles.fullButton} onPress={handleSendMessage}>
                  <Image source={require('../../assets/images/messagebubble.png')} style={styles.buttonIcon} />
                  <Text style={styles.fullButtonText}>Send message</Text>
                </TouchableOpacity>

                {post?.category_id === 1 && (
                  <TouchableOpacity
                    style={styles.fullButton}
                    onPress={handleMakeOffer}
                  >
                    <Image source={require('../../assets/images/trashbag.png')} style={styles.buttonIcon} />
                    <Text style={styles.fullButtonText}>Send offer</Text>
                  </TouchableOpacity>
                )}

                {post?.category_id === 2 && (
                  <TouchableOpacity
                    style={[
                      styles.fullButton,
                      hasUserShownInterest() && styles.disabledButton
                    ]}
                    onPress={handleInterested}
                    disabled={hasUserShownInterest()}
                  >
                    <Image source={require('../../assets/images/trashbag.png')} style={styles.buttonIcon} />
                    <Text style={[
                      styles.fullButtonText,
                      hasUserShownInterest() && styles.disabledButtonText
                    ]}>
                      {hasUserShownInterest() ? 'Already Interested' : 'Interested'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.iconOnlyButton}>
                  <Text style={styles.dots}>⋮</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

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
              <Text style={styles.noOffers}>
                {post?.category_id === 2 ? 'No interested users yet.' : 'No offers yet.'}
              </Text>
            ) : (
              offers.map((offer, index) => {
                const isuserOfferer = isUserOfferer(offer);
                const isuserCollector = isUserCollector(offer);
                const isPostOwner = isActualPostOwner();
                const isAccepted = isOfferAccepted(offer);
                
                console.log("is user offerer? ", isuserOfferer);
                console.log("is user collector? ", isuserCollector);
                console.log(`📊 Offer ${offer.id} status check:`, {
                  offerId: offer.id,
                  status: offer.status,
                  isAccepted,
                  isUserOfferer: isuserOfferer,
                  isUserCollector,
                  userId: currentUser?.id,
                  postOwnerId: post?.user_id,
                  sellerName: offer.seller?.username
                });

                if (post?.category_id === 2) {
                  // Selling Post - INTERESTED USERS layout
                  return (
                    <View key={index} style={styles.offerCard}>
                      <View style={styles.headerRow}>
                        <View style={styles.leftInfo}>
                          <Image source={{ uri: offer.buyer?.profile_photo_url || 'https://i.pravatar.cc/36' }} style={styles.offerAvatar} />
                          <View>
                            <Text style={styles.offerUserText}>{offer.buyer?.username || 'Anonymous'}</Text>
                            <Text style={styles.offerTimeText}>{formatTimeAgo(offer.created_at)}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.offerDescription}>
                        {offer.message || 'No message provided'}
                      </Text>

                      {offer.status && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>
                            {offer.status.replace(/_/g, ' ').toUpperCase()}
                          </Text>
                        </View>
                      )}
                      
                       {/* Selling Post - INTERESTED USERS layout */}
                      <View style={styles.offerActionRow}>
                        {/* CASE: Accepted → show SEE DETAILS to both offerer and post owner */}
                        {(isuserCollector || isuserOfferer || isPostOwner) && offer.status === 'accepted' && (
                          <TouchableOpacity style={styles.fullGreenButton} onPress={() => handleSeeDetails(offer)}>
                            <Text style={styles.fullButtonTextinoffers}>See details</Text>
                          </TouchableOpacity>
                        )}

                        {/* CASE: Declined → show DISABLED "Declined" button */}
                        {offer.status === 'declined' && (
                          <View style={[styles.fullGreenButton, { backgroundColor: '#6c757d' }]}>
                            <Text style={[styles.fullButtonTextinoffers, { color: '#ccc' }]}>Declined</Text>
                          </View>
                        )}

                        {/* CASE: Pending → show appropriate buttons based on user role */}
                        {offer.status === 'pending' && (
                          <>
                            {/* Offerer sees DELETE while still pending */}
                            {isuserCollector && (
                              <View style={styles.offerActionRow}>
                                <TouchableOpacity style={styles.deleteOfferButton} onPress={() => handleDeleteOffer(offer.id)}>
                                  <Text style={styles.deleteOfferText}>Delete</Text>
                                </TouchableOpacity>
                                
                                {/* <TouchableOpacity style={styles.editOfferButton} onPress={() => handleEditOffer(offer)}>
                                  <MaterialIcons name="edit" size={22} color="white" />
                                </TouchableOpacity> */}
                              </View>
                            )}

                            {/* Post Owner sees ACCEPT/DECLINE + chat */}
                            {isPostOwner && (
                              <>
                                <TouchableOpacity style={styles.redButton} onPress={() => handleDeclineOffer(offer.id)}>
                                  <Text style={styles.buttonText}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.greenButton} onPress={() => handleAcceptOffer(offer)}>
                                  <Text style={styles.buttonText}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() =>
                                    handleChatWithUser(
                                      currentUser?.id === offer.buyer_id ? offer.seller_id : offer.buyer_id
                                    )
                                  }
                                >
                                  <Image source={require('../../assets/images/paperplane.png')} style={styles.sendIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.iconButton}>
                                  <Text style={styles.moreOptionsText}>⋮</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </>
                        )}

                        {/* CASE: Neither post owner nor offer owner - just show status */}
                        {/* {!isUserCollector && !isuserofferer && (
                          <View style={[styles.fullGreenButton, { backgroundColor: '#6c757d' }]}>
                            <Text style={[styles.fullButtonTextinoffers, { color: '#ccc' }]}>
                              {offer?.status?.toUpperCase()}
                            </Text>
                          </View>
                        )} */}
                      </View>
                    </View>
                  );
                }

                // Seeking Post - Full Offer layout
                return (
                  <View key={index} style={styles.offerCard}>
                    <View style={{ position: 'relative' }}>
                      <View style={styles.headerRow}>
                        <View style={styles.leftInfo}>
                          <Image source={{ uri: offer.seller?.profile_photo_url || 'https://i.pravatar.cc/36' }} style={styles.offerAvatar} />
                          <View>
                            <Text style={styles.offerUserText}>{offer.seller?.username || 'Anonymous'}</Text>
                            <Text style={styles.offerTimeText}>{formatTimeAgo(offer.created_at)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.offerDescription}>
                      {offer.message || 'No description provided'}
                    </Text>

                    <Text style={styles.offerPriceText}>
                      {offer.offered_weight} / {offer.requested_weight} KG
                    </Text>

                    <View style={styles.offerPriceRow}>
                      {/* <Image source={cashIcon} style={styles.offerPesoIcon} /> */}
                      <Text style={styles.offerPriceText}>₱ {offer.price.toFixed(2)}</Text>
                    </View>

                    <View style={styles.offerChips}>
                      {offer.offered_items.map((item, idx) => (
                        <View key={idx} style={styles.offerChip}>
                          <Text style={styles.offerChipText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Images below TYPE OF PLASTIC row */}
                    {offer.images && offer.images.length > 0 && (
                      <View style={{ width: '100%', marginTop: 8, marginBottom: 8 }}>
                        {offer.images.map((img, i) => (
                          <Image key={i} source={{ uri: img }} style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 10 }} />
                        ))}
                      </View>
                    )}
               
                    {/* // Seeking Post - Full Offer layout */}
                    <View style={styles.offerActionRow}>
                      {/* CASE: Accepted → show SEE DETAILS to both offerer and post owner */}
                      {(isuserCollector || isuserOfferer || isPostOwner) && offer.status === 'accepted' && (
                        <TouchableOpacity style={styles.fullGreenButton} onPress={() => handleSeeDetails(offer)}>
                          <Text style={styles.fullButtonTextinoffers}>See details</Text>
                        </TouchableOpacity>
                      )}

                      {/* CASE: Declined → show DISABLED "Declined" button */}
                      {offer.status === 'declined' && (
                        <View style={[styles.fullGreenButton, { backgroundColor: '#6c757d' }]}>
                          <Text style={[styles.fullButtonTextinoffers, { color: '#ccc' }]}>Declined</Text>
                        </View>
                      )}

                      {/* CASE: Pending → show appropriate buttons based on user role */}
                      {offer.status === 'pending' && (
                        <>
                          {/* Offerer sees DELETE while still pending */}
                          {isuserOfferer && (
                            <View style={styles.offerActionRow}>
                              <TouchableOpacity style={styles.deleteOfferButton} onPress={() => handleDeleteOffer(offer.id)}>
                                <Text style={styles.deleteOfferText}>Delete</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity style={styles.editOfferButton} onPress={() => handleEditOffer(offer)}>
                                <MaterialIcons name="edit" size={22} color="white" />
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* // Seeking Post - Full Offer layout */}
                          {/* Post Owner sees ACCEPT/DECLINE + chat */}
                          {isPostOwner && (
                            <>
                              <TouchableOpacity style={styles.redButton} onPress={() => handleDeclineOffer(offer.id)}>
                                <Text style={styles.buttonText}>Decline</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.greenButton} onPress={() => handleAcceptOffer(offer)}>
                                <Text style={styles.buttonText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() =>
                                  handleChatWithUser(
                                    currentUser?.id === offer.buyer_id ? offer.seller_id : offer.buyer_id
                                  )
                                }
                              >
                                <Image source={require('../../assets/images/paperplane.png')} style={styles.sendIcon} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.iconButton}>
                                <Text style={styles.moreOptionsText}>⋮</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </>
                      )}

                      {/* CASE: Neither post owner nor offer owner - just show status */}
                      {!isuserCollector && !isuserOfferer && (
                        <View style={[styles.fullGreenButton, { backgroundColor: '#6c757d' }]}>
                          <Text style={[styles.fullButtonTextinoffers, { color: '#ccc' }]}>
                            {offer?.status?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
        })
      )}
  </ScrollView>
        ) : null
      )}
      {renderWeightGoalDialog()}

      {/* Celebration Modal */}
      <Modal
        transparent
        visible={showCelebrationModal}
        animationType="fade"
        onRequestClose={() => setShowCelebrationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.celebrationModal}>
            <ConfettiCannon
              ref={confettiRef}
              count={200}
              origin={{x: -10, y: 0}}
              autoStart={false}
              fadeOut={true}
            />
            <Text style={{ fontSize: 60, color: '#00FF66', fontWeight: 'bold', marginBottom: 20 }}>{post?.kilograms} kg</Text>
            <Text style={styles.celebrationTitle}>WEIGHT GOAL ACHIEVED! 🎉</Text>
            <Text style={styles.celebrationText}>
              Congratulations! You've successfully recycled all the plastic waste in this post.
            </Text>
            <TouchableOpacity
              style={styles.celebrationButton}
              onPress={() => setShowCelebrationModal(false)}
            >
              <Text style={styles.celebrationButtonText}>AWESOME!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
  };

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
  },
  
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 90, // leaves space for thumbnail
  },
  
  offerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  
  offerImageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    position: 'absolute',
    right: -80,
    top: 0,
  },
  
  offerTimeText: {
    fontSize: 11,
    color: '#A0A0A0',

  },
  
  offerPesoIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 4,
  },
  
  offerUserTextContainer: {
    maxWidth: 160, // or adjust as needed based on your layout
  },  
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  offerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1, // Make it take the remaining space inside offerHeader
  },
  
  offerUserText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },
  
  
  offerThumbnail: {
    width: 80,  
    height: 80, 
    borderRadius: 8,
  },
  offerDescription: {
    color: 'white',
    marginVertical: 2,
  },
  offerWeight: {
    color: 'white',
    fontSize: 13,
  },
  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 2,
  },

  offerPriceText: {
    color: '#00FF57',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginVertical: 2,
  },
  offerChip: {
    backgroundColor: '#1E592B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offerChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  offerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteOfferButton: {
    flex: 1,
    backgroundColor: '#D84343',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  
  },
  deleteOfferText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  editOfferButton: {
    width:40,
    height: 40,
    backgroundColor: '#2C5735',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  fullGreenButton: {
    flex: 1,
    backgroundColor: '#2C5735',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  redButton: {
    flex: 1,
    backgroundColor: '#D84343',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    height:40,
  },
  greenButton: {
    flex: 1,
    backgroundColor: '#00C853',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    height:40,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2C5735',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',

  },
  

  sendButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height:40,
  },
  
  sendIcon: {
    width: 28,
    height: 28,
    // tintColor: '#00FF57', // optional if you want to recolor the icon
  },  
  
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
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
    fontWeight: 'bold',
  },
  
  fullButtonTextinoffers: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  
  statusBadge: {
    backgroundColor: '#0FC246',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#122C0F',
    marginTop: 10
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
    fontSize: 14, 
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
    marginBottom: 10, 
    
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
    marginBottom: 40,
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
    backgroundColor: '#234A2D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    alignItems: 'flex-start',
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
    marginHorizontal: 5,
    fontWeight: 'bold',
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
  
  detailsContainer: {
    backgroundColor: '#1E3D28',
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemTypesContainer: {
    marginVertical: 3,
  },
  itemTypesTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailRowFlexItem: {
    flex: 1,
    minWidth: 0,
  },
  successMessageContainer: {
    backgroundColor: '#00C853',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  successMessageText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#1E3D28',
    opacity: 0.7,
  },
  
  disabledButtonText: {
    color: '#A0A0A0',
  },
  imagesGridContainer: {
    marginVertical: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  twoImagesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  twoImages: {
    flex: 1,
    height: 200,
  },
  threeImagesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  threeImagesMain: {
    flex: 1,
    height: 200,
  },
  threeImagesRight: {
    flex: 1,
    gap: 2,
  },
  threeImagesSub: {
    flex: 1,
    height: 99,
  },
  fourImagesContainer: {
    gap: 2,
  },
  fourImagesTop: {
    flexDirection: 'row',
    gap: 2,
  },
  fourImagesBottom: {
    flexDirection: 'row',
    gap: 2,
  },
  fourImages: {
    flex: 1,
    height: 150,
  },
  manyImagesContainer: {
    gap: 2,
  },
  manyImagesTop: {
    flexDirection: 'row',
    gap: 2,
  },
  manyImagesMain: {
    flex: 1,
    height: 200,
  },
  manyImagesRight: {
    flex: 1,
    gap: 2,
  },
  manyImagesSub: {
    flex: 1,
    height: 99,
  },
  manyImagesBottom: {
    position: 'relative',
  },
  manyImagesBottomImage: {
    width: '100%',
    height: 150,
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E592B',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#00FF57',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  greenBtn: {
    backgroundColor: '#00FF57',
  },
  grayButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  weightContainer: {
    marginTop: 4,
  },
  weightBar: {
    height: 4,
    backgroundColor: '#1E592B',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  weightProgress: {
    height: '100%',
    backgroundColor: '#00D964',
    borderRadius: 2,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationModal: {
    backgroundColor: '#1A3620',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: '#00FF66',
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    tintColor: '#00FF66',
  },
  celebrationTitle: {
    color: '#00FF66',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  celebrationText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  celebrationButton: {
    backgroundColor: '#00FF66',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  celebrationButtonText: {
    color: '#023F0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ViewPost;