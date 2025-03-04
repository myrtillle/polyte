import { Stack } from 'expo-router';

export default function RegisterLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Choose Account Type',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="personal" 
        options={{ 
          title: 'Personal Account',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="barangay" 
        options={{ 
          title: 'Barangay Account',
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 