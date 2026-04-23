import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBookingContext } from '@/context/BookingContext';

export default function CheckoutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { seats, type, total, editMode, bookingId, name: initialName, contact: initialContact, time } = params;
  const initialTotal = parseFloat(total as string || '0');
  
  // Convert seats string back to array to see amount of seats selected
  const selectedSeatsArray = seats ? (seats as string).split(',') : [];
  const numSeats = selectedSeatsArray.length;

  const [name, setName] = useState(initialName as string || '');
  const [contact, setContact] = useState(initialContact as string || '');
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const { addBooking, updateBooking } = useBookingContext();

  const finalTotal = initialTotal - discount;

  const applyPromo = () => {
    if (promo === 'DISCOUNT10') {
      setDiscount(initialTotal * 0.1);
      alert('10% Discount Applied!');
    } else {
      alert('Invalid Promo Code');
    }
  };

  const handleCheckout = () => {
    if (!name || !contact) {
      alert('Please fill out all passenger details');
      return;
    }

    if (editMode === 'true' && bookingId) {
      updateBooking(bookingId as string, {
        seat: seats as string,
        name,
        contact,
        busType: type as string || 'Single deck',
        time: time as string
      });
      router.push({
        pathname: '/ticket',
        params: { 
          id: bookingId, 
          seats, 
          name, 
          amount: finalTotal,
          time
        }
      });
      return;
    }

    const newId = 'BKG-' + Math.floor(Math.random() * 90000 + 10000);
    
    // Add to global state so it shows up in "My Bookings"
    addBooking({
      id: newId,
      route: 'Colombo Destination', // Mock route based on origin-destination if passed, or just label
      date: new Date().toISOString().split('T')[0],
      time: time as string,
      status: 'Confirmed',
      seat: seats as string,
      busType: type as string || 'Single deck',
      name,
      contact
    });

    router.push({
      pathname: '/ticket',
      params: { 
        id: newId, 
        seats, 
        name, 
        amount: finalTotal,
        time
      }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>Checkout</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Passenger Details</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Full Name"
            placeholderTextColor={theme.icon}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Contact Information"
            placeholderTextColor={theme.icon}
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
          {/* Replaced boarding point with just reading number of seats */}
          <View style={[styles.seatCounterBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText style={styles.seatLabel}>Selected: {seats}</ThemedText>
            <ThemedText style={[styles.seatValue, { color: theme.tint }]}>{time}</ThemedText>
          </View>
        </ThemedView>

        {editMode !== 'true' && (
          <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText style={styles.sectionTitle}>Promo Code</ThemedText>
            <View style={styles.promoContainer}>
              <TextInput
                style={[styles.input, styles.promoInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Enter Code"
                placeholderTextColor={theme.icon}
                value={promo}
                onChangeText={setPromo}
              />
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.tint }]} onPress={applyPromo}>
                <ThemedText style={[styles.applyBtnText, { color: '#121212' }]}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
          <View style={styles.row}>
            <ThemedText>Seats ({numSeats}):</ThemedText>
            <ThemedText>Rs. {initialTotal.toFixed(2)}</ThemedText>
          </View>
          {discount > 0 && (
            <View style={styles.row}>
              <ThemedText style={{ color: theme.success }}>Discount:</ThemedText>
              <ThemedText style={{ color: theme.success }}>- Rs. {discount.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={[styles.row, styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText style={styles.totalText}>Total Fare:</ThemedText>
            <ThemedText style={[styles.totalText, { color: theme.tint }]}>Rs. {finalTotal.toFixed(2)}</ThemedText>
          </View>
        </ThemedView>

        <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: theme.tint }]} onPress={handleCheckout}>
          <ThemedText style={[styles.checkoutBtnText, { color: '#121212' }]}>{editMode === 'true' ? 'Update Booking' : 'Pay & Confirm'}</ThemedText>
        </TouchableOpacity>
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
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  seatCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  seatLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  seatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  promoContainer: {
    flexDirection: 'row',
  },
  promoInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  applyBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  checkoutBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
