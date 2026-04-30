import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Push Notifications</Text>
              <Text style={styles.optionText}>Receive alerts on your device</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: '#3e3e3e', true: Colors.primary }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Email Notifications</Text>
              <Text style={styles.optionText}>Receive updates via email</Text>
            </View>
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: '#3e3e3e', true: Colors.primary }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>SMS Notifications</Text>
              <Text style={styles.optionText}>Receive alerts via text message</Text>
            </View>
            <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ false: '#3e3e3e', true: Colors.primary }} />
          </View>
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
  card: { backgroundColor: '#181818', borderRadius: 16, padding: 16 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  optionTitle: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  optionText: { color: '#A0A0A0', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#333' }
});
