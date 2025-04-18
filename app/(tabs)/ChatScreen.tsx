// ChatScreen.tsx - Displays a conversation with the selected post as an attachment

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Image, Modal, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messagesService } from '@/services/messagesService';
import { Schedule } from './CollectionSchedule';
import { scheduleService } from '@/services/scheduleService';
import { supabase } from '@/services/supabase'; 
import { MaterialIcons } from '@expo/vector-icons';
import { Divider, IconButton } from 'react-native-paper';
import { offersService } from '@/services/offersService';

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
}

interface Post {
    id: string;
    description: string;
    photos?: string[];
}

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
    const { chatId, userId, post, schedule } = (route.params || {}) as RouteParams;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [newTime, setNewTime] = useState<string>(schedule?.scheduled_time || '');
    const [newDate, setNewDate] = useState<string>(schedule?.scheduled_date || '');
    const navigation = useNavigation();

    useEffect(() => {
        if (chatId) {
            const loadMessages = async () => {
                const data = await messagesService.fetchMessages(chatId);
                setMessages(data);
                // console.log(data);
            };
            loadMessages();
        }
    }, [chatId]);

    const handleSend = async () => {
        console.log("Send button clicked");
        console.log("chatId:", chatId, "userId:", userId, "newMessage:", newMessage);

        if (newMessage.trim() && chatId && userId && schedule) {
            try {
                // Send the message using messagesService
                console.log("Sending message...");
                const postOwnerId = schedule.user_id;
                const receiverId = userId === postOwnerId 
                    ? await offersService.getOffererId(chatId) // you need to get offerer ID
                    : postOwnerId;

                const result = await messagesService.sendMessage(chatId, userId, receiverId, newMessage);
                
                // Check msg was successfully sent
                if (result?.id) {
                    // Create new msg object
                    const newMessageObject: Message = {
                        id: result?.id,
                        chat_id: chatId,
                        sender_id: userId,
                        message: newMessage,
                        timestamp: new Date().toISOString(),
                    };
    
                    // update state
                    setMessages((prevMessages) => [newMessageObject, ...prevMessages]);
                    setNewMessage('');
                } else {
                    console.error("Failed to send message, no ID returned.");
                }
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }
    };

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
            .update({ status: 'for_collection' }) // or 'agreed'
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
              setMessages((prev) => [newMsg, ...prev]);
            }
          )
          .subscribe();
      
        return () => {
          supabase.removeChannel(subscription);
        };
      }, [chatId]);
      
    return (
        <View style={{ flex: 1, padding: 10, backgroundColor: '#004d00' }}>
                  <IconButton
                        icon="arrow-left"
                        size={24}
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    />
            {post && (
                <View style={{ marginBottom: 10, backgroundColor: '#1E592B', padding: 10, borderRadius: 8 }}>
                    {post.photos && post.photos.length > 0 && (
                        <Image source={{ uri: post.photos[0] }} style={{ height: 100, width: 100, marginBottom: 5, borderRadius: 5 }} />
                    )}
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{post.description}</Text>
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
                    <Button title="Edit" onPress={() => setModalVisible(true)} />
                    <Button title="Agree" onPress={handleAgree}/>
                    {/* <Button title="Approve"/> */}
                </View>
            )}
            <FlatList
                data={messages}
                inverted
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={item.sender_id === userId ? styles.userBubble : styles.otherBubble}>
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
    }
});

export default ChatScreen;
