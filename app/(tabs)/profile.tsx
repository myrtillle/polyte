import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView  } from 'react-native';
import { Card } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Logout Failed:", error.message);
    } else {
      console.log("✅ Logged out successfully!");
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as keyof RootStackParamList }],
      });
    }
  };

  return (
          <LinearGradient
        colors={['#023F0F', '#05A527']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
      <ScrollView contentContainerStyle={styles.listContent}>
      {/* Header image background with circular profile image overlay */}
      <View style={styles.headerBackground}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/100' }}
          style={styles.overlayProfileImage}
        />
      </View>

      {/* User Details Card */}
      <Card style={styles.userCard}>
        <Card.Content>
          <Text style={styles.profileName}>Minji Kim</Text>
          <Text style={styles.profileLocation}>📍 Lambingan Street, Milan, Buhangin, Davao City</Text>
          <Text style={styles.memberSince}>Member Since: July 1, 2023</Text>
        </Card.Content>
      </Card>

      {/* Stats Section */}
      <Text style={styles.sectionTitle}>ALL TIME STATS</Text>

      <Card style={styles.statCard}>
        <Card.Content>
          <Text style={styles.statLabel}>CARBON EMISSION SAVED</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>1140 kg CO2</Text>
            <Text style={styles.statIcon}>🌫️</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.doubleCardRow}>
        <Card style={styles.smallCard}>
          <Card.Content>
            <Text style={styles.statLabel}>SACK OF TRASH COLLECTED</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>20</Text>
              <Text style={styles.statIcon}>🟢</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.smallCard}>
          <Card.Content>
            <Text style={styles.statLabel}>SACK OF TRASH DONATED</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>38</Text>
              <Text style={styles.statIcon}>⚫</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.statCard}>
        <Card.Content>
          <View style={styles.statRowSpaceBetween}>
            <Text style={styles.statLabel}>AVERAGE MONTHLY CONTRIBUTION</Text>
            <Text style={styles.suffix}>SACKS PER MONTH</Text>
          </View>
          <Text style={styles.statValue}>15</Text>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <View style={styles.statRowSpaceBetween}>
            <Text style={styles.statLabel}>TOTAL POLYS COLLECTED</Text>
            <Text style={styles.statIcon}>🟩</Text>
          </View>
          <Text style={styles.statValue}>135</Text>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <View style={styles.statRowSpaceBetween}>
            <Text style={styles.statLabel}>USER RATING</Text>
            <Text style={styles.suffix}>AS OF THIS MONTH</Text>
          </View>
          <Text style={styles.statValue}>⭐⭐⭐⭐⭐</Text>
        </Card.Content>
      </Card>

      <Card style={styles.statCard}>
        <Card.Content>
          <Text style={styles.transactionText}>TRANSACTION HISTORY</Text>
        </Card.Content>
      </Card>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  


  headerBackground: {
    height: 200,
    backgroundColor: '#023F0F',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  overlayProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: '#023F0F',
    marginBottom: -45,
    zIndex: 10,
  },
  userCard: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileLocation: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 2,
  },
  memberSince: {
    color: '#888',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statCard: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 6,
  },
  statLabel: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.25,
  },
  statValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  doubleCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
  },
  suffix: {
    fontSize: 10,
    color: '#9CA3AF', // muted gray
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statIcon: {
    fontSize: 16,
  },
  transactionText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 2,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 100,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
