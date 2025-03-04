import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '../../services/authService';

export default function ProfileScreen() {
  const handleLogout = async () => {
    try {
      await authService.signOut();
      // AuthCheck in _layout.tsx will handle the redirect to login
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>

      <Button 
        mode="contained" 
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#FF3B30"  // Red color for logout
      >
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#023F0F',
  },
  logoutButton: {
    marginTop: 24,
  },
  // ... other existing styles ...
}); 