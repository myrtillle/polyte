import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { transactionService } from '@/services/transactionService';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList, MessagesStackParamList, RootStackParamList, HomeStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';
import { scheduleService } from '@/services/scheduleService';
import * as ImagePicker from 'expo-image-picker';
import { notificationService } from '@/services/notificationService';
import locationIcon from '../../assets/images/greenmark.png';
import pickupIcon from '../../assets/images/pickup.png';
import dropoffIcon from '../../assets/images/dropoff.png';
import meetupIcon from '../../assets/images/meetup.png';
import cashIcon from '../../assets/images/GCASHandMAYA2.png';
import gcashIcon from '../../assets/images/gcash.png';
import mayaIcon from '../../assets/images/maya.png';
import proofIcon from '../../assets/images/images3d.png';
import { Button, Divider, IconButton } from 'react-native-paper';
import Constants from 'expo-constants';
import { messagesService } from '@/services/messagesService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';


const getModeData = (modeName: string) => {
  const lower = modeName.toLowerCase();
  if (lower.includes('pickup')) {
    return { icon: pickupIcon, color: '#FFD700' }; // Yellow
  } else if (lower.includes('drop')) {
    return { icon: dropoffIcon, color: '#FF8515' }; // Orange
  } else {
    return { icon: meetupIcon, color: '#00FF57' }; // Green
  }
};

interface proofImage {
  photo: string;
}

