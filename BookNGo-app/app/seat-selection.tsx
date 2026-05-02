import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SeatSelectionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { type, price, editMode, bookingId, selectedSeats: initialSeatsParam, name, contact, time } = params;
  
  const initialSeats = initialSeatsParam ? (initialSeatsParam as string).split(',') : [];
  const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSeats);

  // Generate Single Deck Seat Layout
  // 12 Rows of 2x2 seats
  // Row 13 has 6 seats horizontally across the back
  const layout = [];
  
  for (let row = 1; row <= 12; row++) {
    layout.push({
      rowId: row,
      seats: [
        { id: `${row}A`, isBooked: (row % 3 === 0) && !initialSeats.includes(`${row}A`) },
        { id: `${row}B`, isBooked: (row % 4 === 1) && !initialSeats.includes(`${row}B`) },
        null, // Aisle space
        { id: `${row}C`, isBooked: (row % 5 === 2) && !initialSeats.includes(`${row}C`) },
        { id: `${row}D`, isBooked: (row % 3 === 2) && !initialSeats.includes(`${row}D`) }
      ]
    });
  }
  
  // Row 13: 6 seats at the back
  layout.push({
    rowId: 13,
    seats: [
      { id: `13A`, isBooked: false },
      { id: `13B`, isBooked: true && !initialSeats.includes(`13B`) },
      { id: `13C`, isBooked: false },
      { id: `13D`, isBooked: false },
      { id: `13E`, isBooked: false },
      { id: `13F`, isBooked: false },
    ]
  });

  const toggleSeat = (id: string, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 seats at a time.');
        return;
      }
      setSelectedSeats([...selectedSeats, id]);
    }
  };

  const cost = selectedSeats.length * parseFloat(price as string || '0');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>Select Seats</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{time} • Single Deck</ThemedText>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]} />
          <ThemedText>Available</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: theme.tint }]} />
          <ThemedText>Selected</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: theme.error }]} />
          <ThemedText>Booked</ThemedText>
        </View>
      </View>

      <View style={[styles.busLayout, { borderColor: theme.border }]}>
        <ThemedText style={[styles.frontText, { color: theme.text, opacity: 0.6 }]}>Driver Front</ThemedText>
        
        {layout.map((rowData) => (
          <View key={`row-${rowData.rowId}`} style={styles.seatRow}>
            {rowData.seats.map((seat, index) => {
              if (seat === null) {
                // Return an empty view for the aisle space
                return <View key={`aisle-${rowData.rowId}-${index}`} style={styles.aisle} />;
              }

              const selected = selectedSeats.includes(seat.id);
              let seatColor = theme.surface;
              if (seat.isBooked) seatColor = theme.error;
              if (selected) seatColor = theme.tint;

              return (
                <TouchableOpacity
                  key={seat.id}
                  onPress={() => toggleSeat(seat.id, seat.isBooked)}
                  style={[
                    styles.seat, 
                    { backgroundColor: seatColor, borderColor: theme.border, borderWidth: selected ? 0 : 1 }
                  ]}
                >
                  <ThemedText style={{ color: selected ? '#121212' : theme.text, fontSize: 12 }}>{seat.id}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {selectedSeats.length > 0 && (
        <ThemedView style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View>
            <ThemedText style={styles.selectedText}>Seats: {selectedSeats.join(', ')}</ThemedText>
            <ThemedText style={[styles.priceText, { color: theme.tint }]}>Total: Rs. {cost}</ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, { backgroundColor: theme.tint }]}
            onPress={() => router.push({ 
              pathname: '/checkout', 
              params: { 
                seats: selectedSeats.join(','), 
                type: type as string, 
                total: cost,
                editMode: editMode as string,
                bookingId: bookingId as string,
                name: name as string,
                contact: contact as string,
                time: time as string
              } 
            })}
          >
            <ThemedText style={styles.checkoutBtnText}>Checkout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#333',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  busLayout: {
    borderWidth: 2,
    borderColor: '#CCC',
    marginHorizontal: 16, // Expanded to fit 6 seats across
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 100,
  },
  frontText: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  seat: {
    height: 48,
    width: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  aisle: {
    width: 32, // Width of the aisle
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FDB813',
  },
  checkoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  checkoutBtnText: {
    fontWeight: 'bold',
    color: '#121212',
    fontSize: 16,
  },
});
