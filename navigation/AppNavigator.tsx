import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import LoginScreen from '../app/screens/LoginScreen';
import SignupScreen from '../app/screens/SignupScreen';
import ViewPost from '../app/(tabs)/ViewPost';  
import MakeOffer from '../app/(tabs)/MakeOffer';
import { RootStackParamList } from '../types/navigation';
import EditOffer from '../app/(tabs)/EditOffer';
import ScheduleOffer from '../app/(tabs)/ScheduleOffer'
import CollectionSchedule from '../app/(tabs)/CollectionSchedule';
import ChatScreen from '@/app/(tabs)/ChatScreen';
import TransacHist from '@/app/(tabs)/TransacHist';
import ViewTransaction from '@/app/(tabs)/ViewTransaction';
import ConfirmDelivery from '@/app/(tabs)/ConfirmDelivery';
import MyPosts from '@/app/(tabs)/MyPosts';
import Review from '@/app/(tabs)/review';
import Notifications from '@/app/(tabs)/Notifications';

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
        name="ChatScreen"
        component={ChatScreen}
      />
      <Stack.Screen
        name="TransacHist"
        component={TransacHist}
      />
      <Stack.Screen
        name="ViewTransaction"
        component={ViewTransaction}
      />
      <Stack.Screen
        name="ConfirmDelivery"
        component={ConfirmDelivery}
      />
      <Stack.Screen
        name="MyPosts"
        component={MyPosts}
      />
      <Stack.Screen
        name="Review"
        component={Review}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
