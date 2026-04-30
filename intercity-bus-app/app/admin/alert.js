import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { API_BASE } from "../../services/api";

export default function AdminAlertScreen() {
  const router = useRouter();
  const { alertRole, adminType } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = alertRole === 'driver' ? 'driver' : 'passenger';
    const endpoint = role === 'driver' ? '/drivers' : '/passengers';

    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load alert details.');
        }
        setDetails((data[role === 'driver' ? 'drivers' : 'passengers'] || [])[0] || null);
      } catch (err) {
        setError(err.message || 'Unable to load alert details.');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [alertRole]);

  const roleTitle = alertRole === 'driver' ? 'Driver' : 'Passenger';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/admin', params: { adminType } })} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Alert Details</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.alertInfo}>
          <Ionicons name="alert-circle" size={32} color={Colors.primary} />
          <Text style={styles.alertHeading}>Incoming {roleTitle} Alert</Text>
          <Text style={styles.alertSubtext}>The latest alert has been delivered automatically.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !details ? (
          <Text style={styles.emptyText}>No {roleTitle.toLowerCase()} details are available right now.</Text>
        ) : (
          <View style={styles.detailCard}>
            <Text style={styles.cardLabel}>Name</Text>
            <Text style={styles.cardValue}>{details.name || details.username || 'Unknown'}</Text>
            <Text style={styles.cardLabel}>Role</Text>
            <Text style={styles.cardValue}>{details.role || roleTitle.toLowerCase()}</Text>
            <Text style={styles.cardLabel}>Phone</Text>
            <Text style={styles.cardValue}>{details.phone || 'Not provided'}</Text>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>{details.email || 'Not provided'}</Text>
            <Text style={styles.cardLabel}>Username</Text>
            <Text style={styles.cardValue}>{details.username || '-'}</Text>
            <Text style={styles.cardLabel}>Admin Type</Text>
            <Text style={styles.cardValue}>{details.adminType ? details.adminType.replace(/-/g, ' ') : 'N/A'}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/admin', params: { adminType } })}>
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => alert('Call function not implemented yet')}>
            <Text style={styles.secondaryButtonText}>Call {roleTitle}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 32, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  alertInfo: { backgroundColor: '#1f1f1f', borderRadius: 22, padding: 20, alignItems: 'center' },
  alertHeading: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 12 },
  alertSubtext: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  detailCard: { backgroundColor: Colors.card, borderRadius: 22, padding: 20, marginTop: 22 },
  cardLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 16 },
  cardValue: { color: '#FFF', fontSize: 16, marginTop: 6 },
  actionRow: { marginTop: 28, flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#000', fontWeight: '700' },
  secondaryButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: Colors.primary, fontWeight: '700' },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 20, textAlign: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginTop: 20, textAlign: 'center' },
});
