import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { Report, ReportStatus, getReports, updateReportStatus } from '../../services/reports';
import { useAuth } from '../../contexts/AuthContext';

export default function ModerationScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const loadReports = React.useCallback(async () => {
    try {
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    try {
      setUpdating(reportId);
      const updatedReport = await updateReportStatus(reportId, status);
      setReports(prev => 
        prev.map(r => r.id === reportId ? updatedReport : r)
      );
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return '#FFA000';
      case 'investigating': return '#1976D2';
      case 'resolved': return '#43A047';
      case 'dismissed': return '#757575';
      default: return '#757575';
    }
  };

  const handleViewContent = (report: Report) => {
    switch (report.type) {
      case 'request':
        router.push({
          pathname: '/(tabs)/request-details',
          params: { id: report.content_id }
        });
        break;
      case 'user':
        router.push({
          pathname: '/(tabs)/profile',
          params: { id: report.reported_id }
        });
        break;
      // Add other content type navigation
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={({ item: report }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Chip 
                  mode="flat"
                  textStyle={{ color: 'white' }}
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  {report.status}
                </Chip>
                <Text variant="bodySmall">
                  {new Date(report.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Text variant="titleMedium" style={styles.type}>
                {report.type.toUpperCase()}
              </Text>
              
              <Text variant="bodyLarge" style={styles.reason}>
                {report.reason}
              </Text>

              {report.details && (
                <Text variant="bodyMedium" style={styles.details}>
                  {report.details}
                </Text>
              )}

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => handleViewContent(report)}
                >
                  View Content
                </Button>
                {report.status === 'pending' && (
                  <>
                    <Button
                      mode="contained"
                      loading={updating === report.id}
                      onPress={() => handleStatusUpdate(report.id, 'investigating')}
                    >
                      Investigate
                    </Button>
                    <Button
                      mode="outlined"
                      loading={updating === report.id}
                      onPress={() => handleStatusUpdate(report.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                  </>
                )}
                {report.status === 'investigating' && (
                  <Button
                    mode="contained"
                    loading={updating === report.id}
                    onPress={() => handleStatusUpdate(report.id, 'resolved')}
                  >
                    Mark Resolved
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No reports to review</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    marginBottom: 4,
  },
  reason: {
    marginBottom: 8,
  },
  details: {
    opacity: 0.7,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
}); 