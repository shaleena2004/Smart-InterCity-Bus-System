import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBookingContext } from '@/context/BookingContext';

export default function BookScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { bookings } = useBookingContext();

  const getUpcomingBooking = () => {
    const today = new Date();
    const tzOffset = new Date().getTimezoneOffset() * 60000; 
    const localToday = new Date(today.getTime() - tzOffset);
    const todayStr = localToday.toISOString().split('T')[0];
    
    const localTomorrow = new Date(localToday);
    localTomorrow.setDate(localTomorrow.getDate() + 1);
    const tomorrowStr = localTomorrow.toISOString().split('T')[0];

    return bookings.find(b => b.status === 'Confirmed' && (b.date === todayStr || b.date === tomorrowStr));
  };

  const upcomingBooking = getUpcomingBooking();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: '#D4AF37' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="directions-bus" size={36} color="#000" style={{ marginRight: 8 }} />
          <ThemedText style={[styles.headerTitle, { color: '#000' }]}>Book&Go</ThemedText>
        </View>
        <ThemedText style={[styles.headerSubtitle, { color: '#333' }]}>Premium Intercity Travel</ThemedText>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        
        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Ready to Go?</ThemedText>
          <TouchableOpacity 
            style={[styles.mainActionBtn, { backgroundColor: '#000' }]} 
            onPress={() => router.push('/journey')}
          >
            <MaterialIcons name="map" size={32} color="#D4AF37" style={{ marginRight: 12 }} />
            <ThemedText style={[styles.searchButtonText, { color: '#D4AF37' }]}>Track My Bus</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity 
            style={[styles.historyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => router.push('/my-bookings')}
          >
            <MaterialIcons name="history" size={28} color={theme.icon} />
            <ThemedText style={styles.historyBtnText}>Past Trips</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.historyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => router.push('/my-bookings')}
          >
            <MaterialIcons name="event" size={28} color={theme.icon} />
            <ThemedText style={styles.historyBtnText}>Upcoming</ThemedText>
          </TouchableOpacity>
        </View>

        {upcomingBooking && (
          <View style={[styles.promoBanner, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
            <MaterialIcons name="event-available" size={24} color="#2E7D32" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ThemedText style={{ color: '#2E7D32', fontWeight: 'bold' }}>Upcoming Journey Reminder</ThemedText>
              <ThemedText style={{ color: '#2E7D32', fontSize: 13 }}>
                You have a {upcomingBooking.route} trip scheduled for {upcomingBooking.date}.
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.adminTools}>
           <ThemedText style={styles.sectionTitle}>Admin & Driver Tools</ThemedText>
           <View style={styles.grid}>
             <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/reports')}>
               <IconSymbol name="doc.on.doc.fill" size={24} color="#D4AF37" />
               <ThemedText style={styles.gridText}>Reports</ThemedText>
             </TouchableOpacity>

             <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/routes')}>
               <IconSymbol name="map.fill" size={24} color="#D4AF37" />
               <ThemedText style={styles.gridText}>Routes</ThemedText>
             </TouchableOpacity>

             <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/create-route')}>
               <IconSymbol name="plus.circle.fill" size={24} color="#D4AF37" />
               <ThemedText style={styles.gridText}>Schedule</ThemedText>
             </TouchableOpacity>

             <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/route-status')}>
               <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#D4AF37" />
               <ThemedText style={styles.gridText}>Fleet</ThemedText>
             </TouchableOpacity>
           </View>
        </View>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    marginBottom: -40,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    margin: 20,
    marginTop: 60,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2,
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#D4AF37',
  },
  mainActionBtn: {
    height: 70,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  searchButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  historyBtn: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  adminTools: {
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gridText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
});
