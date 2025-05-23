import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase } from '../../services/supabase';

type AuthNav = StackNavigationProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const navigation = useNavigation<AuthNav>();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link URL:', url);
      try {
        const urlObj = new URL(url);
        // Get the access token from the URL hash
        const hashParams = new URLSearchParams(urlObj.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          setResetToken(accessToken);
          // Set the session with the token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });
          
          if (error) {
            console.error('❌ Error setting session:', error);
            Alert.alert('Error', 'Invalid or expired reset link. Please request a new one.');
            navigation.navigate('Login');
          }
        } else {
          console.log('❌ No access token found in URL');
          Alert.alert('Error', 'Invalid reset link. Please request a new one.');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('❌ Error handling deep link:', error);
        Alert.alert('Error', 'Invalid reset link. Please request a new one.');
        navigation.navigate('Login');
      }
    };

    // Get initial URL
    Linking.getInitialURL().then(url => {
      console.log('📱 Initial URL:', url);
      if (url) {
        handleDeepLink(url);
      }
    }).catch(error => {
      console.error('❌ Error getting initial URL:', error);
    });

    // Add event listener for deep linking
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Deep link event:', event);
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Invalid Password', passwordErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your password has been reset successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Invalid Reset Link</Text>
        <Text style={styles.subtitle}>This password reset link is invalid or has expired.</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
          labelStyle={styles.buttonText}
        >
          Back to Login
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your new password</Text>

      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        outlineStyle={{ borderRadius: 25 }}
        theme={{ colors: { primary: '#485935', outline: '#93a267' } }}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        outlineStyle={{ borderRadius: 25 }}
        theme={{ colors: { primary: '#485935', outline: '#93a267' } }}
      />

      <Button
        mode="contained"
        onPress={handleResetPassword}
        loading={loading}
        style={styles.button}
        labelStyle={styles.buttonText}
        disabled={loading}
      >
        Reset Password
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
    fontSize: 24,
    color: '#485935',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#93a267',
    marginBottom: 24,
    textAlign: 'center',
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
});
