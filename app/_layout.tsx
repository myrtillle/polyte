import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Cannot update a component',
  'Non-serializable values were found in the navigation state',
]);

export const unstable_settings = {
  initialRouteName: 'index',
};

// Auth check component
function AuthCheck() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth group
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and in auth group
      router.replace('/(tabs)/home');
    }
  }, [session, segments, isLoading]);

  return null; // Return null to avoid rendering anything
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AuthCheck />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          {/* <Stack.Screen name="index" /> */}
        </Stack>
      </AuthProvider>
    </PaperProvider>
  );
}
