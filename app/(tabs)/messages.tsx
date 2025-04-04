import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { messagesService } from '@/services/messagesService';
import { ScrollView } from 'react-native-gesture-handler';

interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
}

interface RouteParams {
    chatId?: string;
    userId?: string;
}

const MessagesScreen = () => {
    const route = useRoute();
    const { chatId, userId } = (route.params || {}) as RouteParams;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (chatId) {
            const loadMessages = async () => {
                const data = await messagesService.fetchMessages(chatId);
                setMessages(data);
            };
            loadMessages();
        }
    }, [chatId]);

    const handleSend = async () => {
        if (newMessage.trim() && chatId && userId) {
            await messagesService.sendMessage(chatId, userId, newMessage);
            setNewMessage('');
            const data = await messagesService.fetchMessages(chatId);
            setMessages(data);
        }
    };

    const filteredMessages = messages.filter(message =>
      message.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={{ flex: 1, padding: 10, backgroundColor: '#004d00' }}>
        <View style={{ marginBottom: 10, padding: 20, backgroundColor: 'transparent', alignItems: 'center'}}>
          <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 20 }}>MESSAGES</Text>
        </View>

        <View style={{ marginBottom: 10, backgroundColor: '#1E592B', borderRadius: 8, padding: 5 }}>
            <TextInput
                style={{ color: 'white', paddingHorizontal: 10 }}
                placeholder='Search messages...'
                placeholderTextColor='#999'
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>
        {filteredMessages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 18 }}>No Chats</Text>
            </View>
          ) : (
              <FlatList
                  data={filteredMessages}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                      <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#1E592B', borderRadius: 10 }}>
                          <Text style={{ color: 'white' }}>{item.message}</Text>
                      </View>
                  )}
              />
          )}
          {/* <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TextInput
                  style={{ flex: 1, borderColor: 'gray', borderWidth: 1, marginRight: 5, color: 'white' }}
                  placeholder='Type a message...'
                  placeholderTextColor='#999'
                  value={newMessage}
                  onChangeText={setNewMessage}
              />
              <Button title='Send' onPress={handleSend} />
          </View> */}
      </View>
    );
};

export default MessagesScreen;
