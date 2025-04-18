import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabase';
import { notificationService } from '@/services/notificationService';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';

type NotificationsRouteProp = RouteProp<RootStackParamList, 'Notifications'>;

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const route = useRoute<NotificationsRouteProp>();
  const { onViewed } = route.params || {};

  useFocusEffect(
    React.useCallback(() => {
      if (onViewed) onViewed();
    }, [])
  );

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (!sessionError && sessionData?.user?.id) {
        setUserId(sessionData.user.id);

        const notif = await notificationService.getUserNotifications(sessionData.user.id);
        setNotifications(notif);
      }
      setLoading(false);
    };

    fetchUserAndNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      if (!userId) return;
      await notificationService.markAllAsRead(userId);
      const refreshed = await notificationService.getUserNotifications(userId);
      setNotifications(refreshed);
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
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
          <View key={notif.id} style={styles.card}>
            <Text style={styles.title}>{notif.title}</Text>
            <Text style={styles.message}>{notif.message}</Text>
            <Text style={styles.timestamp}>{new Date(notif.created_at).toLocaleString()}</Text>
          </View>
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
    backgroundColor: '#05A527',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
