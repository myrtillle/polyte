import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AccountTypeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>SIGN UP <Text style={styles.boldText}>ACCOUNT FOR</Text></Text>

      {/* Personal Account */}
      <TouchableOpacity style={styles.optionBox} onPress={() => router.push('/register/personal')}>
        <Text style={styles.optionText}>PERSONAL USE</Text>
        <Ionicons name="person-circle-outline" size={40} color="#023F0F" />
      </TouchableOpacity>

      {/* Barangay / Recycling Firm */}
      <TouchableOpacity style={[styles.optionBox, styles.barangayOption]} onPress={() => router.push('/register/barangay')}>
        <Text style={[styles.optionText, styles.barangayText]}>BUSINESS / RECYCLING FIRM</Text>
        <Ionicons name="people-circle-outline" size={40} color="#fff" />
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/auth/login')}>
        <Text style={styles.backButtonText}>BACK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#023F0F',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  boldText: {
    fontWeight: 'bold',
  },
  optionBox: {
    flexDirection: 'row',
    backgroundColor: '#00FF57',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  barangayOption: {
    backgroundColor: '#237A36',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023F0F',
  },
  barangayText: {
    color: '#FFFFFF',
  },
  backButton: {
    backgroundColor: '#00FF57',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  backButtonText: {
    fontSize: 16,
    color: '#023F0F',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
