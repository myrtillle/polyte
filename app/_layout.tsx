import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { addNotificationListener, addNotificationResponseListener } from '../services/notifications';

import { theme } from '../theme';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const notificationListener = addNotificationListener(notification => {
      console.log('Received notification:', notification);
      // Handle foreground notifications here
    });

    const responseListener = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      // Handle notification taps here
      if (data.requestId) {
        router.push({
          pathname: '/(tabs)/request-details',
          params: { id: data.requestId }
        });
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
} 