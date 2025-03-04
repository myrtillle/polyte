import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '../../../services/authService';
import { Picker } from '@react-native-picker/picker';

export default function PersonalSignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [barangay, setBarangay] = useState('Bankerohan');
  const [purok, setPurok] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!firstName || !lastName || !username) {
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
        barangay,
        purok: purok.toString(),
        account_type: 'personal',
      });

      if (error) throw error;

      router.push({
        pathname: '/(auth)/login',
        params: { 
          message: 'Please check your email to confirm your account before logging in.'
        }
      });
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Personal Account</Title>

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

      <Picker
        selectedValue={barangay}
        onValueChange={(itemValue: string) => setBarangay(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Bankerohan" value="Bankerohan" />
        {/*more options*/}
      </Picker>

      <Picker
        selectedValue={purok}
        onValueChange={(itemValue: string) => setPurok(itemValue)}
        style={styles.picker}
      >
        {[...Array(14)].map((_, index) => (
          <Picker.Item key={index + 1} label={`${index + 1}`} value={`${index + 1}`} />
        ))}
      </Picker>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        style={styles.button}
      >
        Create Account
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.button}
      >
        Back
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
  input: {
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
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