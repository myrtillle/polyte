import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { authService } from '../../../services/authService';
import { locationService, Barangay, Purok } from '../../../services/locationService';
import { Picker } from '@react-native-picker/picker';

export default function PersonalSignUp() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Signup'>>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNum, setContactNum] = useState('');
  const [barangayId, setBarangayId] = useState<number | null>(null);
  const [purokId, setPurokId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [puroks, setPuroks] = useState<Purok[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    loadBarangays();
  }, []);

  useEffect(() => {
    if (barangayId) {
      loadPuroks(barangayId);
    } else {
      setPuroks([]);
      setPurokId(null);
    }
  }, [barangayId]);

  const loadBarangays = async () => {
    try {
      setLoadingLocations(true);
      console.log('🔄 Fetching barangays...');
      const data = await locationService.getBarangays();
      console.log('✅ Barangays fetched:', data);
      setBarangays(data);
    } catch (err) {
      console.error('❌ Error loading barangays:', err);
      setError('Failed to load barangays. Please try again.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadPuroks = async (barangayId: number) => {
    try {
      setLoadingLocations(true);
      setError('');
      const data = await locationService.getPuroksByBarangay(barangayId);
      setPuroks(data);
      
      if (data.length === 0) {
        setError('No puroks found for this barangay. Please contact support.');
      }
    } catch (err) {
      console.error('Error loading puroks:', err);
      setError('Failed to load puroks. Please try selecting the barangay again.');
      setPuroks([]);
    } finally {
      setLoadingLocations(false);
    }
  };

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateContactNumber = (number: string) => {
    // Philippine mobile number format: 09XXXXXXXXX (11 digits)
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleSignup = async () => {
    // Check for empty fields with specific messages
    const emptyFields = [];
    if (!firstName) emptyFields.push('First name');
    if (!lastName) emptyFields.push('Last name');
    if (!username) emptyFields.push('Username');
    if (!email) emptyFields.push('Email');
    if (!password) emptyFields.push('Password');
    if (!confirmPassword) emptyFields.push('Confirm password');
    if (!contactNum) emptyFields.push('Contact number');
    if (!barangayId) emptyFields.push('Barangay');
    if (!purokId) emptyFields.push('Purok');

    if (emptyFields.length > 0) {
      setError(`Please fill in the following fields: ${emptyFields.join(', ')}`);
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate contact number format
    if (!validateContactNumber(contactNum)) {
      setError('Please enter a valid contact number (e.g., 09123456789)');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('\n'));
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
        contact_num: contactNum,
        barangay_id: barangayId!.toString(),
        purok_id: purokId!.toString(),
        account_type: 'personal',
      });

      if (error) {
        // Handle specific error cases
        if (error.message?.toLowerCase().includes('email already registered')) {
          setError('This email is already registered. Please use a different email or try logging in.');
        } else {
          throw error;
        }
        return;
      }

      console.log('🔵 Navigating to Login with message:', 'Please check your email to confirm your account before logging in.');
      navigation.reset({
        index: 0,
        routes: [
          { 
            name: 'Login',
            params: {
              message: 'Please check your email to confirm your account before logging in.'
            }
          }
        ],
      });
      
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Logo & Header */}
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/polyte-logo.png')} style={styles.logo} />
        <Text style={styles.signUpText}>SIGN UP</Text>
      </View>

      {/* Personal Information Section */}
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <TextInput 
        label="Surname" 
        value={lastName}  
        theme={inputTheme} 
        onChangeText={setLastName} 
        mode="outlined" 
        style={styles.input} 
        outlineStyle={{ borderRadius: 25 }}
      />
      <TextInput 
        label="Firstname" 
        value={firstName}  
        theme={inputTheme}
        onChangeText={setFirstName} 
        mode="outlined" 
        style={styles.input} 
        outlineStyle={{ borderRadius: 25 }}
      />
      <TextInput 
        label="Contact Number" 
        value={contactNum}  
        theme={inputTheme} 
        onChangeText={setContactNum} 
        mode="outlined" 
        style={styles.input} 
        keyboardType="phone-pad"
        placeholder="09XXXXXXXXX"
        outlineStyle={{ borderRadius: 25 }}
      />

      {/* Account Credentials Section */}
      <Text style={styles.sectionTitle}>Account Credentials</Text>
      <TextInput 
        label="Username" 
        value={username} 
        theme={inputTheme} 
        onChangeText={setUsername} 
        mode="outlined" 
        style={styles.input} 
        autoCapitalize="none" 
        outlineStyle={{ borderRadius: 25 }}
      />
      <TextInput 
        label="Email" 
        value={email}  
        theme={inputTheme} 
        onChangeText={setEmail} 
        mode="outlined" 
        style={styles.input} 
        autoCapitalize="none" 
        outlineStyle={{ borderRadius: 25 }}
      />
      <TextInput 
        label="Password" 
        value={password}  
        theme={inputTheme} 
        onChangeText={setPassword} 
        mode="outlined" 
        style={styles.input} 
        secureTextEntry 
        outlineStyle={{ borderRadius: 25 }}
      />
      <TextInput 
        label="Confirm Password" 
        value={confirmPassword}  
        theme={inputTheme} 
        onChangeText={setConfirmPassword} 
        mode="outlined" 
        style={styles.input} 
        secureTextEntry 
        outlineStyle={{ borderRadius: 25 }}
      />

      {/* Address Information Section */}
      <Text style={styles.sectionTitle}>Address Information</Text>
      <View style={styles.pickerContainer}>
        <Picker 
          selectedValue={barangayId} 
          onValueChange={(itemValue: number) => setBarangayId(itemValue)}  
          theme={inputTheme}
          style={styles.picker}
          enabled={!loadingLocations}
        >
          <Picker.Item label="Select a Barangay" value={null} />
          {barangays.map((barangay) => (
            <Picker.Item key={barangay.id} label={barangay.name} value={barangay.id} />
          ))}
        </Picker>
      </View>

      {barangayId ? (
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={purokId} 
            onValueChange={(itemValue: number) => setPurokId(itemValue)} 
            style={styles.picker}
            enabled={!loadingLocations && puroks.length > 0}
          >
            <Picker.Item label="Select a Purok" value={null} />
            {puroks.map((purok) => (
              <Picker.Item key={purok.id} label={purok.purok_name} value={purok.id} />
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
      <Button 
        mode="contained" 
        onPress={handleSignup} 
        loading={loading} 
        style={styles.button} 
        labelStyle={styles.buttonText}
        disabled={loading || loadingLocations}
      >
        SIGN UP
      </Button>

      {/* Login Link */}
      <View style={styles.loginLinkContainer}>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Login')} 
          style={styles.loginLink}
          labelStyle={styles.loginLinkText}
        >
          Already have an account? Login instead
        </Button>
      </View>
    </ScrollView>
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
    color: '#485935',
    marginTop: 2,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#485935',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
    paddingLeft: 10,
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
  pickerContainer: {
    backgroundColor: '#fbfbfb',
    borderRadius: 30,
    marginBottom: 16,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#93a267',
    overflow: 'hidden',
  },
  picker: {
    color: '#485935',
    fontSize: 14,
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    fontWeight: 'bold',
    color: '#fbfbfb',
    textTransform: 'uppercase',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  error: {
    color: '#485935',
    fontSize: 12,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loginLinkContainer: {
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  loginLink: {
    width: '100%',
  },
  loginLinkText: {
    color: '#93a267',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

