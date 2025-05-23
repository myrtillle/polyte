import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { leaderboardService } from '@/services/leaderboardService';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardEntry {
  name: string;
  totalValue: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'points' | 'weight'>('points');
  const [viewType, setViewType] = useState<'user' | 'purok'>('user');
  const [timeFilter, setTimeFilter] = useState<'ALL TIME' | 'THIS MONTH' | 'THIS YEAR' | 'THIS WEEK'>('ALL TIME');
  const [viewDropdownVisible, setViewDropdownVisible] = useState(false);
  const [timeDropdownVisible, setTimeDropdownVisible] = useState(false);

  const now = new Date();
  const formattedDate = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadLeaderboard();
  }, [viewType, activeMetric, timeFilter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = viewType === 'purok'
      ? await leaderboardService.fetchLeaderboardByPurok(timeFilter, activeMetric)
      : await leaderboardService.fetchLeaderboardByUsers(timeFilter, activeMetric);
    setLeaderboard(data);
    setLoading(false);
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.itemRow, index === 0 ? styles.topPurok : styles.regularPurok]}>
      <View style={styles.itemNameWrapper}>
        <Text style={[styles.purokName, index === 0 && styles.topText]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.itemPointsWrapper}>
        <Text style={[styles.points, index === 0 && styles.topscore]}>
          {activeMetric === 'points' 
            ? item.totalValue.toLocaleString() 
            : `${item.totalValue.toLocaleString()} kg`}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#023F0F', '#05A527']} style={styles.container}>
      {/* <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#ccc" style={{ marginLeft: 10 }} />
        <Text style={styles.searchPlaceholder}>PLASTIC, OBRERO USEP</Text>
        <Ionicons name="notifications" size={20} color="#00FF66" style={{ marginRight: 12 }} />
      </View> */}
      <View style={styles.headerBar}>
  <Text style={styles.headerTitle}>LEADERBOARDS</Text>
</View>

     
        <TouchableOpacity style={styles.dropdownBox} onPress={() => setViewDropdownVisible(true)}>
          <Image
            source={require('../../assets/images/trophy.png')}
            style={styles.dropdownTrophy}
            resizeMode="contain"
          />
          <View style={styles.dropdownLeft}>
            <Text style={styles.dropdownTitle}>
              {viewType === 'user' ? 'USER LEADER BOARDS' : 'PUROK LEADER BOARDS'}
            </Text>
            <Text style={styles.dropdownSubtitle}>As of {formattedDate}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="white" />
        </TouchableOpacity>

      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.tab, activeMetric === 'points' && styles.activeTab]}
          onPress={() => setActiveMetric('points')}
        >
          <Text style={[styles.tabText, activeMetric === 'points' && styles.activeTabText]}>POLY POINTS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeMetric === 'weight' && styles.activeTab]}
          onPress={() => setActiveMetric('weight')}
        >
          <Text style={[styles.tabText, activeMetric === 'weight' && styles.activeTabText]}>KG COLLECTED</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownFilter} onPress={() => setTimeDropdownVisible(true)}>
          <Text style={styles.dropdownText}>{timeFilter}</Text>
          <Ionicons name="chevron-down" size={16} color="white" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00FF66" style={{ marginTop: 40 }} />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hero recyclers for this time period!</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        />
      )}

      {/* View Dropdown */}
      <Modal transparent visible={viewDropdownVisible} animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setViewDropdownVisible(false)}>
          <View style={styles.modalDropdown}>
            {[
              { label: 'Users', value: 'user' },
              { label: 'Puroks', value: 'purok' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setViewType(option.value as 'user' | 'purok');
                  setViewDropdownVisible(false);
                }}
                style={[
                  styles.dropdownItem,
                  viewType === option.value && styles.dropdownItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownOption,
                    viewType === option.value && styles.dropdownOptionActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Filter Dropdown */}
      <Modal transparent visible={timeDropdownVisible} animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setTimeDropdownVisible(false)}>
          <View style={styles.modalDropdown}>
            {['All time', 'This month', 'This year', 'This week'].map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => {
                  setTimeFilter(range as any);
                  setTimeDropdownVisible(false);
                }}
                style={[
                  styles.dropdownItem,
                  timeFilter === range && styles.dropdownItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownOption,
                    timeFilter === range && styles.dropdownOptionActive,
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  dropdownBox: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 20,
    marginBottom: 12,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownLeft: {
    flex: 1,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  dropdownItemActive: {
    backgroundColor: '#E0FFE0',
  },

  dropdownOptionActive: {
    fontWeight: 'bold',
    color: '#023F0F',
  },

  itemNameWrapper: {
    flex: 1,
    paddingRight: 10,
  },

  itemPointsWrapper: {
    minWidth: 80,
    alignItems: 'flex-end',
  },

  dropdownTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    // textTransform: 'uppercase',
  },

  dropdownSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
  },

  sectionWrapper: {
    backgroundColor: '#1A3620',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 12,
  },

  container: { flex: 1, },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3620',
    position: 'relative',
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  searchBar: {
    backgroundColor: '#1A3620',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchPlaceholder: {
    color: '#ccc',
    flex: 1,
    paddingLeft: 10,
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {},

  headerSubtitle: {
    color: '#ccc',
    fontSize: 11,
  },
  filterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
  },
  tab: {
    backgroundColor: '#1A3620',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  tabText: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTab: {
    backgroundColor: '#00FF66',
  },
  activeTabText: {
    color: '#023F0F',
    fontWeight: 'bold',
  },
  dropdownFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 'auto',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemRow: {
    backgroundColor: '#1A3620',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  topPurok: {
    backgroundColor: '#D4FF6D', // bright highlight color
    borderWidth: 1.5,
    borderColor: '#D4FF6D',
    shadowColor: '#D4FF6D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },

  regularPurok: {
    backgroundColor: '#1A3620',
  },
  purokName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  points: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 13,
  },
  topText: {
    color: '#023F0F',
    fontWeight: 'bold',
    fontSize:18,
  
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 325,
    elevation: 5,
  },
  dropdownOption: {
    fontSize: 14,
    paddingVertical: 8,
    color: '#023F0F',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  dropdownTrophy: {
    width: 32,
    height: 32,
    marginRight: 12,
    marginLeft: 2,
  },
});