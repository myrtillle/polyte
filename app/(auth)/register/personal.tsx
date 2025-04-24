import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
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
  const [barangay, setBarangay] = useState('');
  const [purok, setPurok] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define Puroks available for each Barangay
  const PUROKS: { [key: string]: string[] } = {
    Bankerohan: ['1', '2', '3', '4', '5'],
    Matina: ['1', '2', '3', '4', '5', '6'],
    Agdao: ['1', '2', '3', '4'],
  };

  // Function to get available Puroks based on Barangay
  const getPuroks = () => {
    return PUROKS[barangay] || [];
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!firstName || !lastName || !username || !barangay || !purok) {
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
        purok,
        account_type: 'personal',
      });

      if (error) throw error;

      router.push({
        pathname: '/(auth)/login',
        params: {
          message: 'Please check your email to confirm your account before logging in.',
        },
      });
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Logo & Header */}
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/polyte-logo.png')} style={styles.logo} />
        <Text style={styles.signUpText}>SIGN UP</Text>
      </View>

      {/* Input Fields */}
      <TextInput label="Surname" value={lastName}  theme={inputTheme} onChangeText={setLastName} mode="outlined" style={styles.input} outlineStyle={{ borderRadius: 25 }}/>
      <TextInput label="Firstname" value={firstName}  theme={inputTheme}onChangeText={setFirstName} mode="outlined" style={styles.input} outlineStyle={{ borderRadius: 25 }}/>
      <TextInput label="Username" value={username} theme={inputTheme} onChangeText={setUsername} mode="outlined" style={styles.input} autoCapitalize="none" outlineStyle={{ borderRadius: 25 }}/>
      <TextInput label="Email" value={email}  theme={inputTheme} onChangeText={setEmail} mode="outlined" style={styles.input} autoCapitalize="none" outlineStyle={{ borderRadius: 25 }}/>

      {/* Password Fields */}
      <TextInput label="Password" value={password}  theme={inputTheme} onChangeText={setPassword} mode="outlined" style={styles.input} secureTextEntry outlineStyle={{ borderRadius: 25 }}/>
      <TextInput label="Confirm Password" value={confirmPassword}  theme={inputTheme} onChangeText={setConfirmPassword} mode="outlined" style={styles.input} secureTextEntry outlineStyle={{ borderRadius: 25 }}/>

      {/* Barangay Selection */}
      <Text style={styles.label}>Select Address</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={barangay} onValueChange={(itemValue: string) => setBarangay(itemValue)}  theme={inputTheme}style={styles.picker}>
          <Picker.Item label="Select a Barangay" value="" />
          {Object.keys(PUROKS).map((barangay) => (
            <Picker.Item key={barangay} label={barangay} value={barangay} />
            
          ))}
        </Picker>
      </View>

      {/* Purok Selection (Appears Only After Selecting Barangay) */}
      {barangay ? (
        <View style={styles.pickerContainer}>
          <Picker selectedValue={purok} onValueChange={(itemValue: string) => setPurok(itemValue)} style={styles.picker}>
            <Picker.Item label="Select a Purok" value="" />
            {getPuroks().map((purok) => (
              <Picker.Item key={purok} label={`Purok ${purok}`} value={purok} />
            ))}
          </Picker>
        </View>
      ) : null}

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {/* Sign Up Button */}
      <Button mode="contained" onPress={handleSignup} loading={loading} style={styles.button} labelStyle={styles.buttonText}>
        SIGN UP
      </Button>

      {/* Back Button */}
      <Button mode="text" onPress={() => router.back()} style={styles.backButton}>
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
    marginTop:90,
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
  pickerContainer: {
    backgroundColor: '#237A36', // Dark green background
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
    borderWidth: 0,
    overflow: 'hidden',
  },
  
  picker: {
    color: '#fff', // White text for selected item
    fontSize: 14,
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  // **New Styles for the Dropdown Menu**
  pickerDropdown: {
    backgroundColor: '#145C2C', // Dark green background for dropdown items
    color: '#fff', // White text for options
  },
  
  label: {
    color: '#fff',
    marginBottom: 5,
    textAlignVertical:'center',
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  error: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  backButton: {
    marginTop: 10,
    backgroundColor: '#237A36',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
  },
  
});

