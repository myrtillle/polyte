import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { rewardsService } from '@/services/rewardsService';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList, RootStackParamList } from '../../types/navigation';

const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();    

export default function RedeemRewards() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return;
    const uid = user.user.id;
    setUserId(uid);

    const points = await rewardsService.fetchPolyPoints(uid);
    const rewardList = await rewardsService.fetchAvailableRewards(uid);
    const historyList = await rewardsService.fetchClaimHistory(uid);

    setAvailablePoints(points);
    setRewards(rewardList);
    setHistory(historyList);
    setLoading(false);
  };

  const handleRedeem = async () => {
    if (selectedReward.poly_points_required > availablePoints) {
      Alert.alert('Not enough points');
      return;
    }
    await rewardsService.submitClaim(userId, selectedReward.id);
    Alert.alert('Success', 'Wait for your barangay to approve your claim.');
    setModalVisible(false);
    loadData();
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Redeem Rewards</Text>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.rewardCard}
            onPress={() => {
              setSelectedReward(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.rewardTitle}>{item.reward_name}</Text>
            <Text style={styles.rewardPoints}>Cost: {item.poly_points_required} Polys</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No rewards available</Text>}
      />

      <Text style={styles.subHeader}>My Redemption History</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <Text style={styles.historyText}>{item.reward_name}</Text>
            <Text style={{ 
              color: item.status === 'approved' ? '#00FF66' : item.status === 'rejected' ? 'red' : '#ccc', 
              fontSize: 12 
            }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No redemption history</Text>}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedReward?.reward_name}</Text>
            <Text>{selectedReward?.reward_description}</Text>
            <Text>Cost: {selectedReward?.poly_points_required} Polys</Text>
            <Text>You have: {availablePoints} Polys</Text>

            <Button mode="contained" onPress={handleRedeem}>
              Redeem Reward
            </Button>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#023F0F' },
  header: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  subHeader: { color: 'white', fontSize: 16, fontWeight: '600', marginTop: 32 },
  rewardCard: {
    backgroundColor: '#1A3620',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  rewardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  rewardPoints: { color: '#ccc', marginTop: 4 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20 },
  historyCard: {
    backgroundColor: '#0F2514',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  historyText: { color: '#fff' },
  historyStatus: { color: '#0f0', fontSize: 12 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
