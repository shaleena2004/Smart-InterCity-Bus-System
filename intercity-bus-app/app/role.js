import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('passenger');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="bus" size={24} color="#000" />
          </View>
          <Text style={styles.appName}>BOOK&amp;GO</Text>
          <Text style={styles.subtext}>IDENTIFICATION</Text>
        </View>

        <Text style={styles.title}>How will you be using the app?</Text>

        <TouchableOpacity 
          style={[styles.card, selectedRole === 'passenger' && styles.cardSelected]}
          onPress={() => setSelectedRole('passenger')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="people" size={24} color={selectedRole === 'passenger' ? '#000' : Colors.text} />
            </View>
            {selectedRole === 'passenger' && <Ionicons name="checkmark-circle" size={24} color="#000" />}
          </View>
          <Text style={[styles.cardTitle, selectedRole === 'passenger' && { color: '#000' }]}>I am a Passenger</Text>
          <Text style={[styles.cardDesc, selectedRole === 'passenger' && { color: '#333' }]}>
            Find bus routes, live locations, and schedules for your daily commute.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, selectedRole === 'driver' && styles.cardSelected]}
          onPress={() => setSelectedRole('driver')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="car" size={24} color={selectedRole === 'driver' ? '#000' : Colors.text} />
            </View>
            {selectedRole === 'driver' && <Ionicons name="checkmark-circle" size={24} color="#000" />}
          </View>
          <Text style={[styles.cardTitle, selectedRole === 'driver' && { color: '#000' }]}>I am a Driver</Text>
          <Text style={[styles.cardDesc, selectedRole === 'driver' && { color: '#333' }]}>
            Share your live location, manage your trips, and view passenger stats.
          </Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Button 
            title="Continue" 
            onPress={() => router.push({ pathname: '/login', params: { role: selectedRole } })} 
          />
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push({ pathname: '/login', params: { role: selectedRole } })}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Login</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminLink} onPress={() => router.push({ pathname: '/admin-entry' })}>
            <Text style={styles.adminLinkText}>Staff/Admin access</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subtext: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 15,
  },
  adminLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  adminLinkText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loginText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  loginBold: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
