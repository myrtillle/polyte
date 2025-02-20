import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { getNotifications } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

export default function TabsLayout() {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useProfile();

  useEffect(() => {
    if (session?.user) {
      const loadNotifications = async () => {
        try {
          const notifications = await getNotifications(session.user.id);
          setUnreadCount(notifications.filter(n => !n.read).length);
        } catch (error) {
          console.error('Error loading notifications:', error);
        }
      };

      loadNotifications();
    }
  }, [session?.user]);

  return (
    <ProtectedRoute>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create-request"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="request-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bookmark" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            tabBarIcon: ({ color, size }) => (
              <View>
                <Ionicons name="notifications" size={size} color={color} />
                {unreadCount > 0 && (
                  <Badge
                    size={16}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                    }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        {profile?.user_type === 'barangay' && (
          <Tabs.Screen
            name="moderation"
            options={{
              title: 'Moderation',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="shield" size={size} color={color} />
              ),
            }}
          />
        )}
      </Tabs>
    </ProtectedRoute>
  );
} 