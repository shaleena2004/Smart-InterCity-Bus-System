import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';
import { API_BASE } from "../services/api";

const VEHICLE_ID = 'bus-8824';

export default function MaintenanceHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/maintenance/history?vehicleId=${encodeURIComponent(VEHICLE_ID)}`);
      if (!response.ok) {
        throw new Error('Unable to load maintenance history');
      }
      const data = await response.json();
      setHistory(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance History</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Vehicle</Text>
          <Text style={styles.summaryValue}>{history?.busNumber ? `Bus #${history.busNumber}` : 'Loading...'}</Text>
          <Text style={styles.summarySub}>{history?.vehicleId || ''}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task History</Text>
          {history?.tasks?.length ? (
            <FlatList
              data={history.tasks}
              keyExtractor={(task) => task._id}
              renderItem={({ item: task }) => (
                <View style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{task.title}</Text>
                    <Text style={[styles.cardBadge, task.priority === 'high' ? styles.badgeDanger : task.priority === 'medium' ? styles.badgeWarning : styles.badgeSuccess]}>
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.cardText}>{task.description}</Text>
                  <Text style={styles.cardMeta}>Status: {task.status}</Text>
                  <Text style={styles.cardMeta}>Due: {task.dueInKm != null ? `${task.dueInKm} km` : task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>{loading ? 'Loading tasks…' : 'No task history available.'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Logs</Text>
          {history?.logs?.length ? (
            <FlatList
              data={history.logs}
              keyExtractor={(log, index) => log.id || `${log.title}-${index}`}
              renderItem={({ item: log }) => (
                <View style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{log.title}</Text>
                    <Text style={styles.cardMeta}>{new Date(log.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.cardText}>{log.detail}</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>{loading ? 'Loading logs…' : 'No activity logs found.'}</Text>
          )}
        </View>

        <Button title="Refresh History" style={{ marginTop: 20, marginBottom: 40 }} onPress={fetchHistory} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', paddingRight: 34 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  errorCard: { backgroundColor: '#631515', borderRadius: 16, padding: 15, marginBottom: 20 },
  errorText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  summaryCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#333' },
  summaryTitle: { color: Colors.textMuted, fontSize: 12, marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  summarySub: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  section: { marginBottom: 25 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  historyCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardBadge: { color: '#000', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDanger: { backgroundColor: '#ff9a9a' },
  badgeWarning: { backgroundColor: '#ffd27f' },
  badgeSuccess: { backgroundColor: '#90ee90' },
  cardText: { color: Colors.textMuted, fontSize: 14, lineHeight: 20 },
  cardMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});