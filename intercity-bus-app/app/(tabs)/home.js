import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import DriverDashboard from "../../components/DriverDashboard";

export default function ActiveTripScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  const isDriver = role === 'driver';
  const [isHoldingSOS, setIsHoldingSOS] = useState(false);

  if (isDriver) {
    return <DriverDashboard />;
  }

  const navigateToSOS = () => {
    try {
      router.push({ pathname: '/sos', params: { role, phone } });
    } catch (error) {
      console.error('SOS navigation failed:', error);
    }
  };

  const startSOSHold = () => {
    setIsHoldingSOS(true);
  };

  const cancelSOSHold = () => {
    setIsHoldingSOS(false);
  };

  const handleSOSLongPress = () => {
    setIsHoldingSOS(false);
    navigateToSOS();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Trip</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="notifications" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.mapContainer}>
          <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE TRIP TRACKING</Text></View>
          <Ionicons name="map-outline" size={80} color="#333" />
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripCardHeader}>
            <View style={styles.currentTripBadge}><Text style={styles.currentTripText}>CURRENT TRIP</Text></View>
            <View style={styles.busIdBadge}><Text style={styles.busIdText}>EX1-10</Text></View>
          </View>
          
          <View style={styles.tripInfoRow}>
            <View>
              <Text style={styles.routeText}>Negombo <Ionicons name="arrow-forward" size={16} /> Kaduwela</Text>
              <Text style={styles.statusText}>In Transit</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.etaText}>15 <Text style={{ fontSize: 14 }}>mins</Text></Text>
              <Text style={styles.etaSub}>TO KADAWATHA</Text>
            </View>
          </View>

          <View style={styles.nextStopRow}>
            <View style={styles.iconCircle}><Ionicons name="location" size={16} color={Colors.primary} /></View>
            <View>
              <Text style={styles.nextStopLabel}>NEXT STOP</Text>
              <Text style={styles.nextStopName}>Kadawatha Interchange</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.sosButton,
                styles.flexBtn,
                pressed && styles.sosButtonPressed,
              ]}
              onPressIn={startSOSHold}
              onPressOut={cancelSOSHold}
              onLongPress={handleSOSLongPress}
              delayLongPress={3000}
            >
              <View style={styles.sosButtonContent}>
                <Ionicons name="alert-circle" size={20} color="#FFF" />
                <Text style={styles.sosButtonText}>
                  {isHoldingSOS ? 'Hold 3 seconds...' : 'EMERGENCY'}
                </Text>
              </View>
            </Pressable>
            <View style={{ width: 10 }} />
            <Button 
              title={isDriver ? 'MAINTENANCE' : 'BUS DETAILS'} 
              style={styles.flexBtn} 
              onPress={() => router.push({ pathname: isDriver ? '/maintenance' : '/bus-details', params: { role, phone } })}
            />
          </View>

          <View style={styles.ticketRow}>
             <Button title="TRIP TICKET" style={{ flex: 1, marginRight: 10 }} />
             <TouchableOpacity style={styles.shareBtn}>
               <Ionicons name="share-social-outline" size={24} color="#FFF" />
             </TouchableOpacity>
          </View>
        </View>


        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Routes</Text>
          <Text style={styles.manageLink}>Manage</Text>
        </View>

        <View style={styles.savedRoutesRow}>
          <View style={styles.savedRouteCard}>
             <Ionicons name="home" size={24} color={Colors.primary} />
             <Text style={styles.savedRouteTitle}>To Home</Text>
             <Text style={styles.savedRouteSub}>138 Route</Text>
          </View>
          <View style={styles.savedRouteCard}>
             <Ionicons name="briefcase" size={24} color={Colors.textMuted} />
             <Text style={styles.savedRouteTitle}>To Work</Text>
             <Text style={styles.savedRouteSub}>120 Route</Text>
          </View>
          <View style={styles.savedRouteCard}>
             <Ionicons name="star" size={24} color={Colors.textMuted} />
             <Text style={styles.savedRouteTitle}>Frequent</Text>
             <Text style={styles.savedRouteSub}>177 Route</Text>
          </View>
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
  headerBtn: { padding: 5, backgroundColor: Colors.card, borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  mapContainer: {
    height: 200,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 1,
  },
  liveText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold' },
  tripCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  tripCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  currentTripBadge: { backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  currentTripText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold' },
  busIdBadge: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  busIdText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  tripInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  routeText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statusText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
  etaText: { color: '#FFF', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
  etaSub: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1 },
  nextStopRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', padding: 15, borderRadius: 12, marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 193, 7, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nextStopLabel: { color: Colors.textMuted, fontSize: 10, marginBottom: 2 },
  nextStopName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  flexBtn: { flex: 1, marginVertical: 0, minWidth: 120 },
  sosButton: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    minWidth: 140,
    paddingHorizontal: 16,
  },
  sosButtonPressed: {
    opacity: 0.8,
  },
  emergencySection: {
    backgroundColor: '#171717',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  emergencyHeader: {
    marginBottom: 14,
  },
  emergencyNote: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  emergencyBody: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
  },
  emergencyText: {
    color: '#E0E0E0',
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
  },
  openSosButton: {
    alignSelf: 'stretch',
  },
  sosButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  shareBtn: { backgroundColor: '#333', width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  manageLink: { color: Colors.primary, fontSize: 14 },
  savedRoutesRow: { flexDirection: 'row', justifyContent: 'space-between' },
  savedRouteCard: { flex: 1, backgroundColor: Colors.card, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  savedRouteTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  savedRouteSub: { color: Colors.textMuted, fontSize: 12 },
});
