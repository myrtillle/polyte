import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '../../../services/authService';

export default function BarangaySignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [purok, setPurok] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const signupData = {
        email,
        password,
        purok,
        barangay: 'Bankerohan',
        account_type: 'barangay' as const
      };

      const { error: signupError } = await authService.signUp(signupData);

      if (signupError) {
        setError(signupError.message);
        return;
      }

      router.push({
        pathname: '/(auth)/login',
        params: { 
          message: 'Please check your email to confirm your account before logging in.'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Logo & Header */}
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/polyte-logo.png')} style={styles.logo} />
        <Text style={styles.signUpText}>BARANGAY SIGN UP</Text>
      </View>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        theme={inputTheme}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        outlineStyle={{ borderRadius: 25 }}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        theme={inputTheme}
        style={styles.input}
        secureTextEntry
        outlineStyle={{ borderRadius: 25 }}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        theme={inputTheme}
        style={styles.input}
        secureTextEntry
        outlineStyle={{ borderRadius: 25 }}
      />

      <TextInput
        label="Purok"
        value={purok}
        onChangeText={setPurok}
        mode="outlined"
        theme={inputTheme}
        style={styles.input}
        keyboardType="number-pad"
        outlineStyle={{ borderRadius: 25 }}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        CREATE ACCOUNT
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.backButton}
      >
        BACK
      </Button>
    </ScrollView>
  );
}

const inputTheme = {
  colors: {
    outline: '#237A36',
    primary: '#00FF57',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#023F0F',
  },
  logoContainer: {
    alignItems: 'flex-start',
    paddingLeft: 10,
    marginBottom: 20,
    marginTop: 90,
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
  signUpText: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#237A36',
    paddingHorizontal: 10,
    height: 55,
    fontSize: 12,
    color: '#023F0F',
    textAlignVertical: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#00FF57',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: 'thin',
    color: '#023F0F',
    textTransform: 'uppercase',
  },
  backButton: {
    marginTop: 10,
    backgroundColor: '#237A36',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});
