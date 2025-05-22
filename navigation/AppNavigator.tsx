import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import LoginScreen from '@/app/(auth)/login';
import SignupScreen from '@/app/screens/SignupScreen';
import { RootStackParamList } from '../types/navigation';
import EditOffer from '../app/(tabs)/EditOffer';
import ScheduleOffer from '../app/(tabs)/ScheduleOffer'
import CollectionSchedule from '../app/(tabs)/CollectionSchedule';
import ConfirmDelivery from '@/app/(tabs)/ConfirmDelivery';
import PersonalSignUp from '@/app/(auth)/register/PersonalSignUp';
import ForgotPasswordScreen from '@/app/(auth)/ForgotPassword';
import ResetPasswordScreen from '@/app/(auth)/ResetPassword';

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Signup" 
        component={PersonalSignUp}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
      />
      <Stack.Screen 
        name="Main" 
        component={BottomTabNavigator}
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
}

export default AppNavigator;