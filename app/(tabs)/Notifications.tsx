import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { notificationService } from '@/services/notificationService';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, ProfileStackParamList, MessagesStackParamList, RootStackParamList } from '@/types/navigation';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type NotificationsRouteProp = RouteProp<HomeStackParamList, 'Notifications'>;

export default function Notifications() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const route = useRoute<NotificationsRouteProp>();
  // const { onViewed } = route.params || {};

  // useFocusEffect(
  //   React.useCallback(() => {
  //     if (onViewed) onViewed();
  //   }, [])
  // );

  const fetchNotifications = async (userId: string) => {
    try {
      const notif = await notificationService.getUserNotifications(userId);
      setNotifications(notif);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (!sessionError && sessionData?.user?.id) {
        setUserId(sessionData.user.id);
        await fetchNotifications(sessionData.user.id);
      }
      setLoading(false);
    };

    fetchUserAndNotifications();
  }, []);

  // Add real-time subscription
  useEffect(() => {
    if (!userId) return;

    const notificationSubscription = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('📡 Real-time notification update:', payload);
          await fetchNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      const markViewed = async () => {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
          if (!sessionError && sessionData?.user?.id) {
            await notificationService.markAsRead(sessionData.user.id);
            await fetchNotifications(sessionData.user.id);
          }
        } catch (err) {
          console.error("Error in onViewed logic:", err);
        }
      };
  
      markViewed();
    }, [])
  );
  
  const handleMarkAllAsRead = async () => {
    try {
      if (!userId) return;
      await notificationService.markAllAsRead(userId);
      await fetchNotifications(userId);
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  };
  
  const handleNotificationPress = async (notif: any) => {
    const { type, post_id, offer_id, chat_id, user_id } = notif;
  
    try {
      if (!notif.is_read) {
        await notificationService.markAsRead(notif.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notif.id ? { ...n, is_read: true } : n
          )
        );
      }
      
      console.log("🔔 Notification data:", notif);
      console.log("📌 Post ID:", notif.post_id);

      if (type === 'new_offer' || type === 'new_comment' || type === 'new_interest') {
        // First get the offer using target_id
        const { data: offer, error: offerError } = await supabase
          .from('posts')
          .select('id')
          .eq('id', notif.target_id)
          .single();

        if (!offer || offerError) {
          return;
        }

        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('*, post_item_types(item_types(*)), personal_users(*)')
          .eq('id', offer.id)
          .single();

        if (!post || postError) {
          Alert.alert('Error', 'Post not found.');
          return;
        }

        homeNavigation.navigate('ViewPost', { post });
  
      } else if (type === 'schedule_updated' || type === 'offer_accepted' || type === 'transaction_completed' || type === 'payment_send' || type==='proof_uploaded') {
        navigation.navigate('Main', {
          screen: 'Profile',
          params: {
            screen: 'ViewTransaction',
            params: { offerId: notif.target_id }
          }
        });
  
      } else if (type === 'reward_approved' || type === 'reward_rejected') {
        // Navigate to RedeemRewards screen
        profileNavigation.navigate('RedeemRewards');
      } else {
        console.warn("Unhandled notification type:", type);
      }
    } catch (err) {
      console.error("Error handling notification:", err);
    }
  };
  

  if (loading) return <ActivityIndicator color="#00D964" size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAll}>
        <Text style={styles.markAllText}>Mark all as read</Text>
    </TouchableOpacity>

      {notifications.length === 0 ? (
        <Text style={styles.empty}>No notifications yet.</Text>
      ) : (
        notifications.map((notif) => (
          <TouchableOpacity key={notif.id} style={[styles.card, !notif.is_read && styles.unreadCard]} onPress={() => handleNotificationPress(notif)}>
            <Text style={styles.title}>{notif.title}</Text>
            <Text style={styles.message}>{notif.message}</Text>
            <Text style={styles.timestamp}>{new Date(notif.created_at).toLocaleString()}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#023F0F',
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#32663D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#05A527', // brighter green or whatever color you want
    borderWidth: 2,
    borderColor: '#00FF99',
  },  
  title: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    color: '#eee',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
  },
  empty: {
    color: '#ccc',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  markAll: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  markAllText: {
    color: '#00D964',
    fontWeight: 'bold',
    fontSize: 12,
  },
  
});
