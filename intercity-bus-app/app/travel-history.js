import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function TravelHistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel History</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.tripCard}>
          <View style={styles.tripDateRow}>
            <Text style={styles.tripDate}>Today, 10:30 AM</Text>
            <Text style={styles.tripPrice}>$4.50</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.locationText}>Central Station</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#A0A0A0" />
            <Text style={styles.locationText}>University Campus</Text>
          </View>
          <Text style={styles.statusCompleted}>Completed • Bus #104</Text>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripDateRow}>
            <Text style={styles.tripDate}>Yesterday, 05:15 PM</Text>
            <Text style={styles.tripPrice}>$3.00</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.locationText}>Downtown City Hub</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#A0A0A0" />
            <Text style={styles.locationText}>North Side Terminal</Text>
          </View>
          <Text style={styles.statusCompleted}>Completed • Bus #202</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  container: { padding: 20 },
  tripCard: { backgroundColor: '#181818', borderRadius: 16, padding: 20, marginBottom: 15 },
  tripDateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  tripDate: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  tripPrice: { color: Colors.primary, fontSize: 15, fontWeight: 'bold' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { color: '#E0E0E0', fontSize: 14, marginLeft: 10 },
  routeLine: { width: 1, height: 15, backgroundColor: '#333', marginLeft: 8, marginVertical: 4 },
  statusCompleted: { color: '#4CAF50', fontSize: 13, marginTop: 15, fontWeight: '600' }
});
