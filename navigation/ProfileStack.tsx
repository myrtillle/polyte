import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '@/app/(tabs)/profile';
import TransacHist from '@/app/(tabs)/TransacHist';
import ViewTransaction from '@/app/(tabs)/ViewTransaction';
import Review from '@/app/(tabs)/Review';
import MyPostsScreen from '@/app/(tabs)/MyPosts';
import EditPost from '@/app/(tabs)/EditPost';
import TransaCompleted from '@/app/(tabs)/TransaCompleted';
import Ratings from '@/app/(tabs)/Ratings';

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
          title: 'TRANSACTION HISTORY', 
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
      <Stack.Screen name="ViewTransaction" component={ViewTransaction} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="MyPostsScreen" component={MyPostsScreen} />
      <Stack.Screen name="EditPost" component={EditPost} />
      <Stack.Screen name="TransaCompleted" component={TransaCompleted} />
      <Stack.Screen name="Ratings" component={Ratings} />
    </Stack.Navigator>
  );
}
