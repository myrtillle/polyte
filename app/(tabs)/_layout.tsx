import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
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
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (  
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="ViewPost" options={{ href: null }} />
      <Tabs.Screen name="CommentScreen" options={{ href: null }} />
      <Tabs.Screen name="MakeOffer" options={{ href: null }} />
      <Tabs.Screen name="EditOffer" options={{ href: null }} />
      <Tabs.Screen name="ScheduleOffer" options={{ href: null }} />
      <Tabs.Screen name="CollectionSchedule" options={{ href: null }} />
      <Tabs.Screen name="ChatScreen" options={{ href: null }} />
      <Tabs.Screen name="TransacHist" options={{ href: null }} />
      <Tabs.Screen name="ConfirmDelivery" options={{ href: null }} />
      <Tabs.Screen name="ViewTransaction" options={{ href: null }} />
      <Tabs.Screen name="MyPosts" options={{ href: null }} />
      <Tabs.Screen name="Review" options={{ href: null }} />
      <Tabs.Screen name="Notifications" options={{ href: null }} />
      <Tabs.Screen name="EditPost" options={{ href: null }} />
      <Tabs.Screen name="TransaCompleted" options={{ href: null }} />
      <Tabs.Screen name="Ratings" options={{ href: null }} />
      <Tabs.Screen name="MapTestScreen" options={{ href: null }} />
      {/* <Tabs.Screen name="leaderboard" options={{ href: null }} /> */}
    </Tabs>
  );
}
