import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBookingContext } from '@/context/BookingContext';

export default function BookScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { bookings } = useBookingContext();

  const getUpcomingBooking = () => {
    const today = new Date();
    // Use local coordinates to match today string nicely if needed, or stick to simple ISO
    const tzOffset = new Date().getTimezoneOffset() * 60000; 
    const localToday = new Date(today.getTime() - tzOffset);
    const todayStr = localToday.toISOString().split('T')[0];
    
    const localTomorrow = new Date(localToday);
    localTomorrow.setDate(localTomorrow.getDate() + 1);
    const tomorrowStr = localTomorrow.toISOString().split('T')[0];

    return bookings.find(b => b.status === 'Confirmed' && (b.date === todayStr || b.date === tomorrowStr));
  };

  const upcomingBooking = getUpcomingBooking();

  // Simulated total payments for the user (assuming > 10,000 to show promo)
  const totalPaymentsMade = 12500; 

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="directions-bus" size={36} color="#121212" style={{ marginRight: 8 }} />
          <ThemedText style={styles.headerTitle}>Book&Go</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>Find your next journey</ThemedText>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.upcomingTripsBtn, { backgroundColor: theme.tint }]} 
          onPress={() => router.push('/journey')}
        >
          <MaterialIcons name="map" size={32} color="#121212" style={{ marginRight: 12 }} />
          <ThemedText style={styles.searchButtonText}>Now I have to go.</ThemedText>
        </TouchableOpacity>

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
            <ThemedText style={styles.historyBtnText}>Upcoming Trips</ThemedText>
          </TouchableOpacity>
        </View>

        {upcomingBooking && (
          <View style={[styles.promoBanner, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
            <MaterialIcons name="event-available" size={24} color="#2E7D32" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <ThemedText style={{ color: '#2E7D32', fontWeight: 'bold' }}>Upcoming Journey Reminder</ThemedText>
              <ThemedText style={{ color: '#2E7D32', fontSize: 13 }}>
                You have a {upcomingBooking.route} trip scheduled for {upcomingBooking.date} (Seat: {upcomingBooking.seat}). Get ready!
              </ThemedText>
            </View>
          </View>
        )}

        <View style={[styles.promoBanner, { backgroundColor: '#FFF9C4', borderColor: '#FBC02D' }]}>
          <MaterialIcons name="loyalty" size={24} color="#F57F17" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={{ color: '#F57F17', fontWeight: 'bold' }}>Loyalty Promo</ThemedText>
            <ThemedText style={{ color: '#F57F17', fontSize: 13 }}>Get a 10% discount on every 10 ticket issuances</ThemedText>
          </View>
        </View>

        <View style={[styles.promoBanner, { backgroundColor: '#E3F2FD', borderColor: '#1E88E5' }]}>
          <MaterialIcons name="schedule" size={24} color="#1565C0" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={{ color: '#1565C0', fontWeight: 'bold' }}>Early Bird Offer</ThemedText>
            <ThemedText style={{ color: '#1565C0', fontSize: 13 }}>5% discount for booking seats between 6:00 AM and 8:00 AM on weekdays</ThemedText>
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
    color: '#121212',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#333333',
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
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  dateScroll: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  searchButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#121212',
  },
  upcomingTripsBtn: {
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
});
