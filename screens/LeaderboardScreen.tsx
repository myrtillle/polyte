import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Title, Card, Text, SegmentedButtons } from 'react-native-paper';
import { supabase } from '../services/supabase';

type TimeFilter = 'Weekly' | 'Monthly' | 'Yearly' | 'All-time';
type RankingType = 'Individual' | 'Purok';

interface LeaderboardEntry {
  rank: number;
  name: string;
  total_polys: number;
  weight_contribution: number;
}

export default function LeaderboardScreen() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Monthly');
  const [rankingType, setRankingType] = useState<RankingType>('Individual');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter, rankingType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          users:user_id (first_name, last_name)
        `)
        .order('total_polys', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = data.map((entry, index) => ({
        rank: index + 1,
        name: `${entry.users.first_name} ${entry.users.last_name}`,
        total_polys: entry.total_polys,
        weight_contribution: entry.weight_contribution,
      }));

      setLeaderboard(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.rank}>#{item.rank}</Text>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>Polys: {item.total_polys}</Text>
          <Text>{item.weight_contribution} kg</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Leaderboard</Title>

      <SegmentedButtons
        value={rankingType}
        onValueChange={setRankingType}
        buttons={[
          { label: 'Individual', value: 'Individual' },
          { label: 'Purok', value: 'Purok' },
        ]}
        style={styles.segment}
      />

      <SegmentedButtons
        value={timeFilter}
        onValueChange={setTimeFilter}
        buttons={[
          { label: 'Weekly', value: 'Weekly' },
          { label: 'Monthly', value: 'Monthly' },
          { label: 'Yearly', value: 'Yearly' },
          { label: 'All-time', value: 'All-time' },
        ]}
        style={styles.segment}
      />

      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardEntry}
        keyExtractor={(item) => item.rank.toString()}
        refreshing={loading}
        onRefresh={fetchLeaderboard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  segment: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 