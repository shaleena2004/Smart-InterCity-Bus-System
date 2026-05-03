import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBuses } from '../services/api';

export default function BusDetailsScreen() {
  const router = useRouter();
  const { busNumber, route } = useLocalSearchParams();
  const [bus, setBus] = useState(null);
  const [allBuses, setAllBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusDetails();
  }, [busNumber, route]);

  const fetchBusDetails = async () => {
    try {
      const res = await getBuses();
      const buses = res.data || [];
      setAllBuses(buses);

      let found = null;
      if (busNumber && busNumber !== 'undefined') {
        // Match by bus number
        found = buses.find(b => b.busNumber === busNumber);
      }
      if (!found && buses.length > 0) {
        // Fallback: show the first active bus
        found = buses.find(b => b.status === 'active') || buses[0];
      }
      setBus(found || null);
    } catch (err) {
      console.error('Bus details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#FFC107" size="large" /></View>;

  if (!bus) return (
    <View style={styles.center}>
      <Text style={{color:'#fff', fontSize:18}}>Bus details not found for {busNumber || 'Unknown'}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{marginTop:20, padding: 12, backgroundColor: '#232940', borderRadius: 8}}>
        <Text style={{color:'#FFC107'}}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Details</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.card}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <Text style={{color:'#FFC107', fontSize:24, fontWeight:'bold'}}>{bus.busNumber}</Text>
          <View style={[styles.badge, {backgroundColor: bus.status === 'active' ? '#4ade8020' : '#f1466820'}]}>
            <Text style={{color: bus.status === 'active' ? '#4ade80' : '#f14668', fontWeight:'bold'}}>{(bus.status || 'Unknown').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Plate Number</Text>
          <Text style={styles.value}>{bus.plateNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{bus.busType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Seats</Text>
          <Text style={styles.value}>{bus.seatCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Brand / Model</Text>
          <Text style={styles.value}>{bus.brand || 'N/A'} {bus.model || ''}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Amenities</Text>
      <View style={styles.amenitiesGrid}>
        <View style={[styles.amenityBox, bus.amenities?.wifi && styles.amenityActive]}>
          <Ionicons name="wifi" size={24} color={bus.amenities?.wifi ? '#FFC107' : '#8690A9'} />
          <Text style={{color: bus.amenities?.wifi ? '#fff' : '#8690A9', marginTop:8}}>Wi-Fi</Text>
        </View>
        <View style={[styles.amenityBox, bus.amenities?.ac && styles.amenityActive]}>
          <Ionicons name="snow" size={24} color={bus.amenities?.ac ? '#FFC107' : '#8690A9'} />
          <Text style={{color: bus.amenities?.ac ? '#fff' : '#8690A9', marginTop:8}}>A/C</Text>
        </View>
        <View style={[styles.amenityBox, bus.amenities?.charging && styles.amenityActive]}>
          <Ionicons name="battery-charging" size={24} color={bus.amenities?.charging ? '#FFC107' : '#8690A9'} />
          <Text style={{color: bus.amenities?.charging ? '#fff' : '#8690A9', marginTop:8}}>Charging</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', padding: 20 },
  center: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, marginTop: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  card: { backgroundColor: '#141926', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#232940', marginBottom: 24 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#232940', paddingBottom: 12 },
  label: { color: '#8690A9', fontSize: 14 },
  value: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  amenitiesGrid: { flexDirection: 'row', gap: 12 },
  amenityBox: { flex: 1, backgroundColor: '#141926', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#232940' },
  amenityActive: { borderColor: '#FFC107' }
});
