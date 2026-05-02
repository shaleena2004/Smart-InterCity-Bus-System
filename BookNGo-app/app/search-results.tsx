import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { origin, destination, date } = params;

  // Added more bus options with different times
  const trips = [
    { id: '1', time: '06:30 AM', arrival: '11:00 AM', type: 'Single deck', seatsAvailable: 15, price: 1500, plate: 'NC-4521' },
    { id: '2', time: '08:00 AM', arrival: '01:00 PM', type: 'Single deck', seatsAvailable: 12, price: 1500, plate: 'NB-9988' },
    { id: '3', time: '10:30 AM', arrival: '03:30 PM', type: 'Single deck', seatsAvailable: 5, price: 1550, plate: 'ND-1122' },
    { id: '4', time: '01:00 PM', arrival: '06:00 PM', type: 'Single deck', seatsAvailable: 22, price: 1500, plate: 'NE-3344' },
    { id: '5', time: '04:30 PM', arrival: '09:30 PM', type: 'Single deck', seatsAvailable: 8, price: 1600, plate: 'NF-5566' },
    { id: '6', time: '09:00 PM', arrival: '04:00 AM', type: 'Single deck', seatsAvailable: 2, price: 1700, plate: 'NG-7788' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>{origin} to {destination}</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{date}</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text, opacity: 0.6 }]}>Available Buses</ThemedText>
        {trips.map(trip => (
          <TouchableOpacity 
            key={trip.id} 
            onPress={() => router.push({ 
              pathname: '/seat-selection', 
              params: { 
                busId: trip.id, 
                type: trip.type, 
                price: trip.price,
                time: trip.time // Pass the selected time
              } 
            })}
          >
            <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.cardTop}>
                <View>
                  <ThemedText style={styles.timeText}>{trip.time} - {trip.arrival}</ThemedText>
                  <ThemedText style={[styles.busType, { color: theme.text, opacity: 0.7 }]}>{trip.type} • Plate: {trip.plate}</ThemedText>
                </View>
                <ThemedText style={[styles.price, { color: theme.tint }]}>Rs. {trip.price}</ThemedText>
              </View>
              
              <View style={[styles.cardBottom, { borderTopColor: theme.border }]}>
                <MaterialIcons name="event-seat" size={20} color={theme.icon} />
                <ThemedText style={[styles.seats, { color: theme.text, opacity: 0.8 }]}>{trip.seatsAvailable} seats available</ThemedText>
                {trip.seatsAvailable < 5 && <ThemedText style={styles.fast}>Selling fast!</ThemedText>}
              </View>
            </ThemedView>
          </TouchableOpacity>
        ))}
      </View>
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  content: {
    padding: 20,
    marginTop: -30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  busType: {
    fontSize: 14,
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  seats: {
    fontSize: 14,
    marginLeft: 8,
  },
  fast: {
    fontSize: 12,
    color: '#EF5350',
    marginLeft: 'auto',
    fontWeight: 'bold',
  },
});
