import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { messagesService } from '@/services/messagesService';
import { ScrollView } from 'react-native-gesture-handler';
// import { messagesService } from '@/services/messagesService';
import { supabase } from '@/services/supabase';


interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
}

interface RouteParams {
    // chatId?: string;
    userId?: string;
}

type MessagesScreenNavProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

const MessagesScreen = () => {
    const route = useRoute();
    const navigation = useNavigation<MessagesScreenNavProp>();
    const [userId, setUserId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        const getUser = async () => {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) {
            console.error("Error getting user:", error?.message || "No user found");
          } else {
            setUserId(data.user.id);
          }
        };
        getUser();
    }, []);
      
    useEffect(() => {
        const loadConversations = async () => {
          try {
            console.log("userID: ", userId);
            const conversations = await messagesService.fetchUserConversations(userId!);
            console.log("📨 Conversations fetched:", conversations);
            setMessages(conversations as Message[]);
          } catch (err) {
            console.error('Failed to fetch conversations:', err);
          }
        };
      
        if (userId) {
          loadConversations();
        }
      }, [userId]);
      

    const filtered = messages.filter((m) =>
    m.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatPress = (chatId: string) => {
        if (!userId) {
          console.warn('Cannot open chat: userId is null');
          return;
        }
      
        navigation.navigate('ChatScreen', {
          chatId,
          userId, 
        });
    };
      

    return (
        <View style={{ flex: 1, padding: 10, backgroundColor: '#004d00' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>
            MESSAGES
            </Text>

            <View style={{ marginBottom: 10, backgroundColor: '#1E592B', borderRadius: 8, padding: 5 }}>
            <TextInput
                style={{ color: 'white', paddingHorizontal: 10 }}
                placeholder="Search conversations..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            </View>

            {filtered.length === 0 ? (
            <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>No Conversations</Text>
            ) : (
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.chat_id}
                renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => handleChatPress(item.chat_id)}
                    style={{
                    backgroundColor: '#1E592B',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 10,
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Chat ID: {item.chat_id}</Text>
                    <Text style={{ color: 'white' }}>{item.message}</Text>
                    <Text style={{ color: '#ccc', fontSize: 12 }}>{new Date(item.timestamp).toLocaleString()}</Text>
                </TouchableOpacity>
                )}
            />
            )}
        </View>
    );
};

export default MessagesScreen;
