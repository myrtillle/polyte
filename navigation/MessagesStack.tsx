// navigation/MessagesStack.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MessagesScreen from '@/app/(tabs)/messages';
import ChatScreen from '@/app/(tabs)/ChatScreen';

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MessagesMain" component={MessagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
    </Stack.Navigator>
  );
}
