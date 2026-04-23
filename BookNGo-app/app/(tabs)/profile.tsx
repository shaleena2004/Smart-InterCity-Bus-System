import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Simulated Profile Performance data
  const totalTrips = 42;
  const totalSpent = "Rs. 35,500";
  const mostFrequentRoute = "Colombo - Kandy";

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={60} color="#fff" />
        </View>
        <ThemedText style={styles.headerTitle}>User Profile</ThemedText>
        <ThemedText style={{color: '#333'}}>Passionate Traveler</ThemedText>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Performance & Activities</ThemedText>
        
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <MaterialIcons name="directions-bus" size={32} color="#3498db" />
            <ThemedText style={styles.statValue}>{totalTrips}</ThemedText>
            <ThemedText style={styles.statLabel}>Trips Taken</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.background }]}>
            <MaterialIcons name="account-balance-wallet" size={32} color="#2ecc71" />
            <ThemedText style={styles.statValue}>{totalSpent}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
          </View>
        </View>

        <View style={[styles.frequentRow, { backgroundColor: theme.background }]}>
          <MaterialIcons name="star" size={24} color="#f1c40f" />
          <View style={{ marginLeft: 15 }}>
            <ThemedText style={styles.statLabel}>Most Frequent Route</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{mostFrequentRoute}</ThemedText>
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
    paddingBottom: 40,
    zIndex: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  card: {
    margin: 20,
    marginTop: -20,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  frequentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 5,
  }
});
