import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Transaction, transactionService } from '@/services/transactionService';
import { Offer } from '@/services/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

// type ViewTransactionRouteProp = RouteProp<RootStackParamList, 'ViewTransaction'>;
  
const tabs = ['Pending', 'Done', 'Cancelled'];

const TransacHist = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [selectedTab, setSelectedTab] = useState('Pending');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await transactionService.fetchAllTransactions();
      setTransactions(data || []);

      console.log('data: ', data);
    };
    fetchData();
  }, [selectedTab]);
  //
  const filtered = transactions.filter((t) => {
    if (selectedTab === 'Pending') return t.status === 'pending' || t.status === 'for_collection' || t.status === 'proof_uploaded' || t.status === 'awaiting_payment';
    if (selectedTab === 'Done') return t.status === 'completed';
    if (selectedTab === 'Cancelled') return t.status === 'cancelled';
    return false;
  });


  const renderCard = ({ item }: { item: Transaction }) => (
    
    <TouchableOpacity style={styles.card}onPress={() => navigation.navigate('ViewTransaction', { offerId: item.id })}>
      <Text style={styles.statusTitle}>
        {item.status.toUpperCase()}
      </Text>
      <Text style={styles.items}>
        {item.offered_items?.join(', ')}
      </Text>
      <Text style={styles.date}>
          📅 {item.scheduled_date} 🕒 {item.scheduled_time}
      </Text>

    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    > 
      <Text style={styles.header}>TRANSACTIONS</Text>
      <View style={styles.tabWrapper}>
       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.selectedTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={selectedTab === tab ? styles.selectedText : styles.tabText}>{tab.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  container: { flex: 1 },
  header: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 12,
    textAlign: 'center',
  },
  tabWrapper: {
    height: 50,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tab: {
    backgroundColor: '#1A3620',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  selectedTab: {
    backgroundColor: '#00D964',
  },
  tabText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cardContainer: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#1A3620',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
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
    fontSize: 20
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
