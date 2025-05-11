import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';
import { messagesService } from '@/services/messagesService';
import { LinearGradient } from 'expo-linear-gradient';
import paperplaneIcon from '../../assets/images/paperplane.png'; // adjust if path is different


type MessagesScreenNavProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

interface ChatPreview {
  chat_id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
  seen: boolean;
  photo_url?: string; // ✅ Add this
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
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
          loadChats();
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
  <LinearGradient
    colors={['#023F0F', '#05A527']}
    style={{ flex: 1 }}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
  >
    {/* Sticky Full-Width Header */}
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
      <View style={styles.titleWithIcon}>
        <Image source={paperplaneIcon} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>MESSAGES</Text>
      </View>
      <Text style={styles.dots}>⋯</Text>
    </View>


      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="PLASTIC, OBRERO USEP"
          placeholderTextColor="#AAA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>

    {/* Scrollable Container */}
    <View style={styles.container}>
      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No Conversations</Text>
      ) : (
        <FlatList
  data={filtered}
  keyExtractor={(item) => item.chat_id}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.chatCard} onPress={() => handleChatPress(item.chat_id)}>
      <View style={styles.chatRow}>
        <Image
          source={{ uri: item.photo_url || `https://i.pravatar.cc/40?u=${item.otherUserId}` }}
          style={styles.avatar}
        />
        <View style={styles.chatTextContainer}>
          <Text style={styles.chatName}>{item.otherUserName}</Text>
          <Text style={[styles.chatMessage, { fontWeight: item.seen ? 'normal' : 'bold' }]}>
            {item.lastMessage}
          </Text>
          <Text style={styles.chatTime}>
            {new Date(item.lastTimestamp).toLocaleString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )}
/>

      )}
    </View>
  </LinearGradient>
);

}

const styles = StyleSheet.create({

  titleWithIcon: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8, // or use marginRight in Image if gap doesn't work
  },

  headerIcon: {
    width: 26,   // ✅ change this to your desired size
    height: 26,
    resizeMode: 'contain',
  },

    chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 100,
    marginRight: 10,
  },
  chatTextContainer: {
    flex: 1,
  },

  headerContainer: {
    backgroundColor: '#1A3620',
    paddingHorizontal: 14,
    paddingTop: 24,
    paddingBottom: 16,
   
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
   paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dots: {
    color: '#fff',
    fontSize: 30,
    letterSpacing: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132718',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 45,
  },
  searchIcon: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },

  headerBar: {
  backgroundColor: '#1A3620',
  paddingVertical: 10,
  paddingHorizontal: 12,
  flexDirection: 'row', // 🟢 place children side by side
  alignItems: 'center',
  gap: 8,
  
},


  container: {
  flex: 1,
 
  paddingHorizontal: 12,
  paddingTop: 16, // 🔧 Add space below the header (adjust as needed)
},


  chatCard: {
    backgroundColor: '#1E592B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  chatName: {
    color: 'white',
    fontWeight: 'bold',
  },
  chatMessage: {
    color: 'white',
  },
  chatTime: {
    color: '#ccc',
    fontSize: 12,
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
});
