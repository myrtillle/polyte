import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/app/(tabs)/profile';
import TransacHist from '@/app/(tabs)/TransacHist';
import ViewTransaction from '@/app/(tabs)/ViewTransaction';
import Review from '@/app/(tabs)/Review';
import MyPostsScreen from '@/app/(tabs)/MyPosts';
import EditPost from '@/app/(tabs)/EditPost';
import TransaCompleted from '@/app/(tabs)/TransaCompleted';
import Ratings from '@/app/(tabs)/Ratings';
import RedeemRewards from '@/app/(tabs)/RedeemRewards';
import EditProfileScreen from '@/app/(tabs)/EditProfile';
const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen 
        name="TransacHist" 
        component={TransacHist} 
        options={{
          headerShown: true,
          title: 'Transaction History', 
          headerStyle: {
            backgroundColor: '#1A3620',
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
            
          } 
        }}
      />
      <Stack.Screen name="ViewTransaction" component={ViewTransaction} 
        options={{
          headerShown: true,
          title: 'Transaction Details',
          headerStyle: {
            backgroundColor: '#1A3620',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          }
        }}
      />
      <Stack.Screen name="Review" component={Review} 
        options={{
          headerShown: true,
          title: 'REVIEW',
          headerStyle: {
            backgroundColor: '#235F30',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          }
        }}
      />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} 
        options={{
          headerShown: true,
          title: 'MY POSTS',
          headerStyle: {
            backgroundColor: '#235F30',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          }
        }}
      />
      <Stack.Screen name="EditPost" component={EditPost} />
      <Stack.Screen name="TransaCompleted" component={TransaCompleted} />
      <Stack.Screen name="Ratings" component={Ratings} 
        options={{
          headerShown: true,
          title: 'RATINGS',
          headerStyle: {
            backgroundColor: '#1A3620',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 16,
          }
        }}
      />
      <Stack.Screen name="RedeemRewards" component={RedeemRewards} options={{
        headerShown: true,
        title: 'REDEEM REWARDS',
        headerStyle: {
          backgroundColor: '#1E592B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
        }
      }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{
        headerShown: true,
        title: 'EDIT PROFILE',
        headerStyle: {
          backgroundColor: '#1E592B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
        }
      }} />
    </Stack.Navigator>
  );
}
