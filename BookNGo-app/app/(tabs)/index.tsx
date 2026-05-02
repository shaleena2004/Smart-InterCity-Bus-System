import MapComponent from '@/components/MapComponent';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { mockSchedules } from '../globalStore';

export default function LiveTrackScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [notificationAnim] = useState(new Animated.Value(-100)); 
  const [showNotification, setShowNotification] = useState(false);

  const triggerNotification = () => {
    setShowNotification(true);
    Animated.sequence([
      Animated.timing(notificationAnim, {
        toValue: 50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(notificationAnim, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setShowNotification(false));
  };


  useEffect(() => {
    const interval = setInterval(() => {
      if (mockSchedules.length > 0) {
        const latest = mockSchedules[0];
        setActiveRoute((prev: any) => {
          if (!prev || prev.id !== latest.id || prev.route !== latest.route) {
            return { ...latest };
          }
          return prev;
        });
      }
    }, 1000);

    if (mockSchedules.length > 0) {
      setActiveRoute({ ...mockSchedules[0] });
    }

    return () => clearInterval(interval);
  }, []);

  const locationCoordinates: Record<string, { latitude: number, longitude: number }> = {
    "colombo": { latitude: 6.9271, longitude: 79.8612 },
    "kandy": { latitude: 7.2906, longitude: 80.6337 },
    "galle": { latitude: 6.0328, longitude: 80.2168 },
    "matara": { latitude: 5.9549, longitude: 80.5469 },
    "kurunegala": { latitude: 7.4818, longitude: 80.3609 },
    "nuwara eliya": { latitude: 6.9497, longitude: 80.7828 },
    "jaffna": { latitude: 9.6615, longitude: 80.0255 },
    "negombo": { latitude: 7.2008, longitude: 79.8737 },
    "anuradhapura": { latitude: 8.3114, longitude: 80.4037 },
    "trincomalee": { latitude: 8.5873, longitude: 81.2152 },
    "batticaloa": { latitude: 7.7102, longitude: 81.6924 },
    "badulla": { latitude: 6.9934, longitude: 81.0550 },
    "ratnapura": { latitude: 6.6828, longitude: 80.3992 },
    "kegalle": { latitude: 7.2513, longitude: 80.3464 },
    "polonnaruwa": { latitude: 7.9403, longitude: 81.0188 },
    "hambantota": { latitude: 6.1246, longitude: 81.1185 },
    "puttalam": { latitude: 8.0330, longitude: 79.8252 },
    "vavuniya": { latitude: 8.7542, longitude: 80.4982 },
    "mannar": { latitude: 8.9810, longitude: 79.9044 },
    "mullaitivu": { latitude: 9.2671, longitude: 80.8142 },
    "ampara": { latitude: 7.2843, longitude: 81.6747 },
    "monaragala": { latitude: 6.8724, longitude: 81.3507 },
    "kalutara": { latitude: 6.5854, longitude: 79.9607 },
    "gampaha": { latitude: 7.0840, longitude: 80.0098 },
    "default": { latitude: 7.8731, longitude: 80.7718 } // Center of Sri Lanka
  };

  const getCoord = (locName: string) => {
    const name = locName.toLowerCase();
    for (const key in locationCoordinates) {
      if (name.includes(key)) return locationCoordinates[key];
    }
    const hash = name.length * 0.01;
    return {
      latitude: locationCoordinates["default"].latitude + hash,
      longitude: locationCoordinates["default"].longitude + hash
    };
  };

  let busLocation = { latitude: 6.927079, longitude: 79.861244 };
  let routeCoordinates = [
    { latitude: 6.927079, longitude: 79.861244 },
    { latitude: 7.290571, longitude: 80.633726 }
  ];
  let nextStop = {
    name: "Kandy Bus Stand",
    eta: "15 Mins",
    distance: "12 km",
    busNum: "ND-1234"
  };

  if (activeRoute) {
    const parts = activeRoute.route.split(" - ");
    const startLocName = parts[0] ? parts[0].trim() : "Colombo";
    const endLocName = parts[1] ? parts[1].trim() : "Kandy";
    
    const startCoord = getCoord(startLocName);
    const endCoord = getCoord(endLocName);
    
    busLocation = startCoord;
    routeCoordinates = [startCoord, endCoord];
    
    nextStop = {
      name: endLocName,
      eta: "1H 30M",
      distance: "115 km",
      busNum: activeRoute.bus || "N/A"
    };
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      Alert.alert("Approaching Stop!", `Your bus (${nextStop.busNum}) is approaching ${nextStop.name}. ETA is ${nextStop.eta}.`);
    }, 5000);
    return () => clearTimeout(timer);
  }, [nextStop.name, activeRoute?.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Animated Notification */}
      <Animated.View style={[styles.notification, { transform: [{ translateY: notificationAnim }], backgroundColor: theme.tint }]}>
        <IconSymbol name="bell.fill" size={24} color="#000" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.notificationTitle}>Alert Activated!</Text>
          <Text style={styles.notificationBody}>Bus {nextStop.busNum} is on the way to {nextStop.name}.</Text>
        </View>
      </Animated.View>

      <View style={[styles.header, { backgroundColor: theme.tint }]}>

        <Text style={styles.headerTitle}>Live Route Tracking</Text>
      </View>

      <View style={styles.topActionArea}>
        <TouchableOpacity 
          style={[styles.mainCreateBtn, { backgroundColor: '#000' }]}
          onPress={() => router.push('/create-route')}
        >
          <IconSymbol name="plus.circle.fill" size={22} color={theme.tint} />
          <Text style={[styles.mainCreateBtnText, { color: theme.tint }]}>New Schedule</Text>
        </TouchableOpacity>
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
          onPress={triggerNotification}
        >

          <IconSymbol name="bell.fill" size={20} color="#000" />
          <Text style={styles.buttonText}>Set Stop Alert</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Admin & Driver Tools</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/reports')}>
              <IconSymbol name="doc.on.doc.fill" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Reports Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/routes')}>
              <IconSymbol name="map.fill" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Manage Routes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/create-route')}>
              <IconSymbol name="plus.circle.fill" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Create Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/trip-progress')}>
              <IconSymbol name="arrow.triangle.pull" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Trip Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/route-status')}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Fleet Status</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/schedule-performance')}>
              <IconSymbol name="chart.bar.fill" size={24} color={theme.tint} />
              <Text style={styles.gridText}>Schedules</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  quickActions: {
    marginTop: 10,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  topActionArea: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mainCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  mainCreateBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  notification: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  notificationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  notificationBody: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  }
});

