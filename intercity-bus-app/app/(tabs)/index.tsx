import MapComponent from '@/components/MapComponent';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LiveTrackScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Dummy Data for simulation
  const busLocation = {
    latitude: 6.927079,
    longitude: 79.861244,
  };

  const routeCoordinates = [
    { latitude: 6.927079, longitude: 79.861244 },
    { latitude: 7.290571, longitude: 80.633726 },
  ];

  const nextStop = {
    name: "Kandy Bus Stand",
    eta: "15 Mins",
    distance: "12 km"
  };

  useEffect(() => {
    // Simulate automatic alert when approaching stop
    const timer = setTimeout(() => {
      Alert.alert("Approaching Stop!", `Your bus is approaching ${nextStop.name}. ETA is ${nextStop.eta}.`);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <Text style={styles.headerTitle}>Live Route Tracking</Text>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapComponent
          busLocation={busLocation}
          routeCoordinates={routeCoordinates}
          theme={theme}
          style={styles.map}
        />
      </View>

      {/* Info Section */}
      <ScrollView style={styles.infoContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Trip Status</Text>
          <View style={styles.row}>
            <IconSymbol name="location.fill" size={24} color={theme.tint} />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Next Stop</Text>
              <Text style={styles.value}>{nextStop.name}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <IconSymbol name="clock.fill" size={24} color={theme.tint} />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Estimated Arrival (ETA)</Text>
              <Text style={styles.value}>{nextStop.eta} ({nextStop.distance})</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.alertButton, { backgroundColor: theme.tint }]}
          onPress={() => Alert.alert("Alert Saved", "You will be notified 5 minutes before arrival.")}
        >
          <IconSymbol name="bell.fill" size={20} color="#222" />
          <Text style={styles.buttonText}>Set Stop Alert</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1.5,
    borderBottomWidth: 3,
    borderColor: '#E0E0E0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  textContainer: {
    marginLeft: 15,
  },
  label: {
    color: '#666666',
    fontSize: 14,
  },
  value: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
