import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function PrivacyScreen() {
  const router = useRouter();
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Location Access</Text>
              <Text style={styles.optionText}>Allow app to use your location</Text>
            </View>
            <Switch value={locationEnabled} onValueChange={setLocationEnabled} trackColor={{ false: '#3e3e3e', true: Colors.primary }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Share Analytics</Text>
              <Text style={styles.optionText}>Help us improve the app</Text>
            </View>
            <Switch value={analyticsEnabled} onValueChange={setAnalyticsEnabled} trackColor={{ false: '#3e3e3e', true: Colors.primary }} />
          </View>
        </View>

        <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL('https://example.com/privacy')}>
          <Text style={styles.linkText}>Read Privacy Policy</Text>
          <Ionicons name="open-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
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
  card: { backgroundColor: '#181818', borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { color: Colors.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  optionText: { color: '#A0A0A0', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#333' },
  linkCard: { backgroundColor: '#181818', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: '#FFF', fontSize: 16 }
});
