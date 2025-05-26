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
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList, RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { Message } from '@/services/messagesService';
import { formatTimeAgo } from '@/utils/dateUtils'; 
import { Post } from '@/types/Post';
import Constants from 'expo-constants';
import paperplaneIcon from '../../assets/images/paperplane.png';
import { notificationService } from '@/services/notificationService';
import { transactionService } from '@/services/transactionService';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const { offerId } = route.params as { offerId: string };
    const { chatId, userId, post, schedule: incomingSchedule } = (route.params || {}) as RouteParams;
    const [schedule, setSchedule] = useState<Schedule | undefined>(incomingSchedule);
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newTime, setNewTime] = useState<string>(schedule?.scheduled_time || '');
    const [newDate, setNewDate] = useState<string>(schedule?.scheduled_date || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        if (schedule?.scheduled_date) {
            const [year, month, day] = schedule.scheduled_date.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date();
    });
    const [selectedTime, setSelectedTime] = useState(() => {
        if (schedule?.scheduled_time) {
            const [hours, minutes] = schedule.scheduled_time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            return date;
        }
        return new Date();
    });
    const [receiverName, setReceiverName] = useState<string>('');
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    
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
      const hydrateScheduleUsingChatId = async () => {
        if (!schedule && chatId) {
          console.log('🔍 Hydrating pending schedule from chat participants...');
    
          // Step 1: Get user1 and user2 from chat
          const { data: chatData, error: chatErr } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', chatId)
            .single();
    
          if (chatErr || !chatData) {
            console.warn('❌ Failed to fetch chat participants');
            return;
          }
    
          const userA = chatData.user1_id;
          const userB = chatData.user2_id;
    
          console.log('🔍 User A:', userA);
          console.log('🔍 User B:', userB);
    
          // Step 2: Fetch all pending offer_schedules with embedded user names
          const { data: schedules, error: scheduleErr } = await supabase
            .from('offer_schedules')
            .select(`
              *,
              collector:collector_id (
                id,
                first_name,
                last_name
              ),
              offerer:offerer_id (
                id,
                first_name,
                last_name
              )
            `)
            .eq('status', 'pending');
    
          if (scheduleErr || !schedules?.length) {
            console.warn('⛔ No pending schedules found');
            return;
          }
    
          // Step 3: Find a matching schedule based on collector & offerer IDs
          for (const sched of schedules) {
            const isCollector = [userA, userB].includes(sched.collector_id);
            const isOfferer = [userA, userB].includes(sched.offerer_id);
    
            if (isCollector && isOfferer) {
              const hydrated = {
                id: sched.id,
                scheduled_time: sched.scheduled_time,
                scheduled_date: sched.scheduled_date,
                status: sched.status,
                photoUrl: sched.photo_url || '',
                collectorName: sched.collector
                  ? `${sched.collector.first_name} ${sched.collector.last_name}`
                  : 'Collector',
                offererName: sched.offerer
                  ? `${sched.offerer.first_name} ${sched.offerer.last_name}`
                  : 'Offerer',
                purok: '',       // optional if not embedded yet
                barangay: '',    // optional if not embedded yet
                collector_id: sched.collector_id,
                offerer_id: sched.offerer_id,
                offer_id: sched.offer_id,
              };
    
              setSchedule(hydrated);
              setNewTime(hydrated.scheduled_time);
              setNewDate(hydrated.scheduled_date);
              console.log('✅ Hydrated schedule:', hydrated);
              return;
            }
          }
    
          console.log('⚠️ No matching pending schedule found for this chat');
        }
      };
    
      hydrateScheduleUsingChatId();
    }, [chatId, schedule]);
    
    const isSellingPost = transaction?.category_id === 2;

    const isOfferer = currentUser?.id === transaction?.offerer_id;
    const isCollector = currentUser?.id === transaction?.collector_id;

    const isBuyer = isSellingPost ? isCollector : isOfferer;
    const isSeller = isSellingPost ? isOfferer : isCollector;

    useEffect(() => {
      console.log("🧩 useEffect triggered — chatId:", chatId, "schedule:", schedule);
    }, [chatId, schedule]);
    
    
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
            const postOwnerId = schedule.collector_id;
            if (!postOwnerId) {
              console.error("❌ No user_id found in schedule");
              Alert.alert("Error", "Could not determine message recipient. Please try again.");
              return;
            }

            if (userId === postOwnerId) {
              receiverId = schedule.offerer_id;
              console.log("User is the collector — chatting with offerer:", receiverId);
            } else {
              receiverId = postOwnerId;
              console.log("User is the offerer — chatting with collector:", receiverId);
            }
            
          } catch (err) {
            console.error("❌ Error resolving receiver from schedule:", err);
            Alert.alert("Error", "Could not determine message recipient. Please try again.");
            return;
          }
        } else {
          // ✅ Case 2: Try to resolve from chat participants
          console.log("No schedule found, resolving from chat participants...");
          const { data: chat, error: chatError } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', chatId)
            .single();

          if (chatError) {
            console.error("❌ Could not resolve from chats table:", chatError);
            Alert.alert("Error", "Could not determine message recipient. Please try again.");
            return;
          }

          receiverId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
          console.log("✅ Resolved receiverId from chat participants:", receiverId);
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

    const handleEditSchedule = async () => {
        if (!chatId || !schedule) {
            Alert.alert("Error", "Missing schedule information");
            return;
        }

        // Validate date and time
        const now = new Date();
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

        // Check if selected date and time is in the past
        if (selectedDateTime < now) {
            Alert.alert("Invalid Date/Time", "Please select a future date and time.");
            return;
        }

        try {
            const { error } = await supabase
                .from('offer_schedules')
                .update({
                    scheduled_time: selectedTime.toTimeString().split(' ')[0],
                    scheduled_date: selectedDate.toISOString().split('T')[0]
                })
                .eq('offer_id', chatId);

            if (error) throw error;

            // Update local state
            schedule.scheduled_time = selectedTime.toTimeString().split(' ')[0];
            schedule.scheduled_date = selectedDate.toISOString().split('T')[0];

            // Send notification to the other user
            const otherUserId = userId === schedule.collector_id ? schedule.offerer_id : schedule.collector_id;
            await notificationService.sendNotification(
                otherUserId as string,
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
        if (!schedule?.offer_id || !schedule?.offerer_id) {
            Alert.alert("Error", "Missing schedule information");
            return;
        }

        try {
            const { error } = await supabase
                .from('offer_schedules')
                .update({ status: 'for_collection' })
                .eq('offer_id', schedule.offer_id);

            if (error) throw error;

            // Send notification to the post owner
            await notificationService.sendNotification(
                schedule.collector_id,
                'Schedule Agreed! 🎉',
                'Great news! The schedule has been agreed upon. Time to make our planet greener! 🌱',
                'schedule_agreed',
                {
                    type: 'transaction',
                    id: schedule.offer_id
                }
            );

            Alert.alert(
                "Schedule Agreed! 🎉",
                "Awesome! You've agreed to the schedule. Let's make our planet greener together! 🌱\n\nRedirecting to transaction details...",
                [{ text: "OK" }]
            );

            // Wait for 2 seconds before navigating
            setTimeout(() => {
              rootNavigation.navigate('Main', {
                screen: 'Profile',
                params: {
                    screen: 'ViewTransaction',
                    params: { offerId: schedule.offer_id }
                }
            }); 
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
  
    // console.log('coords: ', coords);
  
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
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}> BACK TO POST</Text>
                  </TouchableOpacity>
                </View>
            )}
            {schedule && schedule.status === 'pending' && (isBuyer || isSeller) && (
                <View style={styles.scheduleCard}>
                    <View style={styles.scheduleHeader}>
                        <Text style={styles.scheduleTitle}>COLLECTION SCHEDULE</Text>
                        <View style={styles.scheduleStatus}>
                            <Text style={styles.statusText}>PENDING</Text>
                        </View>
                    </View>

                    <View style={styles.scheduleContent}>
                        {schedule.photoUrl && (
                            <Image 
                                source={{ uri: schedule.photoUrl }} 
                                style={styles.scheduleImage} 
                            />
                        )}
                        
                        <View style={styles.scheduleDetails}>
                            {/* <View style={styles.scheduleRow}>
                                <MaterialIcons name="person" size={20} color="#00D964" />
                                <Text style={styles.scheduleText}>
                                    {schedule.offererName} set the collection schedule at
                                    
                                </Text>
                            </View> */}

                            {/* <View style={styles.scheduleRow}>
                                <MaterialIcons name="person-outline" size={20} color="#00D964" />
                                <Text style={styles.scheduleText}>
                                    Collector: {schedule.collectorName}
                                </Text>
                            </View> */}

                            <View style={styles.scheduleRow}>
                                <MaterialIcons name="access-time" size={20} color="#00D964" />
                                <Text style={styles.scheduleText}>
                                    Time: {schedule.scheduled_time}
                                </Text>
                            </View>

                            <View style={styles.scheduleRow}>
                                <MaterialIcons name="calendar-today" size={20} color="#00D964" />
                                <Text style={styles.scheduleText}>
                                    Date: {schedule.scheduled_date}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.scheduleActions}>
                        {((isSellingPost && isSeller) || (!isSellingPost && isBuyer)) && (
                            <TouchableOpacity 
                                style={[styles.scheduleButton, styles.editButton]} 
                                onPress={() => setModalVisible(true)}
                            >
                                <MaterialIcons name="edit" size={20} color="white" />
                                <Text style={styles.buttonText}>Edit Schedule</Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* if SELLING, buyer should see. if SEEKING, seller should see */}
                        {((isSellingPost && isBuyer) || (!isSellingPost && isSeller)) && (
                            <TouchableOpacity 
                                style={[styles.scheduleButton, styles.agreeButton]} 
                                onPress={handleAgree}
                            >
                                <MaterialIcons name="check-circle" size={20} color="white" />
                                <Text style={styles.buttonText}>Agree to Schedule</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={[styles.scheduleButton, styles.viewButton]}
                            onPress={() => {
                                rootNavigation.navigate('Main', {
                                    screen: 'Profile',
                                    params: {
                                        screen: 'ViewTransaction',
                                        params: { offerId: schedule.offer_id }
                                    }
                                });
                            }}
                        >
                            <MaterialIcons name="receipt" size={20} color="white" />
                            <Text style={styles.buttonText}>View Transaction</Text>
                        </TouchableOpacity>
                    </View>
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
                              In reply to {item.target_type === 'post' ? 'Post' : 'Schedule'}
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
                              rootNavigation.navigate('Main', {
                                screen: 'Profile',
                                params: {
                                    screen: 'ViewTransaction',
                                    params: { offerId: item.target_id }
                                }
                            }); 
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
                        
                        <TouchableOpacity 
                            style={styles.dateTimeButton} 
                            onPress={() => setShowDatePicker(true)}
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
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) {
                                        setSelectedDate(date);
                                        // If the selected date is today, ensure time is in the future
                                        if (date.toDateString() === new Date().toDateString()) {
                                            const now = new Date();
                                            if (selectedTime < now) {
                                                setSelectedTime(now);
                                            }
                                        }
                                    }
                                }}
                            />
                        )}

                        <TouchableOpacity 
                            style={styles.dateTimeButton} 
                            onPress={() => setShowTimePicker(true)}
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
                                onChange={(event, time) => {
                                    setShowTimePicker(false);
                                    if (time) {
                                        setSelectedTime(time);
                                    }
                                }}
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, { backgroundColor: '#00D964' }]} 
                                onPress={handleEditSchedule}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, { backgroundColor: '#666' }]} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
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
    color: '#000201',
  
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
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
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scheduleCard: {
    backgroundColor: '#1E592B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00D964',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#235F30',
  },
  scheduleTitle: {
    color: '#00D964',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scheduleStatus: {
    backgroundColor: '#235F30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#00D964',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scheduleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  scheduleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
  },
  editButton: {
    backgroundColor: '#235F30',
  },
  agreeButton: {
    backgroundColor: '#00D964',
  },
  viewButton: {
    backgroundColor: '#1A3620',
  },
  buttonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
;

export default ChatScreen;
