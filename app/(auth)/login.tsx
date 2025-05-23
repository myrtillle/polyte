import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authService } from '../../services/authService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type AuthNav = StackNavigationProp<RootStackParamList, 'Login'>;


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation<AuthNav>();
  const route = useRoute();
  const params = route.params as { message?: string };
  const [successMessage, setSuccessMessage] = useState(params?.message ?? '');

  const [showResend, setShowResend] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { error } = await authService.signIn(email, password);
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email before logging in. Check your inbox for the confirmation link.');
          setShowResend(true);
        } else if (error.message.includes('Network request failed')) {
          setError('Network error. Please check your internet connection.');
          // Implement retry logic
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setTimeout(handleLogin, 2000); // Retry after 2 seconds
          }
        } else {
          throw error;
        }
        return;
      }
  
      // Reset retry count on success
      setRetryCount(0);
      
      // ✅ Redirect to main app screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
  
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific error types
      if (error.message?.includes('Network request failed')) {
        setError('Network error. Please check your internet connection.');
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(handleLogin, 2000);
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
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
          {error.includes('Network error') && retryCount < 3 && (
            <Text style={styles.retryText}>Retrying... ({retryCount + 1}/3)</Text>
          )}
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
        onPress={() => navigation.navigate('ForgotPassword')}
        labelStyle={{ color: '#93a267', fontSize: 12 }}
      >
        Forgot Password?
      </Button>
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Button
          mode="text"
          onPress={() => navigation.navigate('Signup')}
          labelStyle={{ color: '#93a267', fontSize: 12, marginLeft: -8 }}
        >
          Sign Up
        </Button>
      </View>
    </View>
  );
}
const inputTheme = {
  colors: {
    outline: '#93a267', // Medium green for input borders
    primary: '#485935', // Dark green for focused state
  },
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fbfbfb', // Off-white background
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'flex-start',
    paddingLeft: 10,
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
  loginText: {
    fontSize: 20,
    color: '#485935', // Dark green text
    marginTop: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#485935', // Dark green text
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fbfbfb', // Off-white background
    paddingHorizontal: 10,
    height: 55,
    fontSize: 12,
    color: '#485935', // Dark green text
    textAlignVertical: 'center',
    marginBottom: 20,
  },
  labelSmall: {
    fontSize: 40, // Force label to be small
    fontWeight: 'normal', // Prevent bold label
  },
  button: {
    marginTop: 24,
    backgroundColor: '#93a267', // Medium green button
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'thin',
    color: '#fbfbfb', // Off-white text
    textTransform: 'uppercase',
  },
  error: {
    color: '#485935', // Dark green for errors
    fontSize: 12,
    marginBottom: 0,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#485935', // Dark green text
  },
  signupButton: {
    marginLeft: -8,
  },
  signupButtonText: {
    color: '#93a267', // Medium green for links
  },
  messageContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  successMessage: {
    color: '#93a267', // Medium green for success messages
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 16,
    backgroundColor: '#cadbb7', // Light green for secondary buttons
  },
  retryText: {
    color: '#93a267',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 8,
  },
}); 