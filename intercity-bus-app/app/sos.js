import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';

export default function SOSScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(5);

  const handleCancel = () => {
    if (role) {
      router.replace({ pathname: '/home', params: { role, phone } });
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
           <Ionicons name="alert-circle" size={32} color="#FFF" />
           <Text style={styles.headerTitle}>SOS</Text>
           <TouchableOpacity style={styles.cancelHeaderBtn} onPress={handleCancel}>
             <Text style={styles.cancelHeaderText}>Cancel</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.alertingText}>
            {countdown > 0 ? `Alerting in 0${countdown}...` : 'Alert Sent!'}
          </Text>
          
          <View style={[styles.countdownCircle, countdown === 0 && { borderColor: Colors.success, shadowColor: Colors.success }]}>
            <Text style={styles.countdownNumber}>
              {countdown > 0 ? `0${countdown}` : '✓'}
            </Text>
            <Text style={[styles.countdownLabel, countdown === 0 && { color: Colors.success }]}>
              {countdown > 0 ? 'SECONDS' : 'SUCCESS'}
            </Text>
          </View>

          <Text style={styles.descText}>
            {countdown > 0 
              ? 'Sending your location to Highway Police and Emergency Contacts' 
              : 'Your location and details have been securely transmitted.'}
          </Text>

          {countdown > 0 && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footerRow}>
           <Button 
             title="Call 119" 
             type="danger" 
             style={styles.actionBtn}
             onPress={() => handleCall('119')}
           />
           <Button 
             title="Highway Patrol" 
             type="danger" 
             style={{ ...styles.actionBtn, marginLeft: 10 }}
             onPress={() => handleCall('1969')}
           />
        </View>

        <View style={styles.gpsRow}>
           <Ionicons name="navigate-circle" size={20} color={Colors.success} />
           <Text style={styles.gpsText}>GPS Locked: Kaduwela Interchange Area</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertingText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    marginBottom: 40,
  },
  countdownNumber: {
    color: '#FFF',
    fontSize: 64,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: Colors.danger,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 5,
  },
  descText: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    marginBottom: 40,
  },
  cancelBtn: {
    backgroundColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelHeaderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 15,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  gpsText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
});
