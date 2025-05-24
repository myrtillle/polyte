// ChatScreen.tsx - Displays a conversation with the selected post as an attachment

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Image, Modal, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { messagesService } from '@/services/messagesService';
import { scheduleService } from '@/services/scheduleService';
import { supabase } from '@/services/supabase'; 
import { MaterialIcons } from '@expo/vector-icons';
import { Chip, Divider, IconButton } from 'react-native-paper';
import { offersService, Schedule } from '@/services/offersService';
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList  } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { Message } from '@/services/messagesService';
import { formatTimeAgo } from '@/utils/dateUtils'; 
import { Post } from '@/types/Post';
import Constants from 'expo-constants';
import paperplaneIcon from '../../assets/images/paperplane.png';
import { notificationService } from '@/services/notificationService';
import { transactionService } from '@/services/transactionService';

// interface Schedule {
//     status: string;
//     scheduled_time: string;
//     scheduled_date: string;
//     collectorName: string;
//     offererName: string;
//     photoUrl: string;
//     purok: string;
//     barangay: string;
// }

interface RouteParams {
    chatId?: string;
    userId?: string;
    post?: Post;
    schedule?: Schedule;
}

const ChatScreen = () => {
    const route = useRoute();
    const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
    const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();

    const { offerId } = route.params as { offerId: string };
    const { chatId, userId, post, schedule } = (route.params || {}) as RouteParams;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newTime, setNewTime] = useState<string>(schedule?.scheduled_time || '');
    const [newDate, setNewDate] = useState<string>(schedule?.scheduled_date || '');
    const [receiverName, setReceiverName] = useState<string>('');
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);

    useEffect(() => {
        if (chatId && userId) {
          const loadMessages = async () => {
            const data = await messagesService.fetchMessages(chatId);
            setMessages(data);
      
            // Mark messages as read
            const { error } = await supabase
              .from('messages')
              .update({ seen: true })
              .eq('chat_id', chatId)
              .eq('receiver_id', userId);
      
            if (error) {
              console.error("❌ Failed to mark messages as read:", error.message);
            }
          };
      
          loadMessages();

          const fetchReceiver = async () => {
            const { data: chat } = await supabase
              .from('chats')
              .select('user1_id, user2_id')
              .eq('id', chatId)
              .single();
          
            const otherUserId = chat?.user1_id === userId ? chat.user2_id : chat?.user1_id;
            
            console.log('🔍 Other user ID:', otherUserId);
            const { data: profile } = await supabase
              .from('personal_users')
              .select('first_name, last_name')
              .eq('id', otherUserId)
              .single();
          
            if (profile) {
              setReceiverName(`${profile.first_name} ${profile.last_name}`);
            }
          };
          
          fetchReceiver();          
        }
    }, [chatId, userId]);
    
    useEffect(() => {
      const fetchTransactDetails = async () => {
        setLoading(true);
        setTransaction(null); 
        const data = await transactionService.fetchTransactionDetails(offerId);
        console.log('📄 Data returned from transactionService:', data);
  
        setTransaction(data);
        setLoading(false);
      };
      
      if (offerId) {
        fetchTransactDetails(); 
      }
  
    }, [offerId]);

    const handleSend = async () => {
    console.log("Send button clicked");
    console.log("chatId:", chatId, "userId:", userId, "newMessage:", newMessage);
    
    if (!newMessage.trim() || !chatId || !userId) {
        console.warn("Missing required data for sending message.");
        return;
    }
    
    try {
        console.log("Resolving receiver ID...");
        let receiverId: string | null = null;
    
        // ✅ Case 1: If schedule is available (from a transaction)
        if (schedule) {
        try {
            const postOwnerId = schedule.user_id;
            if (userId === postOwnerId) {
            console.log("User is the post owner — fetching offererId...");
            receiverId = await offersService.getOffererId(chatId);
            console.log("Fetched offererId:", receiverId);
            } else {
            receiverId = postOwnerId;
            console.log("User is the offerer — using postOwnerId:", receiverId);
            }
        } catch (err) {
            console.error("❌ Error resolving receiver from schedule:", err);
            return;
        }
        } else {
        // ✅ Case 2: Try to resolve from messages history
        const { data: messages, error } = await supabase
            .from('messages')
            .select('sender_id, receiver_id')
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: false })
            .limit(1);
    
        if (error) {
            console.error("❌ Failed to fetch latest message:", error);
            return;
        }
    
        const latestMsg = messages?.[0];
    
        if (!latestMsg) {
            // ✅ Case 3: No messages yet — resolve from chat record
            console.warn("⚠️ No past messages found — resolving receiver from chats table...");
            const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', chatId)
            .single();
    
            if (chatError) {
            console.error("❌ Could not resolve from chats table:", chatError);
            return;
            }
    
            receiverId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        } else {
            receiverId = latestMsg.sender_id === userId
            ? latestMsg.receiver_id
            : latestMsg.sender_id;
        }
        }
    
        // Final safety check
        if (!receiverId) {
        console.error("❌ Could not resolve receiverId. Aborting send.");
        return;
        }
    
        console.log("✅ Resolved receiverId:", receiverId);
    
        // Send the message
        const result = await messagesService.sendMessage(
        chatId,
        userId,
        receiverId,
        newMessage,
        post ? 'post' : schedule ? 'schedule' : undefined,
        post?.id || schedule?.offer_id
        );          
    
        if (result?.id) {
        setNewMessage('');
        console.log("✅ Message sent and added to chat.");
        } else {
        console.error("❌ Message not sent: No ID returned.");
        }
    
    } catch (error) {
        console.error("❌ Error sending message:", error);
    }
    };

    const isPostOwner = userId === schedule?.user_id;
    const isOfferer = userId !== schedule?.user_id;

    const handleEditSchedule = async () => {
        if (!chatId || !schedule) {
            Alert.alert("Error", "Missing schedule information");
            return;
        }

        try {
            const { error } = await supabase
                .from('offer_schedules')
                .update({
                    scheduled_time: newTime,
                    scheduled_date: newDate
                })
                .eq('offer_id', chatId);

            if (error) throw error;

            // Update local state
            schedule.scheduled_time = newTime;
            schedule.scheduled_date = newDate;

            // Send notification to the other user
            const otherUserId = schedule.user_id === userId ? transaction.offerer_id : schedule.user_id;
            await notificationService.sendNotification(
                otherUserId,
                'Schedule Updated',
                'The schedule has been updated. Please check the new details.',
                'schedule_updated',
                {
                    type: 'transaction',
                    id: schedule.offer_id
                }
            );

            Alert.alert("Success", "Schedule updated successfully!");
            setModalVisible(false);
        } catch (error) {
            console.error("Error updating schedule:", error);
            Alert.alert("Error", "Failed to update schedule. Please try again.");
        }
    };

    const handleAgree = async () => {
        try {
            const { error } = await supabase
                .from('offer_schedules')
                .update({ status: 'for_collection' })
                .eq('offer_id', chatId);

            if (error) throw error;

            // Send notification to the post owner
            await notificationService.sendNotification(
                transaction.collector_id,
                'Schedule Agreed! 🎉',
                'Great news! The schedule has been agreed upon. Time to make our planet greener! 🌱',
                'schedule_agreed',
                {
                    type: 'transaction',
                    id: transaction?.offer_id
                }
            );

            Alert.alert(
                "Schedule Agreed! 🎉",
                "Awesome! You've agreed to the schedule. Let's make our planet greener together! 🌱\n\nRedirecting to transaction details...",
                [{ text: "OK" }]
            );

            // Wait for 2 seconds before navigating
            setTimeout(() => {
                profileNavigation.navigate('ViewTransaction', { offerId: transaction?.offer_id });
            }, 2000);

        } catch (error) {
            console.error("Error agreeing to schedule:", error);
            Alert.alert("Error", "Failed to agree on the schedule. Please try again.");
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

        
    useEffect(() => {
      const fetchAddress = async () => {
        if (coords) {
          const found = await reverseGeocode(coords.latitude, coords.longitude);
          setAddress(found);
        }
      };
    
      fetchAddress();
    }, [coords]);

    useEffect(() => {
        if (!chatId) return;
      
        const subscription = supabase
          .channel('messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatId}`,
            },
            (payload) => {
                const newMsg = payload.new as Message;
                setMessages((prev) => {
                  const exists = prev.some((msg) => msg.id === newMsg.id);
                  return exists ? prev : [newMsg, ...prev];
                });
              }
          )
          .subscribe();
      
        return () => {
          supabase.removeChannel(subscription);
        };
      }, [chatId]);
      
    return (
        <View style={{ flex: 1, backgroundColor: '#163B1F' }}>
           <View style={styles.headerContainer}>
          <Image
            source={{ uri: `https://i.pravatar.cc/40?u=${chatId}` }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>{receiverName || 'Chat'}</Text>
        </View>



        <View style={styles.messagescon}>

            {post && (
                <View style={{ backgroundColor: '#1E592B', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                  {post.photos?.[0] && (
                    <Image source={{ uri: post.photos[0] }} style={{ height: 100, borderRadius: 6, marginBottom: 8 }} />
                  )}

                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{post.description}</Text>
                  
                  {post.collection_mode?.name && (
                    <Text style={{ color: '#00FF66', fontWeight: 'bold', marginTop: 4 }}>
                      Mode: {post.collection_mode.name}
                    </Text>
                  )}

                  <Text style={{ color: '#fff' }}>
                  Weight: {post.kilograms} kg
                  </Text>

                  {post.price !== undefined && post.category_id === 2 && (
                    <Text style={{ color: '#fff' }}>
                      Price: ₱ {post.price}
                    </Text>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                  {(post.post_item_types ?? []).map((type, index) => (
                      <Chip
                      key={index}
                      style={{ backgroundColor: '#235F30', marginRight: 6, marginTop: 4 }}
                      textStyle={{ color: 'white', fontSize: 10 }}
                      >
                      {type.name}
                      </Chip>
                  ))}
                  </View>

                  {coords && (
                    <Text style={{ color: '#ccc' }}>
                      Location: {address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`}
                    </Text>
                  )}
                  <Text style={{ color: '#ccc', fontSize: 10 }}>
                  Posted: {formatTimeAgo(post.created_at)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => homeNavigation.navigate('ViewPost', { postId: post.id })}
                    style={{
                      marginTop: 10,
                      padding: 6,
                      borderRadius: 4,
                      backgroundColor: '#2C5735',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>🔙 BACK TO POST</Text>
                  </TouchableOpacity>
                </View>
            )}
            {schedule && 
              isPostOwner && (
                <View style={{ marginBottom: 10, backgroundColor: '#1E592B', padding: 10, borderRadius: 8 }}>
                    {schedule.photoUrl && (
                        <Image source={{ uri: schedule.photoUrl }} style={{ height: 100, width: 100, marginBottom: 5, borderRadius: 5 }} />
                    )}
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Scheduled by: {schedule.offererName}</Text>
                    <Text style={{ color: 'white' }}>Collector: {schedule.collectorName}</Text>
                    <Text style={{ color: 'white' }}>Time: {schedule.scheduled_time} - Date: {schedule.scheduled_date}</Text>
                    {/* <Text style={{ color: 'white' }}>Location: {address}</Text> */}
                    {/* Edit button (visible only to Post Owner) */}
                    {isPostOwner && schedule.status !== 'for_collection' && (
                    <Button title="Edit" onPress={() => setModalVisible(true)} />
                    )}
                    {/* Agree button (visible only to Offerer) */}
                    {isOfferer && schedule.status !== 'for_collection' && (
                    <Button title="Agree" onPress={handleAgree} />
                    )}
                    {isOfferer && schedule.status === 'for_collection' && (
                    <Button title="Agreed ✅" disabled color="#888" />
                    )}

                    <Button
                    title="Back to Transaction"
                    onPress={() => profileNavigation.navigate('ViewTransaction', { offerId: schedule.offer_id })}
                    color="#888"
                    />


                    {/* <Button title="Approve"/> */}
                </View>
            )}
            <FlatList
                data={messages}
                inverted
                keyExtractor={(item, index) => item.id ?? `message-${index}`}

                renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: item.sender_id === userId ? 'flex-end' : 'flex-start',
                    alignItems: 'center', // Center vertically
                    marginVertical: 2,
                    gap: 6, // Optional spacing between bubble and timestamp
                  }}
                >
                  {item.sender_id !== userId ? (
                    <>
                      <View style={styles.otherBubble}>
                        {item.target_type && item.target_id && (
                          <TouchableOpacity onPress={() => {
                            if (item.target_type === 'post') {
                              homeNavigation.navigate('ViewPost', { postId: item.target_id });
                            } else if (item.target_type === 'schedule') {
                              profileNavigation.navigate('ViewTransaction', { offerId: item.target_id });
                            }
                          }}>
                            <Text style={styles.bannerText}>
                              📌 In reply to {item.target_type === 'post' ? 'Post' : 'Schedule'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.messageText}>{item.message}</Text>
                      </View>
                      <Text style={[styles.timestamp, { alignSelf: 'center' }]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.timestamp, { alignSelf: 'center' }]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <View style={styles.userBubble}>
                        {item.target_type && item.target_id && (
                          <TouchableOpacity onPress={() => {
                            if (item.target_type === 'post') {
                              homeNavigation.navigate('ViewPost', { postId: item.target_id });
                            } else if (item.target_type === 'schedule') {
                              profileNavigation.navigate('ViewTransaction', { offerId: item.target_id });
                            }
                          }}>
                            <Text style={styles.bannerText}>
                              📌 In reply to {item.target_type === 'post' ? 'Post' : 'Schedule'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <Text style={[styles.messageText, item.sender_id === userId && { color: '#1A1A1A' }]}>
                          {item.message}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}
                 
            />
            </View>
            <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.iconButton}>
               <Image source={require('@/assets/images/imagebutton.png')} style={styles.iconImage} />
            </TouchableOpacity>

            <TextInput
              style={styles.inputField}
              placeholder="Type your message..."
              placeholderTextColor="#AAA"
              multiline
              value={newMessage}
              onChangeText={setNewMessage}
            />

            <TouchableOpacity style={styles.iconButton} onPress={handleSend}>
              <Image source={require('@/assets/images/paperplane.png')} style={styles.iconImage} />
            </TouchableOpacity>
          </View>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
                    <View style={{ backgroundColor: '#004d00', padding: 20, borderRadius: 10, width: '80%' }}>
                        <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 14, fontSize: 18 }}>Edit Schedule</Text>
                        <TextInput
                            placeholder="New Time"
                            value={newTime}
                            onChangeText={setNewTime}
                            style={{ borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 5 }}
                        />
                        <TextInput
                            placeholder="New Date"
                            value={newDate}
                            onChangeText={setNewDate}
                            style={{ borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 5 }}
                        />
                        <Button title="Save" onPress={handleEditSchedule} />
                        <Button title="Cancel" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};
const styles = StyleSheet.create({
  timestamp: {
  fontSize: 11,
  color: '#888',
  marginHorizontal: 10,
  marginBottom: 2,
  alignSelf: 'flex-end',
},

timestampLeft: {
  alignSelf: 'flex-start',
},

    userBubble: {
  alignSelf: 'flex-end',
  backgroundColor: '#00FF66',
  padding: 12,
  borderRadius: 100,
  marginVertical: 6,
  maxWidth: '75%',
},

otherBubble: {
  alignSelf: 'flex-start',
  backgroundColor: '#1E592B',
  padding: 12,
  borderRadius: 100,
  marginVertical: 6,
  maxWidth: '75%',
},

messageText: {
  color: 'white',
  fontSize: 16,
},


    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#132718',
      paddingHorizontal: 10,
      paddingVertical: 6,
      margin: 10,
      borderRadius: 18,
    },

    inputField: {
      flex: 1,
      color: 'white',
      fontSize: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    iconButton: {
      padding: 6,
    },

    iconImage: {
      width: 22,
      height: 22,
      resizeMode: 'contain',
    },


  messagescon: {   
    flex: 1,
    paddingHorizontal: 12,
    backgroundColor: '#004d00',
  },
  

avatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
},
  // 🔷 Layout
 

  // 🔷 Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1A3620',
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    left: 2,
    padding: 10,
    zIndex: 1,
  },

  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },



  // 🔷 Input Area
  inputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  
  },

  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 5,
    color: 'white',
    padding: 8,
    borderRadius: 20,
  },

  // 🔷 Attachments
  attachment: {
    marginBottom: 10,
    backgroundColor: '#1E592B',
    padding: 10,
    borderRadius: 8,
  },

  attachmentImage: {
    height: 100,
    width: 100,
    marginBottom: 5,
    borderRadius: 5,
  },

  attachmentText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // 🔷 Attachment Banner (Reply Reference)
  attachmentBanner: {
    backgroundColor: '#235F30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },

  bannerText: {
    color: '#fff',
    backgroundColor: '#235F30',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
});
;

export default ChatScreen;
