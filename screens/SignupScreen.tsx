import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '../services/authService';

type AccountType = 'Personal' | 'Barangay';

const PUROK_OPTIONS = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

export default function SignupScreen() {
  const [accountType, setAccountType] = useState<AccountType>('Personal');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
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

    if (accountType === 'Personal' && (!firstName || !lastName || !username)) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error } = await authService.signUp({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username,
        barangay: 'Bankerohan', // Default value
        purok: parseInt(purok),
        account_type: accountType,
      });

      if (error) throw error;

      router.replace('/');
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Create Account</Title>

      <SegmentedButtons
        value={accountType}
        onValueChange={(value) => setAccountType(value as AccountType)}
        buttons={[
          { label: 'Personal', value: 'Personal' },
          { label: 'Barangay/Purok', value: 'Barangay' },
        ]}
        style={styles.segment}
      />

      {accountType === 'Personal' && (
        <>
          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
          />
        </>
      )}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
      />

      <TextInput
        label="Purok"
        value={purok}
        onChangeText={setPurok}
        mode="outlined"
        style={styles.input}
        keyboardType="number-pad"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        style={styles.button}
      >
        Sign Up
      </Button>

      <Button
        mode="text"
        onPress={() => router.replace('/')}
      >
        Already have an account? Login
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 32,
  },
  segment: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
}); 