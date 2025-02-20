import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, HelperText } from 'react-native-paper';

import { useAuth } from '../../contexts/AuthContext';

type UserType = 'personal' | 'business' | 'barangay';

export default function RegisterScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [userType, setUserType] = React.useState<UserType>('personal');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signUp(email, password, fullName, userType);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
      
      <SegmentedButtons
        value={userType}
        onValueChange={setUserType as (value: string) => void}
        buttons={[
          { value: 'personal', label: 'Personal' },
          { value: 'business', label: 'Business' },
          { value: 'barangay', label: 'Barangay' },
        ]}
        style={styles.segment}
        disabled={loading}
      />
      
      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        mode="outlined"
        style={styles.input}
        disabled={loading}
      />
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={loading}
      />
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={loading}
      />
      
      {error ? <HelperText type="error">{error}</HelperText> : null}
      
      <Button 
        mode="contained" 
        onPress={handleRegister} 
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Create Account
      </Button>
      
      <Link href="/login" asChild>
        <Button mode="text" disabled={loading}>Already have an account? Login</Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  segment: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
}); 