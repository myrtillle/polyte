import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { authService } from '@/services/authService';

type AuthNav = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigation = useNavigation<AuthNav>();

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const { error } = await authService.forgotPassword(email);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError('Failed to send reset instructions. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.messageContainer}>
          <Text style={styles.successMessage}>{success}</Text>
        </View>
      ) : null}

      <TextInput
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        outlineStyle={{ borderRadius: 25 }}
        theme={inputTheme}
      />

      <Button
        mode="contained"
        onPress={handleResetPassword}
        loading={loading}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        SEND RESET INSTRUCTIONS
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        labelStyle={styles.backButton}
      >
        Back to Login
      </Button>
    </View>
  );
}

const inputTheme = {
  colors: {
    outline: '#93a267',
    primary: '#485935',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fbfbfb',
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#485935',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#93a267',
  },
  input: {
    backgroundColor: '#fbfbfb',
    paddingHorizontal: 10,
    height: 55,
    fontSize: 12,
    color: '#485935',
    textAlignVertical: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#93a267',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'thin',
    color: '#fbfbfb',
    textTransform: 'uppercase',
  },
  backButton: {
    color: '#93a267',
    fontSize: 12,
    marginTop: 16,
  },
  error: {
    color: '#485935',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  successMessage: {
    color: '#93a267',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
}); 