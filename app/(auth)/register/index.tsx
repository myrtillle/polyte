import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text, SegmentedButtons, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { Stack } from 'expo-router';

const PUROK_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

export default function AccountTypeScreen() {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Choose Account Type</Title>
      
      <Card 
        style={styles.card} 
        onPress={() => router.push('/(auth)/register/personal')}
      >
        <Card.Content>
          <Title>Personal Account</Title>
          <Text>For individual users who want to participate in recycling activities</Text>
        </Card.Content>
      </Card>

      <Card 
        style={styles.card} 
        onPress={() => router.push('/(auth)/register/barangay')}
      >
        <Card.Content>
          <Title>Barangay/Purok Account</Title>
          <Text>For barangay officials and purok leaders</Text>
        </Card.Content>
      </Card>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        Back to Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
});

export function SignupLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Sign Up',
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