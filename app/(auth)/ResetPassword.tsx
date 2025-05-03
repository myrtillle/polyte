import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import * as Linking from 'expo-linking';
import { supabase } from '../../services/supabase';

export default function ResetPasswordScreen() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getTokenFromUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const { queryParams } = Linking.parse(url);

        const tokenParam = queryParams?.access_token;

        if (typeof tokenParam === 'string') {
            setToken(tokenParam);
        } else if (Array.isArray(tokenParam)) {
            setToken(tokenParam[0]); // use the first token if it's an array
        } else {
            setToken('');
        }
      }
    };
    getTokenFromUrl();
  }, []);

  const handlePasswordReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handlePasswordReset}
        loading={loading}
        style={styles.button}
      >
        Update Password
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#023F0F' },
  title: { fontSize: 18, color: '#fff', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#1A3620', marginBottom: 16 },
  button: { backgroundColor: '#00FF57' },
});
