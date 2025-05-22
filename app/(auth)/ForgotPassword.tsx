import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { authService } from '../../services/authService';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type AuthNav = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigation = useNavigation<AuthNav>();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    // Clear previous messages
    setSuccessMessage('');

    // Validate email
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await authService.forgotPassword(email, {
        redirectTo: 'polyte://reset-password?type=recovery'
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          Alert.alert('Too many attempts', 'Please wait a few minutes before trying again.');
        } else {
          Alert.alert('Error', 'Failed to send reset email. Please try again later.');
        }
        return;
      }

      setSuccessMessage('Password reset instructions have been sent to your email. Please check your inbox.');
      
      // Optional: Navigate back to login after a delay
      setTimeout(() => {
        navigation.navigate('Login', { 
          message: 'Please check your email for password reset instructions.' 
        });
      }, 3000);

    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
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
        outlineStyle={{ borderRadius: 25 }}
        theme={{ colors: { primary: '#485935', outline: '#93a267' } }}
      />

      <Button
        mode="contained"
        loading={loading}
        onPress={handleResetPassword}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Send reset link
      </Button>

      <Button 
        onPress={() => navigation.navigate('Login')} 
        mode="text" 
        style={styles.backButton}
        labelStyle={styles.backButtonText}
      >
        Back to Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fbfbfb',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: '#485935',
    marginBottom: 16,
    textAlign: 'center',
  },
  success: {
    color: '#93a267',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fbfbfb',
    height: 55,
  },
  button: {
    backgroundColor: '#93a267',
    borderRadius: 25,
    paddingVertical: 6,
    height: 55,
  },
  buttonText: {
    color: '#fbfbfb',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#93a267',
    fontSize: 12,
  },
});
