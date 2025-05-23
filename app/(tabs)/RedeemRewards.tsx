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
  ScrollView,
  Image,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { rewardsService } from '@/services/rewardsService';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList, RootStackParamList } from '../../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import polysSymbol from '../../assets/images/polys_symbol.png';

export default function RedeemRewards() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();  

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

    console.log(uid, points);
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
    try {
      await rewardsService.submitClaim(userId, selectedReward.id, selectedReward.poly_points_required);
      Alert.alert(
        'Claim Submitted',
        'Your reward claim has been submitted. Points will be deducted only after approval.',
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              loadData();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit claim');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const renderRewardCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.rewardCard}
      onPress={() => {
        setSelectedReward(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.rewardCardContent}>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>{item.reward_name}</Text>
          <Text style={styles.rewardDescription} numberOfLines={2}>
            {item.reward_description}
          </Text>
        </View>
        <View style={styles.pointsContainer}>
          <Image source={polysSymbol} style={{ width: 20, height: 20, resizeMode: 'contain', marginRight: 4 }} />
          <Text style={styles.rewardPoints}>{item.poly_points_required}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
  

      <ScrollView style={styles.scrollView}>
        {/* Points Display */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Image source={polysSymbol} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
            <Text style={styles.pointsTitle}>Available Polys</Text>
          </View>
          <Text style={styles.pointsValue}>{availablePoints}</Text>
          {/* <Text style={styles.pointsSubtext}>Total Polys</Text> */}
        </View>

        {/* Available Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <FlatList
            data={rewards}
            keyExtractor={(item) => item.id}
            renderItem={renderRewardCard}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rewards available</Text>
              </View>
            }
          />
        </View>

        {/* History Button */}
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setShowHistory(true)}
        >
          <MaterialIcons name="history" size={24} color="#fff" />
          <Text style={styles.historyButtonText}>View Redemption History</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Redemption Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedReward?.reward_name}</Text>
            <Text style={styles.modalDescription}>{selectedReward?.reward_description}</Text>
            
            <View style={styles.modalPointsContainer}>
              <View style={styles.modalPointsRow}>
                <Text style={styles.modalPointsLabel}>Cost:</Text>
                <View style={styles.modalPointsValue}>
                  <MaterialIcons name="stars" size={20} color="#00FF57" />
                  <Text style={styles.modalPointsText}>{selectedReward?.poly_points_required}</Text>
                </View>
              </View>
              <View style={styles.modalPointsRow}>
                <Text style={styles.modalPointsLabel}>Your Points:</Text>
                <View style={styles.modalPointsValue}>
                  <MaterialIcons name="stars" size={20} color="#00FF57" />
                  <Text style={styles.modalPointsText}>{availablePoints}</Text>
                </View>
              </View>
              {selectedReward?.poly_points_required > availablePoints && (
                <View style={styles.validationMessage}>
                  <MaterialIcons name="error-outline" size={16} color="#00FF66" />
                  <Text style={styles.validationText}>Insufficient points to redeem this reward</Text>
                </View>
              )}
            </View>

            <Button 
              mode="contained" 
              onPress={handleRedeem}
              style={[
                styles.redeemButton,
                selectedReward?.poly_points_required > availablePoints && styles.disabledButton
              ]}
              labelStyle={styles.redeemButtonLabel}
              disabled={selectedReward?.poly_points_required > availablePoints}
            >
              Redeem Reward
            </Button>
            <Button 
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.historyModalContent}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>Redemption History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyItemTitle}>{item.reward_name}</Text>
                    <Text style={[
                      styles.historyItemStatus,
                      { 
                        color: item.status === 'approved' ? '#00FF66' : 
                               item.status === 'rejected' ? '#FF4444' : '#FFD700',
                        backgroundColor: item.status === 'approved' ? '#0F2514' :
                                       item.status === 'rejected' ? '#251414' : '#1A3620'
                      }
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.historyItemDescription} numberOfLines={2}>
                    {item.reward_description}
                  </Text>
                  <View style={styles.historyItemFooter}>
                    <View style={styles.historyItemPoints}>
                      <Image source={polysSymbol} style={{ width: 16, height: 16, resizeMode: 'contain', marginRight: 4 }} />
                      <Text style={styles.historyItemPointsText}>{item.points_spent} Polys</Text>
                    </View>
                    <Text style={styles.historyItemDate}>
                      {new Date(item.claimed_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No redemption history</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3620',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  pointsCard: {
    backgroundColor: '#1A3620',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  pointsValue: {
    color: '#00FF57',
    fontSize: 48,
    fontWeight: 'bold',
  },
  pointsSubtext: {
    color: '#ccc',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  rewardCard: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  rewardCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginRight: 16,
  },
  rewardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardDescription: {
    color: '#ccc',
    fontSize: 14,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2514',
    padding: 8,
    borderRadius: 8,
  },
  rewardPoints: {
    color: '#00FF57',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3620',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A3620',
    padding: 24,
    borderRadius: 16,
    width: '85%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
  },
  modalPointsContainer: {
    backgroundColor: '#0F2514',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPointsLabel: {
    color: '#fff',
    fontSize: 16,
  },
  modalPointsValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPointsText: {
    color: '#00FF57',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  redeemButton: {
    backgroundColor: '#FFD700',
    marginBottom: 12,
  },
  redeemButtonLabel: {
    color: '#023F0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonLabel: {
    color: '#fff',
  },
  historyModalContent: {
    backgroundColor: '#1A3620',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#0F2514',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  historyItemStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyItemDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  historyItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemPointsText: {
    color: '#00FF57',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  historyItemDate: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2514',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  validationText: {
    color: '#00FF66',
    fontSize: 14,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
});
