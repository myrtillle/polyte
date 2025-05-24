import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Transaction, transactionService } from '@/services/transactionService';
import { Offer } from '@/services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList, RootStackParamList } from '../../types/navigation';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Button, Divider, IconButton } from 'react-native-paper';
import { Image } from 'react-native';
import calendarIcon from '../../assets/images/calendar.png';


// type ViewTransactionRouteProp = RouteProp<RootStackParamList, 'ViewTransaction'>;
  



const TransacHist = () => {
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'TransacHist'>>();
  const initialTab = route.params?.initialTab;
  const [selectedTab, setSelectedTab] = useState(initialTab || 'Pending');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // const [loading, setLoading] = useState(true);
  const pendingCount = transactions.filter(t =>
    ['pending', 'for_collection', 'proof_uploaded', 'awaiting_payment', 'for_completion'].includes(t.status)
  ).length;
  
  const doneCount = transactions.filter(t => t.status === 'completed').length;
  const cancelledCount = transactions.filter(t => t.status === 'cancelled').length;
  
  const tabs = [
    { label: `PENDING (${pendingCount})`, key: 'Pending' },
    { label: `DONE (${doneCount})`, key: 'Done' },
    { label: `CANCELLED (${cancelledCount})`, key: 'Cancelled' },
  ];
  useEffect(() => {
    const fetchData = async () => {
      const data = await transactionService.fetchAllTransactions();
      setTransactions(data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  //
  const filtered = transactions.filter((t) => {
    if (selectedTab === 'Pending') return ['pending', 'for_collection', 'proof_uploaded', 'awaiting_payment', 'for_completion'].includes(t.status);
    if (selectedTab === 'Done') return t.status === 'completed';
    if (selectedTab === 'Cancelled') return t.status === 'cancelled';
    return false;
  });


  const renderCard = ({ item }: { item: Transaction }) => (
    
    <TouchableOpacity style={styles.card}onPress={() => profileNavigation.navigate('ViewTransaction', { offerId: item.id })}>
      <Text style={styles.statusTitle}>
        {item.status.replace(/_/g, ' ').toUpperCase()}
      </Text>
      <Text style={styles.items}>
        {item.offered_items?.join(', ')}
      </Text>
      <View style={styles.dateRow}>
      <Image source={calendarIcon} style={styles.dateIcon} />
      <Text style={styles.date}>
        {item.scheduled_date}   |   {item.scheduled_time}
      </Text>
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
          {/* <View style={styles.headerContainer}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor="white"
                onPress={() => {}}
                style={{ position: 'absolute', left: 0 }}
              />
              <Text style={styles.headerTitle}>TRANSACTION LIST</Text>
            </View> */}
          <View style={styles.tabWrapper}>
          {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, selectedTab === tab.key && styles.selectedTab]}
          onPress={() => setSelectedTab(tab.key)}
        >
          <Text style={selectedTab === tab.key ? styles.selectedText : styles.tabText}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}

    </View>


      {filtered.length === 0 ? (
        <Text style={{ color: '#ccc', textAlign: 'center', marginTop: 20 }}>
          No transactions found.
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.cardContainer}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({


  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1A3620',
    position: 'relative',
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  
    flexDirection: 'row',
    gap: 6,
  },
  
  
  tabContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  
  tab: {
    flex: 1,
    backgroundColor: '#1A3620',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  
  selectedTab: {
    backgroundColor: '#00FF66',
  },
  
  
  tabText: {
    color: '#FFFFFF',
    fontWeight: 'normal',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  
  selectedText: {
    color: '#023F0F',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  
  
  container: { flex: 1 },
  header: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 12,
    textAlign: 'center',
  },
 
  
  cardContainer: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#1A3620',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusTitle:{
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16
  },
  name: {
    color: '#ccc',
    fontWeight: '600',
    marginBottom: 4,
  },
  items: {
    color: '#aaa',
    fontSize: 12,
  },
  date: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
});

export default TransacHist;