export default function ViewTransaction() {
  const route = useRoute();
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();    
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { offerId } = route.params as { offerId: string };

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [setPaid] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [proofImage, setProofImage] = useState<proofImage>({
    photo: ''
  });
  const [tempProofImage, setTempProofImage] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (transaction?.scheduled_date) {
      const [year, month, day] = transaction.scheduled_date.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    if (transaction?.scheduled_time) {
      const [hours, minutes] = transaction.scheduled_time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date;
    }
    return new Date();
  });
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [confettiRef, setConfettiRef] = useState<any>(null);
  // console.log('🔍 Navigated with offerId:', offerId);
  console.log('📦 ViewTransaction received offerId:', offerId);
  
  const paid = transaction?.status === 'awaiting_payment' || transaction?.status === 'for_completion' || transaction?.status === 'completed';

  
  useEffect(() => {
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `id=eq.${offerId}`,
        },
        async (payload) => {
          console.log('🔁 Real-time transaction update received:', payload);
          const updated = await transactionService.fetchTransactionDetails(offerId);
          setTransaction(updated);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel); // clean up when leaving screen
    };
  }, [offerId]);
  
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
  
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // const isOfferer = transaction?.offerer_id;
  // const isCollector = !isOfferer;
  const hasProof = !!transaction?.proof_image_url;
  const hasAgreed = transaction?.status !== 'pending';
  const canComplete = hasProof && paid;

  const isConfirmed = ['awaiting_payment', 'for_completion', 'completed'].includes(transaction?.status);
  const canConfirm = transaction?.status === 'proof_uploaded';

  // Determine roles based on post category
  // const isBuyer = isSellingPost ? isCollector : isOfferer;
  // const isSeller = isSellingPost ? isOfferer : isCollector;

  //post category
  const isSellingPost = transaction?.category_id === 2;

  //offerer collector check
  const isOfferer = currentUser?.id === transaction?.offerer_id;
  const isCollector = currentUser?.id === transaction?.collector_id;

  // Determine roles based on post category
  const isBuyer = isCollector;  // Buyer is always the collector
  const isSeller = isOfferer;   // Seller is always the offerer

  const handlePostOwnerConfirm = async () => {
    const success = await transactionService.completeTransaction(offerId);

    if (success) {
      // Check if this transaction completed the weight goal
      const { data: post } = await supabase
        .from('posts')
        .select('remaining_weight')
        .eq('id', transaction.post_id)
        .single();

      if (post && post.remaining_weight === 0) {
        // setShowCelebrationModal(true);
        // Trigger confetti after a short delay
        setTimeout(() => {
          confettiRef?.start();
        }, 500);
      } else {
        Alert.alert('Confirmed', 'Transaction marked as completed.');
      }

      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);

      setConfirmVisible(false);
      profileNavigation.navigate('TransaCompleted', {
        weight: transaction.weight,
        points: transaction.weight * 100,
        offerId: offerId
      });       
    } else {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleMockPayment = async () => {

    const success = await transactionService.markAsForCompletion(offerId);

     if (success) {
        Alert.alert('Payment Success', 'Payment has been processed. You will receive a notifiction when seller marked the transaction as completed.');

        await notificationService.sendNotification(
          transaction.offerer_id,
          'Payment Sent',
          'The post owner has sent payment. Please confirm to complete the transaction.',
          'payment_send',
          {
            type: 'offer',
            id: offerId
          },
        );

        const updated = await transactionService.fetchTransactionDetails(offerId);
        setTransaction(updated);
        // setPaid(true);
        
        console.log('🧩 canComplete status:', canComplete);
        console.log('🖼️ Has proof?', hasProof);
        console.log('💸 Paid?', paid);
        console.log('🔐 User role:', isBuyer ? 'BUYER' : 'SELLER');
        console.log('📦 Current status:', transaction?.status);
      } else {
        Alert.alert('Error', 'Failed to update payment status.');
      }

      setUploading(false);
  };

  console.log('🔍 Role debug →', {
    currentUser: currentUser?.id,
    offerer: transaction?.offerer_id,
    collector: transaction?.collector_id,
    isSellingPost,
    isOfferer,
    isCollector,
    isBuyer,
    isSeller,
  });
  
  const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
  // console.log("🔑 Google Maps Key:", GOOGLE_MAPS_API_KEY);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('⚠️ No address found from Google Maps.');
        return null;
      }
    } catch (error) {
      console.error('❌ Error reverse geocoding:', error);
      return null;
    }
  };

  const extractCoords = (pointStr: string) => {
    const match = pointStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) return null;
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  };

  useEffect(() => {
    const fetchTransactDetails = async () => {
      setLoading(true);
      setTransaction(null); 
      try {
        const data = await transactionService.fetchTransactionDetails(offerId);
        console.log('📄 Data returned from transactionService:', data);
        setTransaction(data);

        if (data?.location) {
          const coords = extractCoords(data.location);
          console.log('🔍 Coords:', coords);
          if (coords) {
            const result = await reverseGeocode(coords.latitude, coords.longitude);
            console.log('🔍 Result:', result);
            setAddress(result || null);
          }
        }
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (offerId) {
      fetchTransactDetails(); 
    }
    
    setConfirmVisible(false);
  }, [offerId]);

  // Separate useEffect for handling date and time updates
  useEffect(() => {
    if (transaction?.scheduled_date) {
      const [year, month, day] = transaction.scheduled_date.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  
    if (transaction?.scheduled_time) {
      const [hours, minutes] = transaction.scheduled_time.split(':').map(Number);
      const now = new Date();
      now.setHours(hours, minutes);
      setSelectedTime(now);
    }
  }, [transaction?.scheduled_date, transaction?.scheduled_time]);
  
  useEffect(() => {
    console.log('🧩 canComplete status:', canComplete);
    console.log('🖼️ Has proof?', hasProof);
    console.log('💸 Paid?', paid);
    console.log('🔐 User role:', isBuyer ? 'BUYER' : 'SELLER');
    console.log('📦 Current status:', transaction?.status);
    console.log("time and date: ", transaction?.scheduled_date, transaction?.scheduled_time);
  }, [canComplete, hasProof, paid, transaction?.status]);
  
  // setProofImage({ photo: asset.uri });
  const handleUploadProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'I-allow sa ang permission sa camera roll palihog.');
        return;
      }
  
      setUploading(true);
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 1,
      });
  
      if (result.canceled) {
        setUploading(false);
        return;
      }
  
      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image selected.');
        return;
      }

      // Set temporary image for preview
      setTempProofImage(asset.uri);
      setUploading(false);
  
    } catch (error) {
      if (error instanceof Error) {
        console.error('Upload error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.error('Unexpected upload error:', error);
        Alert.alert('Error', 'Unexpected error occurred.');
      }
      setUploading(false);
    }
  };

  const handleConfirmProof = async () => {
    if (!tempProofImage) return;

    try {
      setUploading(true);
      // Upload image using the same working logic
      const uploadedUrl = await transactionService.uploadProofImage(tempProofImage, offerId);
      if (!uploadedUrl) throw new Error('Image upload failed');
  
      // Save URL to the `proof_image_url` column via update
      const success = await transactionService.confirmDelivery(offerId, uploadedUrl);
  
      if (success) {
        Alert.alert('Success', 'Proof photo uploaded and transaction updated.');
        const updated = await transactionService.fetchTransactionDetails(offerId);

        await notificationService.sendNotification(
          transaction.collector_id,
          'Proof of Collection Uploaded',
          'The offerer has uploaded a photo as proof of collection. Please review it before sending payment.',
          'proof_uploaded',
          { type: 'offer', id: offerId}
        );

        setTransaction(updated);
        setTempProofImage(null);
        setProofModalVisible(false);
      } else {
        Alert.alert('Error', 'Failed to update the transaction status.');
      }
  
    } catch (error) {
      if (error instanceof Error) {
        console.error('Upload error:', error.message);
        Alert.alert('Error', error.message);
      } else {
        console.error('Unexpected upload error:', error);
        Alert.alert('Error', 'Unexpected error occurred.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTempProof = () => {
    setTempProofImage(null);
  };

  const handleAgreeToSchedule = async () => {
    const success = await scheduleService.agreeToSchedule(offerId);

    if (success) {
      Alert.alert("Schedule Agreed", "You have agreed to the schedule.");
      
      await notificationService.sendNotification(
        transaction.collector_id,
        'Schedule finalized',
        'Offerer has agreed to the schedule. Please proceed to collection via chosen collection mode.',
        'schedule_agreed',
        { type: 'offer', id: offerId}
      )
      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
  
      setConfirmVisible(false);

    } else {
      Alert.alert("Error", "Failed to agree on schedule.");
    }
  };

  const steps = [
    'offer_made',
    'offer_accepted',
    'schedule_set',
    'for_collection',
    'proof_uploaded',
    'awaiting_payment',
    'for_completion',
    'completed',
  ];

  const currentStepIndex = steps.indexOf(transaction?.status || '');
  const formatStep = (step: string) => {
    return step.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#00D964" size="large" />
      </View>
    );
  }

  const goToChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
  
    const senderId = user.id;
    const receiverId = transaction?.collector_id === senderId
      ? transaction?.offerer_id
      : transaction?.collector_id;
  
    try {
      const chatId = await messagesService.getOrCreateChatId(senderId, receiverId);
  
      navigation.navigate('Main', {
        screen: 'Messages',
        params: {
          screen: 'ChatScreen',
          params: {
            chatId,
            userId: senderId,
            schedule: {
              category_id: transaction?.category_id,
              id: transaction?.schedule_id,
              scheduled_time: transaction?.scheduled_time,
              scheduled_date: transaction?.scheduled_date,
              status: transaction?.status,
              collectorName: transaction?.collector_name,
              offererName: transaction?.offerer_name,
              photoUrl: transaction?.photo_url,
              purok: transaction?.purok,
              barangay: transaction?.barangay,
              collector_id: transaction?.collector_id,   
              offerer_id: transaction?.offerer_id,
              offer_id: transaction?.offer_id,
            },
          },
        },
      });
    } catch (error) {
      console.error("❌ Failed to get or create chat:", error);
      Alert.alert("Error", "Failed to start chat.");
    }
  };
  
  const handleEditSchedule = async () => {
    if (!transaction?.offer_id) {
      Alert.alert("Error", "Missing schedule offer ID.");
      return;
    }
  
    try {
      // Use selectedDate and selectedTime from state
      const localDateTime = new Date(selectedDate);
      localDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
  
      console.log("📆 Selected datetime:", localDateTime.toString());
  
      const now = new Date();
      if (localDateTime < now) {
        Alert.alert("Invalid Date/Time", "Please select a future date and time.");
        return;
      }
  
      // Format for Supabase
      const formattedDate = localDateTime.toISOString().split("T")[0]; // yyyy-mm-dd
      const formattedTime = localDateTime.toTimeString().split(" ")[0]; // hh:mm:ss
  
      const { error } = await supabase
        .from("offer_schedules")
        .update({
          scheduled_date: formattedDate,
          scheduled_time: formattedTime
        })
        .eq("offer_id", transaction.offer_id); // ← corrected from 'schedule.offer_id'
  
      if (error) throw error;
  
      console.log("✅ Schedule updated in DB");
  
      const otherUserId = currentUser?.id === transaction.collector_id
        ? transaction.offerer_id
        : transaction.collector_id;
  
      await notificationService.sendNotification(
        otherUserId as string,
        "Schedule Updated",
        "The schedule has been updated. Please check the new details.",
        "schedule_updated",
        {
          type: "transaction",
          id: transaction.offer_id
        }
      );
  
      Alert.alert("Success", "Schedule updated successfully!");
      setShowEditModal(false);
      setShowDatePicker(false);
      setShowTimePicker(false);
      
      // Optionally refresh local state
      const updated = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(updated);
  
    } catch (error) {
      console.error("❌ Error updating schedule:", error);
      Alert.alert("Error", "Failed to update schedule. Please try again.");
    }
  };
  
  
  return (
    <LinearGradient colors={['#023F0F', '#05A527']} style={{ flex: 1 }}>
      <ScrollView
       contentContainerStyle={{ padding: 16 }}
         refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00D964"
          />
        }
      >

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>STATUS</Text>
          <Text style={[styles.status, { color: '#00D964', fontSize: 18, marginTop: 4 }]}>
            {transaction?.status?.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SCHEDULED AT</Text>
          <View style={styles.scheduleRow}>
            <Text style={[styles.bigText, { marginTop: 4, letterSpacing: 0.5 }]}>
              {transaction?.scheduled_time ?? 'N/A'} - {transaction?.scheduled_date}
            </Text>
            {((isSellingPost && isSeller) || (!isSellingPost && isBuyer)) && (
              <TouchableOpacity 
                style={[
                  styles.editButton,
                  transaction?.status !== 'pending' && styles.editButtonDisabled
                ]}
                disabled={transaction?.status !== 'pending'}
                onPress={() => {
                  setShowEditModal(true);
                  setShowDatePicker(false);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[
                  styles.editButtonText,
                  transaction?.status !== 'pending' && styles.editButtonTextDisabled
                ]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* if SELLING, buyer cannot see. if SEEKING, seller cannot see */}
          {((isSellingPost && isSeller) || (!isSellingPost && isBuyer)) && !hasAgreed && (
            <Text style={{ color: '#FFD700', marginTop: 12, fontSize: 13, fontWeight: '500' }}>
              {transaction?.category_id === 1
                ? 'Waiting for seller to agree to the schedule.'
                : 'Waiting for buyer to agree to the schedule.'}
            </Text>
          )}

          {/* if SELLING, buyer should see. if SEEKING, seller should see */}
          {((isSellingPost && isBuyer) || (!isSellingPost && isSeller)) && !hasAgreed && (
            <Text style={{ color: '#ccc', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              Not convenient? Discuss the schedule with the seeker.
            </Text>
          )}

          {/* if SELLING, buyer shoul see. if SEEKING, seller should see */}
          
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            {((isSellingPost && isBuyer) || (!isSellingPost && isSeller)) && (
              <TouchableOpacity
                style={{
                  backgroundColor: hasAgreed ? '#888' : '#00D964',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                }}
                onPress={hasAgreed ? undefined : handleAgreeToSchedule}
                disabled={hasAgreed}
              >
                <Text style={{
                  color: '#023F0F',
                  fontWeight: 'bold',
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}>
                  {hasAgreed ? 'AGREED' : 'AGREE'}
                </Text>
              </TouchableOpacity>
            )}
              <TouchableOpacity
                style={{
                  backgroundColor: '#1E592B',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
                onPress={goToChat}
              >
                <Text style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}>
                  {isBuyer ? 'CHAT SELLER' : 'CHAT SEEKER'}
                </Text>
              </TouchableOpacity>
            </View>
          

          <Text style={[styles.subLabel, { marginTop: 16 }]}>ITEMS</Text>
          <View style={[styles.itemList, { marginTop: 6 }]}>
            {transaction?.items?.length > 0 ? (
              transaction.items.map((item: any, index: number) => (
                <View key={index} style={[styles.itemChip, { marginBottom: 6 }]}>
                  <Text style={[styles.itemChipText, { letterSpacing: 0.3 }]}>
                    {typeof item === 'object' && item !== null && 'name' in item ? item.name : item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.subValue, { fontStyle: 'italic' }]}>N/A</Text>
            )}
          </View>

          <Text style={[styles.subLabel, { marginTop: 12 }]}>LOCATION</Text>
          <View style={[styles.addressRow, { marginTop: 6 }]}>
            <Image source={locationIcon} style={styles.locationIcon} resizeMode="contain" />
            <Text style={[styles.subValue, { maxWidth: 280, lineHeight: 20 }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {address ?? 'Loading location...'}
            </Text>
          </View>

          <Text style={[styles.subLabel, { marginTop: 12 }]}>COLLECTION METHOD</Text>
          <View style={[styles.modeRow, { marginTop: 6 }]}>
            {(() => {
              const mode = getModeData(transaction?.method || '');
              return (
                <>
                  <Image source={mode.icon} style={[styles.modeIcon, { tintColor: mode.color }]} />
                  <Text style={[styles.modeText, { color: mode.color, letterSpacing: 0.5 }]}> 
                    {transaction?.method?.toUpperCase()}
                  </Text>
                </>
              );
            })()}
          </View>
        </View>

        <View style={[styles.cardRow, { marginTop: 16 }]}>
          <View>
            <Text style={[styles.subLabel, { marginBottom: 4 }]}>TO BE COLLECTED BY</Text>
            <Text style={[styles.collectorName, { fontSize: 16, marginBottom: 12 }]}>
              {transaction?.collector_name}
            </Text>
            <Text style={[styles.subLabel, { marginBottom: 4 }]}>FROM</Text>
            <Text style={[styles.offererName, { fontSize: 16 }]}>
              {transaction?.offerer_name}
            </Text>
          </View>
          {transaction?.photo_url && (
            <Image source={{ uri: transaction?.photo_url }} style={styles.photo} />
          )}
        </View>

        {/* Proof of Collection */}
        <View style={[styles.card, !hasAgreed && { opacity: 0.5 }]}>
          <Text style={styles.collectionStatusHeader}>COLLECTION STATUS</Text>
          <TouchableOpacity
            onPress={() => setProofModalVisible(true)}
            style={styles.proofCard}
          >
            <View style={styles.proofTextContainer}>
              <Text style={styles.proofCardTitle}>PROOF OF COLLECTION</Text>
              <Text style={styles.proofCardSubtitle}>Tap Here to upload and view collection proof.</Text>
            </View>
            <Image source={proofIcon} style={styles.proofCardImage} />
          </TouchableOpacity>

          {/* tracker - reversed */}
          <View style={{ marginTop: 16, paddingLeft: 10, borderLeftWidth: 2, borderColor: '#00D964' }}>
            {[...steps].reverse().map((step, index) => {
              const originalIndex = steps.indexOf(step);
              return (
                <View key={step} style={{ marginBottom: 14, position: 'relative' }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: originalIndex <= currentStepIndex ? '#00D964' : '#aaa',
                      borderRadius: 5,
                      position: 'absolute',
                      left: -16,
                      top: 4
                    }}
                  />
                  <Text
                    style={{
                      color: originalIndex <= currentStepIndex ? '#00D964' : '#ccc',
                      fontWeight: originalIndex === currentStepIndex ? 'bold' : 'normal'
                    }}
                  >
                    {formatStep(step)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

          {/* Payment Section */}
          <View style={[styles.card, !hasAgreed && { opacity: 0.5 }]}>
            <Text style={styles.collectionStatusHeader}>PAYMENT</Text>
            
            <View style={styles.offerPriceRow}>
              <Text style={styles.offerPriceText}>₱ {transaction?.price?.toFixed(2) ?? 'N/A'}</Text>

            </View>

            {isBuyer && ( 
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { 
                        flex: 1, 
                        backgroundColor: transaction?.status === 'awaiting_payment' ? '#00B2FF' : '#888', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexDirection: 'row', 
                        gap: 8, 
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16
                      }
                    ]}
                    disabled={transaction?.status !== 'awaiting_payment'}
                    onPress={handleMockPayment}
                  >
                    <Image source={gcashIcon} style={{ width: 45, height: 45 }} resizeMode="contain" />
                    <Text style={[
                      styles.confirmText,
                      transaction?.status === 'awaiting_payment' ? { color: '#023F0F' } : { color: '#666' }
                    ]}>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      { 
                        flex: 1, 
                        backgroundColor: transaction?.status === 'awaiting_payment' ? '#00D964' : '#888', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexDirection: 'row', 
                        gap: 8, 
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16
                      }
                    ]}
                    disabled={transaction?.status !== 'awaiting_payment'}
                    onPress={handleMockPayment}
                  >
                    <Image source={mayaIcon} style={{ width: 60, height: 45 }} resizeMode="contain" />
                    <Text style={[
                      styles.confirmText,
                      transaction?.status === 'awaiting_payment' ? { color: '#fff' } : { color: '#666' }
                    ]}>
                    </Text>
                  </TouchableOpacity>
              </View>
            )}
            {/* Add CASH ON DELIVERY button below the two payment buttons */}
            {isBuyer && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      flex: 1,
                      backgroundColor: transaction?.status === 'awaiting_payment' ? '#FFD700' : '#888',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    },
                  ]}
                  disabled={transaction?.status !== 'awaiting_payment'}
                  onPress={handleMockPayment}
                >
                  <Text style={[
                    styles.confirmText,
                    transaction?.status === 'awaiting_payment' ? { color: '#023F0F', fontWeight: 'bold', fontSize: 16 } : { color: '#666' }
                  ]}>
                    CASH ON DELIVERY
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(() => {
              let message = '';

              if (isBuyer && transaction?.status === 'proof_uploaded') {
                message = 'Please confirm the collection proof uploaded before proceeding to payment.';
              } else if (isSeller && transaction?.status === 'for_collection') {
                message = 'Please upload a proof of collection first before seeker sends payment.';
              } else if (isSeller && transaction?.status === 'proof_uploaded') {
                message = 'Waiting for seeker to send payment via e-wallet.';
              }

              return message ? (
                <Text style={{ color: '#ccc', fontStyle: 'italic' }}>{message}</Text>
              ) : null;
            })()}
          </View>

        {/* Complete Transaction Button - Only for sellers */}
        {isSeller && (
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { paddingHorizontal: 60 },
                transaction?.status === 'for_completion' ? { backgroundColor: '#00D964' } : { backgroundColor: '#888' }
              ]}
              disabled={transaction?.status === 'completed' || transaction?.status !== 'for_completion'}
              onPress={() => {
                if (transaction?.status === 'for_completion') {
                  setConfirmVisible(true);
                }
              }}
            >
              <Text style={[styles.confirmText, { color: 'white' }, transaction?.status !== 'for_completion' && { color: '#666' }]}>
                {transaction?.status === 'completed' ? 'TRANSACTION COMPLETED' : 'COMPLETE TRANSACTION'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rate Button for Both Users when Completed */}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 10 }}>
            <TouchableOpacity
              style={[
                styles.confirmButton, 
                { paddingHorizontal: 60 }, 
                transaction?.status === 'completed' ? { backgroundColor: '#FFD700' } : { backgroundColor: '#888' }
              ]}
              onPress={() => profileNavigation.navigate('Ratings', { offerId })}
              disabled={transaction?.status !== 'completed'}
            >
              <Text style={[
                styles.confirmText, 
                transaction?.status === 'completed' ? { color: '#023F0F' } : { color: '#666' }
              ]}>
                Rate {isSeller ? 'Seeker' : 'Seller'}
              </Text>
            </TouchableOpacity>
          </View>

      </ScrollView>
        
      {proofModalVisible && (
        <Modal
          transparent
          visible={proofModalVisible}
          animationType="slide"
          onRequestClose={() => setProofModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.proofModalContainer}>
              <Text style={styles.proofModalHeader}>PROOF OF COLLECTION</Text>
        
              {hasProof ? (
                <>
                  <Image source={{ uri: transaction.proof_image_url }} style={styles.proofImage} />

                  {isBuyer && (
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        {
                          marginTop: 20,
                          backgroundColor: transaction?.status === 'proof_uploaded' ? '#00D964' : '#888',
                          width: '100%',
                        },
                      ]}
                      disabled={transaction?.status !== 'proof_uploaded'}
                      onPress={async () => {
                        const success = await transactionService.markAsAwaitingPayment(offerId);
                        if (success) {
                          const updated = await transactionService.fetchTransactionDetails(offerId);
                          setTransaction(updated);
                          Alert.alert('Confirmed', 'Collection confirmed. Waiting for payment.');
                          setProofModalVisible(false);
                        } else {
                          Alert.alert('Error', 'Failed to confirm collection.');
                        }
                      }}
                    >
                      <Text style={[
                        styles.confirmText,
                        transaction?.status === 'proof_uploaded' ? { color: '#023F0F' } : { color: '#666' }
                      ]}>
                        {transaction?.status === 'proof_uploaded' ? 'CONFIRM COLLECTION' : 'COLLECTION CONFIRMED'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={{ width: '100%' }}>
                  {tempProofImage ? (
                    <>
                      <Image source={{ uri: tempProofImage }} style={styles.proofImage} />
                      <View style={styles.proofActions}>
                        <TouchableOpacity 
                          style={[styles.proofActionButton, { backgroundColor: '#D84343' }]} 
                          onPress={handleDeleteTempProof}
                        >
                          <Text style={styles.proofActionButtonText}>DELETE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.proofActionButton, { backgroundColor: '#00D964' }]} 
                          onPress={handleConfirmProof}
                          disabled={uploading}
                        >
                          <Text style={styles.proofActionButtonText}>
                            {uploading ? 'UPLOADING...' : 'CONFIRM & UPLOAD'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.proofModalText}>No proof of collection uploaded yet.</Text>
                      {(() => {
                        const shouldShowUploadButton = isSeller && transaction?.status === 'for_collection';
                        return shouldShowUploadButton ? (
                          <TouchableOpacity 
                            style={[styles.confirmButton, { marginTop: 10, width: '100%' }]} 
                            onPress={handleUploadProof}
                            disabled={uploading}
                          >
                            <Text style={[styles.confirmText, { color: '#023F0F' }]}>
                              {uploading ? 'SELECTING...' : 'SELECT PHOTO'}
                            </Text>
                          </TouchableOpacity>
                        ) : null;
                      })()}
                    </>
                  )}
                </View>
              )}
        
              <TouchableOpacity
                onPress={() => {
                  setProofModalVisible(false);
                  setTempProofImage(null);
                }}
                style={[styles.modalButton, { marginTop: 20, backgroundColor: '#1E592B', width: '100%' }]}
              >
                <Text style={{ fontWeight: 'bold', color: 'white' }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

        {/* Confirmation Popup */}
        {confirmVisible && (
          <View style={styles.modalBackdrop} >
            <View style={styles.modalBox}>
              <Text style={styles.modalText}>Are you sure you want to complete this transaction?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setConfirmVisible(false)}
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePostOwnerConfirm}
                  style={[styles.modalButton, { backgroundColor: '#00D964' }]}
                >
                  <Text style={{ fontWeight: 'bold', color: '#003d1a' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}  

        {/* Edit Schedule Modal */}
        <Modal
          transparent={true}
          visible={showEditModal}
          animationType="slide"
          onRequestClose={() => {
            setShowDatePicker(false);
            setShowTimePicker(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Schedule</Text>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                disabled={transaction?.status !== 'pending'}
                onPress={() => {
                  setShowDatePicker(true);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.dateTimeButtonText}>
                  Date: {selectedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    setShowDatePicker(false);
                    if (date) {
                      setSelectedDate(date);
                      if (date.toDateString() === new Date().toDateString()) {
                        const now = new Date();
                        if (selectedTime < now) {
                          setSelectedTime(now);
                        }
                      }
                      // Show time picker after date is selected
                      
                    }
                  }}
                />
              )}

              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => {
                  setShowTimePicker(true);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateTimeButtonText}>
                  Time: {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  display="default"
                  minimumDate={selectedDate.toDateString() === new Date().toDateString() ? new Date() : undefined}
                  onChange={(event: DateTimePickerEvent, time?: Date) => {
                    setShowTimePicker(false);
                    if (time) {
                      setSelectedTime(time);
                    }
                  }}
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#666' }]} 
                  onPress={() => {
                    setShowEditModal(false);
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#00D964' }]} 
                  onPress={handleEditSchedule}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                ref={(ref) => setConfettiRef(ref)}
                count={200}
                origin={{x: -10, y: 0}}
                autoStart={false}
                fadeOut={true}
              />
              <Image 
                source={require('../../assets/images/trashbag.png')} 
                style={styles.celebrationIcon}
              />
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

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
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

  proofCard: {
    backgroundColor: '#1E592B',
    borderColor: '#00FF57',
    borderWidth: 1,
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal:12,
    paddingVertical:6,

  },
  
  proofTextContainer: {
    flex: 1,
  },
  
  proofCardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
 
  
  },
  
  proofCardSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  
  proofCardImage: {
    width:60,
    height:50,
    marginLeft: 8,
  },
  
  proofModalContainer: {
    width: '91%',
    backgroundColor: '#1A3620',
    padding: 22,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 8,
  },
  
  proofModalHeader: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'regular',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  proofModalText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 10,
  },
  
  proofUploadText: {
    fontSize: 14,
    color: '#00D964',
    fontWeight: 'bold',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  
  proofImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  

  offerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  
  offerPesoIcon: {
    width: 100,
    height: 20,
    resizeMode: 'contain',
  },
  
  offerPriceText: {
    color: '#00FF57',
    fontWeight: 'bold',
    fontSize: 18,
  },
  
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
  

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  
  locationIcon: {
    width: 18, // ← change icon size independently here
    height: 18,
    marginRight: 4,
  },
  
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 10,
    gap: 6,
  },
  
  itemChip: {
    backgroundColor: '#1E592B',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  itemChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  container: { flex: 1, padding: 16 },
  header: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 5
  },
  cardRow: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  sectionTitle: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600'
  },
  status: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15
  },
  bigText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500'
  },
  subValue: {
    color: 'white',
    fontSize: 13
  },
  collectorName: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10
  },
  offererName: {
    color: '#bbb',
    fontWeight: '500'
  },
  icon: {
    fontSize: 16
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10
  },
  confirmButton: {
    backgroundColor: '#00D964',
    paddingVertical: 14,
    paddingHorizontal:60,
    borderRadius: 100,
    alignItems: 'center'
  },
  confirmText: {
    color: 'darkgray',
    fontWeight: 'bold'
  },
  proofText: {
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#023F0F'
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  collectionStatusContainer: {
    backgroundColor: '#0C1F10',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  collectionStatusHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  collectionStatusText: {
    color: '#BBB',
    fontSize: 14,
    marginBottom: 10,
  },
  collectionProofImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#00D964',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  editButtonDisabled: {
    backgroundColor: '#666',
  },
  editButtonText: {
    color: '#023F0F',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editButtonTextDisabled: {
    color: '#999',
  },
  modalContent: {
    backgroundColor: '#004d00',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 18,
  },
  dateTimeButton: {
    backgroundColor: '#1E592B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00D964',
  },
  dateTimeButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
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
  proofActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  proofActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  proofActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
