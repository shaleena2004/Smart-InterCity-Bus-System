import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookingContext } from '@/context/BookingContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function MyBookingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { bookings, updateBookingStatus } = useBookingContext();
  const [selectedBookingQr, setSelectedBookingQr] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    alert(`Cancellation requested for ${id}. Refund process initiated.`);
    updateBookingStatus(id, 'Cancelled');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>My Bookings</ThemedText>
      </View>

      <View style={styles.content}>
        {bookings.map((booking) => (
          <ThemedView key={booking.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.route}>{booking.route}</ThemedText>
              <ThemedText style={[
                styles.status, 
                { color: booking.status === 'Confirmed' ? theme.success : booking.status === 'Cancelled' ? theme.error : theme.tint }
              ]}>
                {booking.status}
              </ThemedText>
            </View>
            <View style={styles.details}>
              <ThemedText style={[styles.detailText, { color: theme.text, opacity: 0.7 }]}>Booking ID: {booking.id}</ThemedText>
              <ThemedText style={[styles.detailText, { color: theme.text, opacity: 0.7 }]}>Date: {booking.date} {booking.time && `• ${booking.time}`}</ThemedText>
              <ThemedText style={[styles.detailText, { color: theme.text, opacity: 0.7 }]}>Bus: {booking.busType}</ThemedText>
              <ThemedText style={[styles.detailText, { color: theme.text, opacity: 0.7 }]}>Seat: {booking.seat}</ThemedText>
            </View>
            {booking.status !== 'Cancelled' && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  onPress={() => setSelectedBookingQr(booking.id)} 
                  style={[styles.button, { backgroundColor: '#3498db', marginRight: 8, flexDirection: 'row', alignItems: 'center' }]}
                >
                  <MaterialIcons name="qr-code" size={16} color="#FFF" style={{ marginRight: 4 }} />
                  <ThemedText style={[styles.buttonText, { color: '#FFF' }]}>QR Code</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: theme.tint, marginRight: 8, justifyContent: 'center' }]}
                  onPress={() => router.push({
                    pathname: '/seat-selection',
                    params: {
                      editMode: 'true',
                      bookingId: booking.id,
                      selectedSeats: booking.seat,
                      type: booking.busType,
                      name: booking.name || '',
                      contact: booking.contact || '',
                      time: booking.time || '',
                      price: '1500' // Using default price from Search
                    }
                  })}
                >
                  <ThemedText style={[styles.buttonText, { color: '#121212' }]}>Edit</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCancel(booking.id)} style={[styles.button, { backgroundColor: theme.error, justifyContent: 'center' }]}>
                  <ThemedText style={[styles.buttonText, { color: '#FFF' }]}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>
        ))}
      </View>

      <Modal visible={!!selectedBookingQr} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Scan QR to Board</ThemedText>
            <View style={styles.qrPlaceholder}>
              <MaterialIcons name="qr-code-2" size={200} color={theme.text} />
            </View>
            <ThemedText style={{ marginTop: 10, marginBottom: 20, fontSize: 16 }}>Booking ID: {selectedBookingQr}</ThemedText>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.tint, width: '100%', alignItems: 'center', paddingVertical: 12 }]}
              onPress={() => setSelectedBookingQr(null)}
            >
              <ThemedText style={[styles.buttonText, { color: '#121212', fontSize: 16 }]}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#FDB813',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    marginTop: -30,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  route: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 15,
    marginBottom: 4,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#121212',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  qrPlaceholder: {
    padding: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
});
