import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { authService } from '../../services/authService';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await authService.forgotPassword(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send reset email.');
    } else {
      setSuccessMessage('Reset link sent. Check your inbox.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset your password</Text>
      {successMessage ? (
        <Text style={styles.success}>{successMessage}</Text>
      ) : null}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        theme={{ colors: { primary: '#00FF57', outline: '#237A36' } }}
      />

      <Button
        mode="contained"
        loading={loading}
        onPress={handleResetPassword}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        SEND RESET LINK
      </Button>

      <Button onPress={() => router.back()} mode="text" style={styles.backButton}>
        Back to Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#023F0F',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  success: {
    color: '#00FF57',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#1A3620',
  },
  button: {
    backgroundColor: '#00FF57',
    borderRadius: 25,
    paddingVertical: 6,
  },
  buttonText: {
    color: '#023F0F',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
  },
});
