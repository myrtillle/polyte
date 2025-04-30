import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';
import { messagesService } from '@/services/messagesService';


type MessagesScreenNavProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

interface ChatPreview {
  chat_id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
  seen: boolean;
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
  }, []);

  const loadChats = async () => {
    if (!userId) return;
    const previews = await messagesService.getUserChats(userId);
    setConversations(previews);
  };
  // Load chats
  useEffect(() => {
    loadChats();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
  
    const subscription = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📡 New message received:', payload);
          loadChats(); // Re-fetch enriched conversations
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);
  
  const handleChatPress = (chatId: string) => {
    if (!userId) return;
    navigation.navigate('ChatScreen', { chatId, userId });
  };

  const filtered = conversations.filter((c) =>
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {item.otherUserName}
              </Text>
              <Text style={{ color: 'white', fontWeight: item.seen ? 'normal' : 'bold' }}>
                {item.lastMessage}
              </Text>
              <Text style={{ color: '#ccc', fontSize: 12 }}>{new Date(item.lastTimestamp).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
