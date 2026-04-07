import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE } from '../../services/api';
import { Colors } from '../../constants/Colors';

export default function DriverScheduleScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  const handleBack = () => router.push({ pathname: '/home', params: { role, phone } });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="bus-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Upcoming Trips</Text>
          <Text style={styles.emptyDesc}>You are not assigned to any immediate trips. Check back later or contact dispatch.</Text>
        </View>

        <Text style={styles.sectionTitle}>Past Trips</Text>
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripDate}>Today, 8:00 AM</Text>
            <Text style={styles.tripStatus}>Completed</Text>
          </View>
          <Text style={styles.tripRoute}>Colombo <Ionicons name="arrow-forward" size={14} /> Kandy</Text>
          <Text style={styles.tripDetails}>Bus EX-2991 • 42 Passengers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 30,
  },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  emptyDesc: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  tripCard: {
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tripDate: { color: Colors.textMuted, fontSize: 12 },
  tripStatus: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
  tripRoute: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  tripDetails: { color: Colors.textMuted, fontSize: 13 },
});
