import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import LoginScreen from '@/app/(auth)/login';
import SignupScreen from '@/app/screens/SignupScreen';
import { RootStackParamList } from '../types/navigation';
import EditOffer from '../app/(tabs)/EditOffer';
import ScheduleOffer from '../app/(tabs)/ScheduleOffer'
import CollectionSchedule from '../app/(tabs)/CollectionSchedule';
import ConfirmDelivery from '@/app/(tabs)/ConfirmDelivery';
import PersonalSignUp from '@/app/(auth)/register/PersonalSignUp';

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
        component={PersonalSignUp}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator}
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EditOffer" 
        component={EditOffer} 
      />
      <Stack.Screen
        name="ScheduleOffer"
        component={ScheduleOffer}
      />
      <Stack.Screen
        name="CollectionSchedule"
        component={CollectionSchedule}
      />
      <Stack.Screen
        name="ConfirmDelivery"
        component={ConfirmDelivery}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;