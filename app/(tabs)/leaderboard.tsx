import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { leaderboardService } from '@/services/leaderboardService';
import { Ionicons } from '@expo/vector-icons';

interface LeaderboardEntry {
  name: string;
  totalPoints: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'BY_DONATIONS'>('ALL');
  const [viewType, setViewType] = useState<'user' | 'purok'>('user');
  const [timeFilter, setTimeFilter] = useState<'ALL TIME' | 'THIS MONTH' | 'THIS YEAR' | 'THIS WEEK'>('ALL TIME');
  const [viewDropdownVisible, setViewDropdownVisible] = useState(false);
  const [timeDropdownVisible, setTimeDropdownVisible] = useState(false);

  const now = new Date();
  const formattedDate = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      const data = viewType === 'purok'
        ? await leaderboardService.fetchLeaderboardByPurok(timeFilter)
        : await leaderboardService.fetchLeaderboardByUsers(timeFilter);
      setLeaderboard(data);
      setLoading(false);
    };

    loadLeaderboard();
  }, [viewType]);


  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.itemRow, index === 0 ? styles.topPurok : styles.regularPurok]}>
      <Text style={[styles.purokName, index === 0 && styles.topText]}>{item.name}</Text>
      <Text style={[styles.points, index === 0 && styles.topText]}>{item.totalPoints.toLocaleString()}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#023F0F', '#05A527']} style={styles.container}>
      {/* <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#ccc" style={{ marginLeft: 10 }} />
        <Text style={styles.searchPlaceholder}>PLASTIC, OBRERO USEP</Text>
        <Ionicons name="notifications" size={20} color="#00FF66" style={{ marginRight: 12 }} />
      </View> */}
      <View style={{backgroundColor: '#1A3620', marginTop: 0, padding: 4, height: 60, }}>
        <Text style={{ fontSize: 18, color: 'white', marginBottom: 20, textAlign: 'center', fontWeight: 'bold' }}>LEADERBOARDS</Text>
      </View>

      <TouchableOpacity style={styles.headerWrapper} onPress={() => setViewDropdownVisible(true)}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {viewType === 'user' ? 'USER LEADERBOARDS' : 'PUROK LEADERBOARDS'}
          </Text>
          <Text style={styles.headerSubtitle}>As of {formattedDate}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="white" />
      </TouchableOpacity>

      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'ALL' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>ALL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'BY_DONATIONS' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'BY_DONATIONS' && styles.activeTabText]}>BY DONATIONS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dropdownFilter} onPress={() => setTimeDropdownVisible(true)}>
          <Text style={styles.dropdownText}>{timeFilter}</Text>
          <Ionicons name="chevron-down" size={16} color="white" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00FF66" style={{ marginTop: 40 }} />
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
            <TouchableOpacity onPress={() => { setViewType('user'); setViewDropdownVisible(false); }}>
              <Text style={styles.dropdownOption}>USER LEADERBOARDS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setViewType('purok'); setViewDropdownVisible(false); }}>
              <Text style={styles.dropdownOption}>PUROK LEADERBOARDS</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Filter Dropdown */}
      <Modal transparent visible={timeDropdownVisible} animationType="fade">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setTimeDropdownVisible(false)}>
          <View style={styles.modalDropdown}>
            {['ALL TIME', 'THIS MONTH', 'THIS YEAR', 'THIS WEEK'].map((range) => (
              <TouchableOpacity key={range} onPress={() => { setTimeFilter(range as any); setTimeDropdownVisible(false); }}>
                <Text style={styles.dropdownOption}>{range}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
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
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
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
    paddingHorizontal: 16,
    borderRadius: 20,
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
    borderRadius: 20,
    marginLeft: 'auto',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemRow: {
    backgroundColor: '#1A3620',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topPurok: {
    backgroundColor: '#A0C84B',
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
    color: '#1A3620',
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
    minWidth: 200,
    elevation: 5,
  },
  dropdownOption: {
    fontSize: 14,
    paddingVertical: 8,
    color: '#023F0F',
  },
});