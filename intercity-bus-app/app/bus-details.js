import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';

export default function BusDetailsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bus Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroSection}>
          <View style={styles.imagePlaceholder}>
             <Ionicons name="bus" size={80} color={Colors.primary} />
          </View>
          <View style={styles.heroOverlay}>
             <View style={styles.serviceBadge}><Text style={styles.serviceText}>PREMIUM SERVICE</Text></View>
             <Text style={styles.heroTitle}>Luxury AC Coach</Text>
          </View>
        </View>

        <View style={styles.amenitiesRow}>
          <View style={styles.amenityCard}>
             <Ionicons name="wifi" size={24} color={Colors.primary} />
             <Text style={styles.amenityText}>Free WiFi</Text>
          </View>
          <View style={styles.amenityCard}>
             <Ionicons name="flash" size={24} color={Colors.primary} />
             <Text style={styles.amenityText}>Charging</Text>
          </View>
          <View style={styles.amenityCard}>
             <Ionicons name="snow" size={24} color={Colors.primary} />
             <Text style={styles.amenityText}>Full AC</Text>
          </View>
        </View>

        <View style={styles.capacityRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <Ionicons name="people" size={24} color={Colors.primary} style={{ marginRight: 15 }} />
             <View>
               <Text style={styles.infoLabel}>Seating Capacity</Text>
               <Text style={styles.infoValue}>Spacious 2+2 layout</Text>
             </View>
          </View>
          <Text style={styles.capacityNumber}>45 Seats</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Operational Days</Text>
          </View>
          
          <View style={styles.daysRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} style={styles.dayChipActive}><Text style={styles.dayTextActive}>{day}</Text></View>
            ))}
            <View style={styles.dayChipInactive}><Text style={styles.dayTextInactive}>Sun</Text></View>
          </View>
          <Text style={styles.footerText}>Available on weekdays only for corporate routes.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>License &amp; Insurance</Text>
          </View>
          
          <View style={styles.licenseCard}>
            <View style={styles.licenseRow}>
              <View>
                <Text style={styles.infoLabel}>LICENSE PLATE</Text>
                <Text style={styles.plateText}>WP ND-4521</Text>
              </View>
              <Ionicons name="document-text-outline" size={24} color={Colors.textMuted} />
            </View>
            <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 15 }} />
            <View style={styles.licenseRow}>
              <View>
                <Text style={styles.infoLabel}>EXPIRY DATE</Text>
                <Text style={styles.infoValue}>Dec 15, 2025</Text>
              </View>
            </View>
          </View>

          <View style={styles.insuranceCard}>
             <Text style={styles.infoLabel}>INSURANCE POLICY</Text>
             <View style={styles.infoRowSpace}><Text style={styles.infoMuted}>Provider</Text><Text style={styles.infoWhite}>Alliance Global Insurance</Text></View>
             <View style={styles.infoRowSpace}><Text style={styles.infoMuted}>Policy No.</Text><Text style={styles.infoWhite}>AGI - 8829 - X01</Text></View>
             <View style={styles.infoRowSpace}><Text style={styles.infoMuted}>Expiry</Text><Text style={styles.infoYellow}>Oct 20, 2025</Text></View>
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
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  heroSection: {
    height: 200,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: { alignItems: 'center', opacity: 0.5 },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  serviceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  serviceText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  amenitiesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  amenityCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  amenityText: { color: Colors.textMuted, fontSize: 12, marginTop: 10 },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  infoLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  infoValue: { color: Colors.textMuted, fontSize: 12 },
  capacityNumber: { color: Colors.primary, fontSize: 20, fontWeight: 'bold' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  dayChipActive: { backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  dayTextActive: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  dayChipInactive: { backgroundColor: '#333', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  dayTextInactive: { color: Colors.textMuted, fontWeight: 'bold', fontSize: 12 },
  footerText: { color: Colors.textMuted, fontSize: 12 },
  licenseCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  licenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plateText: { color: '#FFD700', fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  insuranceCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 },
  infoRowSpace: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  infoMuted: { color: Colors.textMuted, fontSize: 14 },
  infoWhite: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  infoYellow: { color: Colors.primary, fontSize: 14, fontWeight: 'bold' },
});
