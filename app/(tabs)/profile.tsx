import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card } from 'react-native-paper';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }} // Static profile image
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Minji Kim</Text>
        <Text style={styles.profileLocation}>
          Lambingan Street, Milan, Buhangin, Davao City
        </Text>
        <Text style={styles.memberSince}>Member Since: July 1, 2023</Text>
      </View>

      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>ALL TIME STATS</Text>
          <Text style={styles.statLabel}>Carbon Emission Saved</Text>
          <Text style={styles.statValue}>1140 kg CO2</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sack of Trash Collected</Text>
            <Text style={styles.statValue}>20</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sack of Trash Donated</Text>
            <Text style={styles.statValue}>38</Text>
          </View>

          <Text style={styles.statLabel}>Average Monthly Contribution</Text>
          <Text style={styles.statValue}>15 sacks per month</Text>

          <Text style={styles.statLabel}>Total Polys Collected</Text>
          <Text style={styles.statValue}>135</Text>

          <Text style={styles.statLabel}>User Rating</Text>
          <Text style={styles.statValue}>⭐⭐⭐⭐⭐</Text>

          <Text style={styles.statLabel}>Transaction History</Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3620',
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileLocation: {
    color: '#ccc',
  },
  memberSince: {
    color: '#ccc',
  },
  statsCard: {
    backgroundColor: '#2C5735',
    borderRadius: 8,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statLabel: {
    color: '#fff',
    marginTop: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default ProfileScreen; 