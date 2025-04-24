// ChatScreen.tsx - Displays a conversation with the selected post as an attachment

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Image, Modal, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messagesService } from '@/services/messagesService';
import { scheduleService } from '@/services/scheduleService';
import { supabase } from '@/services/supabase'; 
import { MaterialIcons } from '@expo/vector-icons';
import { Chip, Divider, IconButton } from 'react-native-paper';
import { offersService, Schedule } from '@/services/offersService';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { Message } from '@/services/messagesService';
import { formatTimeAgo } from '@/utils/dateUtils'; 
import { Post } from '@/types/Post';


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

type NavigationProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp>();

    const { chatId, userId, post, schedule } = (route.params || {}) as RouteParams;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newTime, setNewTime] = useState<string>(schedule?.scheduled_time || '');
    const [newDate, setNewDate] = useState<string>(schedule?.scheduled_date || '');
    const [receiverName, setReceiverName] = useState<string>('');


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
        if (chatId && schedule) {
            await scheduleService.updateSchedule(chatId, newTime, newDate);
            setModalVisible(false);
            schedule.scheduled_time = newTime;
            schedule.scheduled_date = newDate;
        }
    };

    const handleAgree = async () => {
        try {
          const { error } = await supabase
            .from('offer_schedules')
            .update({ status: 'for_collection' }) 
            .eq('offer_id', chatId);
      
          if (error) throw error;
      
          Alert.alert("Agreed", "You have agreed to the schedule.");
        } catch (error) {
          console.error("Error agreeing to schedule:", error);
          Alert.alert("Error", "Failed to agree on the schedule.");
        }
      };
      
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
        <View style={{ flex: 1, padding: 10, backgroundColor: '#004d00' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {receiverName}
                </Text>
            </View>

            {post && (
                <View style={{ backgroundColor: '#1E592B', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                    {post.photos?.[0] && (
                    <Image source={{ uri: post.photos[0] }} style={{ height: 100, borderRadius: 6, marginBottom: 8 }} />
                    )}
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{post.description}</Text>
                    <Text style={{ color: '#00FF66', fontWeight: 'bold', marginTop: 4 }}>
                    Mode: {post.collection_mode?.name}
                    </Text>
                    <Text style={{ color: '#fff' }}>
                    Weight: {post.kilograms} kg
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    {(post.post_item_types ?? []).map((type, index) => (
                        <Chip
                        key={index}
                        style={{ backgroundColor: '#235F30', marginRight: 6, marginTop: 4 }}
                        textStyle={{ color: 'white', fontSize: 10 }}
                        >
                        {type.item_types?.name}
                        </Chip>
                    ))}
                    </View>
                    <Text style={{ color: '#ccc', marginTop: 4 }}>
                    From: {post.user?.first_name} {post.user?.last_name} • Brgy {post.user?.barangay}, Purok {post.user?.purok}
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 10 }}>
                    Posted: {formatTimeAgo(post.created_at)}
                    </Text>
                </View>
            )}
            {schedule && (
                <View style={{ marginBottom: 10, backgroundColor: '#1E592B', padding: 10, borderRadius: 8 }}>
                    {schedule.photoUrl && (
                        <Image source={{ uri: schedule.photoUrl }} style={{ height: 100, width: 100, marginBottom: 5, borderRadius: 5 }} />
                    )}
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Scheduled by: {schedule.offererName}</Text>
                    <Text style={{ color: 'white' }}>Collector: {schedule.collectorName}</Text>
                    <Text style={{ color: 'white' }}>Time: {schedule.scheduled_time} - Date: {schedule.scheduled_date}</Text>
                    <Text style={{ color: 'white' }}>Location: {schedule.purok}, {schedule.barangay}</Text>
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
                    onPress={() => navigation.navigate('ViewTransaction', { offerId: chatId })}
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
                    <View style={item.sender_id === userId ? styles.userBubble : styles.otherBubble}>
                      {item.target_type && item.target_id && (
                        <TouchableOpacity
                          onPress={() => {

                            console.log('Clicked target:', item.target_type, item.target_id);
                            
                            if (item.target_type === 'post') {
                              navigation.navigate('ViewPost', { postId: item.target_id });
                            } else if (item.target_type === 'schedule') {
                              navigation.navigate('ViewTransaction', { offerId: item.target_id });
                            }
                          }}
                        >
                          <Text style={styles.bannerText}>
                            📌 In reply to {item.target_type === 'post' ? 'Post' : 'Schedule'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                  )}                  
            />
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TextInput
                    style={{ flex: 1, borderColor: 'gray', borderWidth: 1, marginRight: 5, color: 'white' }}
                    placeholder='Type a message...'
                    placeholderTextColor='#999'
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <Button title='Send' onPress={handleSend} />
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
    container: { flex: 1, padding: 10, backgroundColor: '#004d00' },
    attachment: { marginBottom: 10, backgroundColor: '#1E592B', padding: 10, borderRadius: 8 },
    attachmentImage: { height: 100, width: 100, marginBottom: 5, borderRadius: 5 },
    attachmentText: { color: 'white', fontWeight: 'bold' },
    userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', padding: 10, borderRadius: 20, marginVertical: 5 },
    otherBubble: { alignSelf: 'flex-start', backgroundColor: '#E5E5EA', padding: 10, borderRadius: 20, marginVertical: 5 },
    messageText: { color: 'white' },
    inputContainer: { flexDirection: 'row', marginTop: 10 },
    input: { flex: 1, borderColor: 'gray', borderWidth: 1, marginRight: 5, color: 'white', padding: 8, borderRadius: 20 },
    backButton: { 
        marginLeft: 10,
        marginBottom: 10,
    },
    attachmentBanner: {
        backgroundColor: '#235F30',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginBottom: 4,
        alignSelf: 'flex-start',
      },
      
      bannerText: {
        color: '#00FF66',
        fontWeight: 'bold',
        fontSize: 12,
        textDecorationLine: 'underline',
      }
      
});

export default ChatScreen;
