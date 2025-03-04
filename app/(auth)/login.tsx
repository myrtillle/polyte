import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const params = useLocalSearchParams();
  const [successMessage, setSuccessMessage] = useState(params.message as string);
  const [showResend, setShowResend] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await authService.signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email before logging in. Check your inbox for the confirmation link.');
          setShowResend(true);
        } else {
          throw error;
        }
        return;
      }
      // Auth check will handle redirect
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials.');
      setShowResend(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      const { error } = await authService.resendConfirmation(email);
      if (error) throw error;
      setSuccessMessage('Confirmation email resent. Please check your inbox.');
      setShowResend(false);
    } catch (err) {
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Show success message from signup if exists */}
      {successMessage ? (
        <View style={styles.messageContainer}>
          <Text style={styles.successMessage}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Show error message if exists */}
      {error ? (
        <View style={styles.messageContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {showResend && (
        <Button
          mode="text"
          onPress={handleResendConfirmation}
          loading={loading}
          style={styles.resendButton}
        >
          Resend Confirmation Email
        </Button>
      )}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
      >
        Login
      </Button>
      
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Button
          mode="text"
          onPress={() => router.push('/(auth)/register')}
          style={styles.signupButton}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#023F0F',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#333',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#00FF57',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#fff',
  },
  signupButton: {
    marginLeft: -8,
  },
  signupButtonText: {
    color: '#00FF57',
  },
  messageContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  successMessage: {
    color: '#00FF57',
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 16,
    backgroundColor: '#00FF57',
  },
}); 