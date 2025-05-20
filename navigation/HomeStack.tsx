import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/app/(tabs)/home';
import ViewPost from '@/app/(tabs)/ViewPost';
import MakeOffer from '@/app/(tabs)/MakeOffer';
import Notifications from '@/app/(tabs)/Notifications';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen 
        name="ViewPost" 
        component={ViewPost}
        options={{
          headerShown: true,
          title: 'SEE POST', 
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
      <Stack.Screen name="MakeOffer" component={MakeOffer} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
}
