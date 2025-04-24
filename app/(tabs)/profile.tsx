import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { profileService } from '@/services/profileService';

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collectionStats, setCollectionStats] = useState({ collected: 0, donated: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await profileService.fetchCurrentUserDetails();
        setProfile(data);

        if (data?.id) {
          const stats = await profileService.fetchUserCollection(data.id);
          setCollectionStats(stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Logout Failed:", error.message);
    } else {
      navigation.replace('Login');
    }
  };

  if (loading) return <ActivityIndicator color="#00D964" size="large" style={{ flex: 1 }} />;

  return (
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWrapper}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
            <Text style={styles.profileLocation}>Purok {profile.purok}, {profile.barangay}</Text>
            <Text style={styles.memberSince}>Member Since: {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ratingRow} onPress={() => navigation.navigate('Review')}>
        <View style={styles.ratingSection}>
          <Text style={styles.rating}>⭐️⭐️⭐️⭐️</Text>
          <Text style={styles.ratingLabel}>USER RATING AS OF THIS MONTH</Text>
        </View>

<<<<<<< Updated upstream
        <View style={styles.polyWrapper}>
          <Text style={styles.polyCount}>{profile.totalPoints}</Text>
          <Text style={styles.polyLabel}>POLY COLLECTED</Text>
        </View>
      </TouchableOpacity>
=======
        <Card style={styles.statCard}>
          <Card.Content>
            <View style={styles.statRowSpaceBetween}>
              <Text style={styles.statLabel}>AVERAGE MONTHLY CONTRIBUTION [STATIC]</Text>
              <Text style={styles.suffix}>KG PER MONTH</Text>
            </View>
            <Text style={styles.statValue}>15</Text>
          </Card.Content>
        </Card>
>>>>>>> Stashed changes


        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MyPosts')}>
          <Text style={styles.actionButtonTextMP}>MY POST</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('TransacHist')}>
          <Text style={styles.actionButtonTextTH}>VIEW TRANSACTION HISTORY</Text>
        </TouchableOpacity>

        <View style={styles.allTimeStatsContainer}>
          <Text style={styles.sectionTitle}>ALL TIME STATS</Text>

          <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
          <Text style={styles.statLabel}>CARBON EMISSION SAVED</Text>
          <Text style={styles.statIcon}>♻️</Text>
        </View>

            
            <Text style={styles.statValue}>1140 kg CO2 </Text>
          </View>

          <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
          <Text style={styles.statLabel}>SACK OF TRASH</Text>
          <Text style={styles.statIcon}>🧺</Text>
        </View>
            <View style={styles.statRowSplit}>
              <Text style={styles.statSplit}><Text style={styles.boldText}>DONATED</Text> {collectionStats.donated}</Text>
              <Text style={styles.statSplit}><Text style={styles.boldText}>COLLECTED</Text> {collectionStats.collected}</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVERAGE MONTHLY CONTRIBUTION</Text>
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statSuffix}>SACKS PER MONTH</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    color: '#ccc',
  },
  

  ratingRow: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingSection: {
    flexShrink: 1,
  },
  rating: {
    fontSize: 16,
    color: '#00FF66',
    marginVertical:2,
  },
  ratingLabel: {
    color: '#aaa',
    fontSize: 12,
    flexWrap: 'wrap',
  },
  polyWrapper: {
    alignItems: 'flex-end',
  },
  polyCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF66',
  },
  polyLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1A3620',
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  container: { flex: 1 },
  scrollContainer: { padding: 18 },
 
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#00FF66',
  },
  headerTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileLocation: {
    color: '#ccc',
    fontSize: 13,
  },
  memberSince: {
    color: '#aaa',
    fontSize: 12,
  },

 
  actionButton: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 5,
  },
  actionButtonTextMP: {
    color: '#fff',
    textAlign: 'left',
    fontWeight: 'regular',
  },
  actionButtonTextTH: {
    color: '#fff',
    textAlign: 'left',
    fontWeight: 'regular',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  allTimeStatsContainer: {
    backgroundColor: '#1A3620',
    borderRadius: 10,
    padding: 18,
    marginBottom:1,
  },
  statBox: {
    marginBottom:16,
    borderColor:'white'
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statSplit: {
    color: '#fff',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  statSuffix: {
    color: '#9CA3AF',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  logoutButton: {
    backgroundColor: '#1A3620',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;

