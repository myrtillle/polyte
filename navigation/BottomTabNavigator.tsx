import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '@/app/(tabs)/home';
import PostScreen from '../app/(tabs)/post';
import ProfileScreen from '../app/(tabs)/profile';
import MessagesScreen from '@/app/(tabs)/messages';
import LeaderboardScreen from '@/app/(tabs)/leaderboard';
import { BottomTabParamList } from '../types/navigation';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack';
import MessagesStack from './MessagesStack';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { TouchableOpacity, View, Text, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { IconButton } from 'react-native-paper';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (!payload.new.seen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    // Initial fetch of unread messages
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUserId)
        .eq('seen', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserId]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#00FF57',
        tabBarInactiveTintColor: '#ffffff',
        tabBarStyle: {
          backgroundColor: '#023F0F',
          borderTopWidth: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1A3620',
          },
          headerTintColor: 'white',
          headerTitle: 'Create Post',
          headerTitleStyle: {
            fontSize: 14,
            fontWeight: 'normal',
            textTransform: 'uppercase',
          },
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor="white"
              onPress={() => {
                Alert.alert(
                  "Are you sure?",
                  "Your changes may not be saved.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { 
                      text: "Yes", 
                      onPress: () => {
                        // Navigate back to the main screen
                        navigation.navigate('Main', {
                          screen: 'Home'
                        });
                      }
                    }
                  ]
                );
              }}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        })}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="chatbubbles" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -6,
                  backgroundColor: '#FF3B30',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            // Reset unread count when tab is pressed
            setUnreadCount(0);
            // Mark all messages as seen
            if (currentUserId) {
              supabase
                .from('messages')
                .update({ seen: true })
                .eq('receiver_id', currentUserId)
                .eq('seen', false);
            }
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ navigation }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                navigation.navigate('Main', {
                  screen: 'Profile',
                  params: {
                    screen: 'ProfileMain'
                  }
                });
              }}
            />
          )
        })}
      />
    </Tab.Navigator>
  );
} 