import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
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
    {/* 🔹 Logo & Login Text */}
    <View style={styles.logoContainer}>
      <Image source={require('../../assets/images/polyte-logo.png')} style={styles.logo} />

      <Text style={styles.loginText}>LOGIN</Text>
    </View>

      {/* Show success message from signup if exists */}
      {successMessage ? (
        <View style={styles.messageContainer}>
          <Text style={styles.successMessage}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Show error message if exists */}
      {error ? (
         <View style={styles.errorContainer}>
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
      label="EMAIL" 
      value={email}
      onChangeText={setEmail}
      mode="outlined" 
      style={styles.input}
      outlineStyle={{ borderRadius: 25 }}
      theme={inputTheme}
    />

      <TextInput
       label="PASSWORD"
       value={password}
       onChangeText={setPassword}
       secureTextEntry
       mode="outlined"
       style={styles.input}
       outlineStyle={{ borderRadius: 25 }}
       theme={inputTheme}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        LOGIN
      </Button>
      <Button
        mode="text"
        onPress={() => router.push('/(auth)/ForgotPassword')}
        labelStyle={{ color: '#00FF57', fontSize: 12 }}
      >
        Forgot Password?
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
const inputTheme = {
  colors: {
    outline: '#237A36', // Default border color (red-orange)
    primary: '#00FF57', // Focused border color (neon green)
  },
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#023F0F',
    justifyContent: 'center',



  },
  logoContainer: {
    alignItems: 'flex-start', // Align logo and text to the left
    paddingLeft: 10, // Adjust left padding
    marginBottom: 20, // Space below logo
  },
  logo: {
    width: 150, // Adjust width as needed
    height: 40, // Adjust height as needed
    resizeMode: 'contain', // Keep aspect ratio
  },
  loginText: {
    fontSize: 20, // Match "LOGIN" text size
    color: '#FFFFFF', // White text
    marginTop: 2, // Space between logo and text
  },



  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#237A36', // Dark gray background
    paddingHorizontal:10, // Padding for better spacing
    height:55, // Normal input height
    fontSize: 12, // Increase text size
    color: '#023F0F', // White text color
    textAlignVertical: 'center', // Centers text inside input
    marginBottom: 20,
  },
  labelSmall: {
    fontSize: 40, // Force label to be small
    fontWeight: 'normal', // Prevent bold label
  },
  button: {
    marginTop: 24,
    backgroundColor: '#00FF57', // Neon green button color
    borderRadius: 25, // Fully rounded button
    height: 55, // Match button height
    justifyContent: 'center', // Ensure text is centered
  },
  buttonText: {
    fontSize: 12, // Larger text size
    fontWeight: 'thin', // Make it bold
    color: '#023F0F', // Dark green text
    textTransform: 'uppercase', // Force uppercase text
  },
  error: {
    color: 'red',
    fontSize: 12, // Smaller font size
    marginBottom: 0, // Reduce bottom margin
    textAlign: 'center', // Center text and prevent it from stretching
    alignSelf: 'center', // Ensures it stays compact
    maxWidth: '100%', // Prevents it from expanding too much
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
  errorContainer: {
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8, // Reduced to avoid extra spacing
    paddingHorizontal:10, // Keeps text compact
  },
}); 