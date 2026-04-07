import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { role, adminRole } = useLocalSearchParams();



  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Manage your app preferences and system permissions.</Text>
          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/notification-settings')}>
            <Text style={styles.optionTitle}>Notification settings</Text>
            <Text style={styles.optionText}>Control alert preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/privacy')}>
            <Text style={styles.optionTitle}>Privacy</Text>
            <Text style={styles.optionText}>Manage your app permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={() => router.push('/help-support')}>
            <Text style={styles.optionTitle}>Help & Support</Text>
            <Text style={styles.optionText}>Contact support or view FAQ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  actionBtn: {
    marginBottom: 20,
  },
  optionItem: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  optionText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
