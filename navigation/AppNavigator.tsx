import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import LoginScreen from '../app/screens/LoginScreen';
import SignupScreen from '../app/screens/SignupScreen';
import ViewPost from '../app/(tabs)/ViewPost';  
import MakeOffer from '../app/(tabs)/MakeOffer';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator}
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ViewPost" 
        component={ViewPost}
        options={{ title: 'View Post' }} 
      />
      <Stack.Screen 
        name="MakeOffer" 
        component={MakeOffer} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
