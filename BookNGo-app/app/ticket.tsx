import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TicketScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { id, seats, name, amount } = params;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>Booking Confirmed!</ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedView style={[styles.ticketSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.ticketTop}>
            <ThemedText style={styles.appTitle}>Book&Go Ticket</ThemedText>
            <ThemedText style={[styles.status, { color: theme.success }]}>Confirmed</ThemedText>
          </View>

          <View style={[styles.divider, { borderBottomColor: theme.border }]} />

          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Passenger:</ThemedText>
              <ThemedText style={styles.value}>{name || 'N/A'}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Booking ID:</ThemedText>
              <ThemedText style={styles.value}>{id}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Seats:</ThemedText>
              <ThemedText style={styles.value}>{seats}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Amount Paid:</ThemedText>
              <ThemedText style={styles.value}>Rs. {parseFloat(amount as string).toFixed(2)}</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { borderBottomColor: theme.border }]} />

          <View style={styles.qrContainer}>
            <ThemedText style={styles.qrLabel}>Scan to Board</ThemedText>
            <Image 
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${id}` }} 
              style={styles.qrCode}
            />
          </View>
        </ThemedView>

        <TouchableOpacity 
          style={[styles.homeBtn, { backgroundColor: theme.tint }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <ThemedText style={styles.homeBtnText}>Go to Home</ThemedText>
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
    backgroundColor: '#FDB813',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  content: {
    padding: 20,
    marginTop: -50,
  },
  ticketSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  ticketDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  qrLabel: {
    fontSize: 16,
    marginBottom: 12,
    color: '#666',
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  homeBtn: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  homeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#121212',
  },
});
