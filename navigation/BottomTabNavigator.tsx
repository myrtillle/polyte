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
import { TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
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