import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        if (sessionData) {
          const user = JSON.parse(sessionData);
          console.log('Session exists for:', user.role, 'but routing to /role for development testing.');
          // Development Override: Force user to Role Selection so they don't get stuck in one role
          router.replace('/role');
        } else {
          router.replace('/role');
        }
      } catch (e) {
        console.error("Session check fail", e);
        router.replace('/role');
      }
    };
    
    // Slight delay to allow splash
    const timer = setTimeout(() => checkSession(), 500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconBox}>
          <Ionicons name="bus" size={48} color="#000" />
        </View>
        <Text style={styles.appName}>BOOK&amp;GO</Text>
      </View>
      
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching live bus data...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: '#FFC107',
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    marginTop: 15,
    fontSize: 14,
  },
});
