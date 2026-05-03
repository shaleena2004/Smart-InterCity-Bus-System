import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { getBusRoutes } from '../services/api';
import { useEffect } from 'react';
import * as Location from 'expo-location';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8690A9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export default function FindBusesScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [tab, setTab] = useState('search'); // 'search' | 'results'
  const upcomingDates = generateDates();

  // Geocode origin when user stops typing
  useEffect(() => {
    const t = setTimeout(async () => {
      if (origin.length > 2) {
        try {
          const res = await Location.geocodeAsync(`${origin}, Sri Lanka`);
          if (res.length > 0) {
            const coords = { latitude: res[0].latitude, longitude: res[0].longitude };
            setOriginCoords(coords);
            if (mapRef.current && !destCoords) {
              mapRef.current.animateToRegion({ ...coords, latitudeDelta: 1.5, longitudeDelta: 1.5 }, 800);
            }
          }
        } catch (_) { }
      }
    }, 700);
    return () => clearTimeout(t);
  }, [origin]);

  // Geocode destination and fit map
  useEffect(() => {
    const t = setTimeout(async () => {
      if (destination.length > 2) {
        try {
          const res = await Location.geocodeAsync(`${destination}, Sri Lanka`);
          if (res.length > 0) {
            const coords = { latitude: res[0].latitude, longitude: res[0].longitude };
            setDestCoords(coords);
          }
        } catch (_) { }
      }
    }, 700);
    return () => clearTimeout(t);
  }, [destination]);

  // Fit map to show both markers
  useEffect(() => {
    if (originCoords && destCoords && mapRef.current) {
      mapRef.current.fitToCoordinates([originCoords, destCoords], {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [originCoords, destCoords]);

  const handleSearch = async () => {
    if (!origin || !destination || !date) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      let searchDistance = 0;
      if (originCoords && destCoords) {
        searchDistance = getDistance(
          originCoords.latitude, originCoords.longitude,
          destCoords.latitude, destCoords.longitude
        );
      }

      const res = await getBusRoutes();
      const filtered = res.data.filter(r => {
        const matchStart = r.startLocation?.toLowerCase().includes(origin.toLowerCase()) ||
          (r.stops && r.stops.some(s => s.name?.toLowerCase().includes(origin.toLowerCase())));
        const matchEnd = r.endLocation?.toLowerCase().includes(destination.toLowerCase()) ||
          (r.stops && r.stops.some(s => s.name?.toLowerCase().includes(destination.toLowerCase())));
        return matchStart && matchEnd;
      }).map(r => {
        const totalDist = r.distance ? parseFloat(r.distance) : searchDistance || 100;
        const basePrice = r.ticketPrice ? parseFloat(r.ticketPrice) : totalDist * 10;
        let dynamicPrice = basePrice;
        if (searchDistance > 0 && searchDistance < totalDist) {
          dynamicPrice = (searchDistance / totalDist) * basePrice;
        }
        if (dynamicPrice < 100) dynamicPrice = 100;
        return {
          ...r,
          calculatedDistance: searchDistance > 0 ? searchDistance.toFixed(1) : totalDist,
          dynamicPrice,
        };
      });

      setResults(filtered);
      if (filtered.length > 0) {
        updateRoutePath(filtered[0]);
      }
      setTab('results');
    } catch (err) {
      console.error(err);
      Alert.alert('Search Failed', 'Could not fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const updateRoutePath = async (trip) => {
    if (!trip) return;
    setLoading(true);
    try {
      const path = [];
      // Start with origin geocode
      if (originCoords) path.push(originCoords);

      // Geocode intermediate stops
      if (trip.stops && trip.stops.length > 0) {
        for (const stop of trip.stops) {
          const res = await Location.geocodeAsync(`${stop.name}, Sri Lanka`);
          if (res.length > 0) {
            path.push({ latitude: res[0].latitude, longitude: res[0].longitude });
          }
        }
      }

      // End with destination geocode
      if (destCoords) path.push(destCoords);

      setRoutePath(path);

      if (mapRef.current && path.length > 1) {
        mapRef.current.fitToCoordinates(path, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }
    } catch (err) {
      console.error('Route path geocoding failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectTrip = (trip) => {
    updateRoutePath(trip); // Show this specific route on map
    const price = trip.dynamicPrice || trip.ticketPrice || (trip.distance ? parseInt(trip.distance) * 10 : 1500);
    router.push({
      pathname: '/bookings',
      params: {
        origin,
        destination,
        date,
        tripId: trip._id,
        tripData: JSON.stringify({ ...trip, price }),
        t: Date.now()
      }
    });
  };

  return (
    <View style={styles.container}>


      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={darkMapStyle}
          provider={PROVIDER_GOOGLE}
          initialRegion={{ latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4, longitudeDelta: 4 }}
        >
          {originCoords && (
            <Marker coordinate={originCoords} title={`From: ${origin}`}>
              <View style={styles.markerOrigin}>
                <Ionicons name="location" size={18} color="#fff" />
              </View>
            </Marker>
          )}
          {destCoords && (
            <Marker coordinate={destCoords} title={`To: ${destination}`}>
              <View style={styles.markerDest}>
                <Ionicons name="flag" size={18} color="#fff" />
              </View>
            </Marker>
          )}
          {routePath.length > 2 && routePath.slice(1, -1).map((stop, idx) => (
            <Marker key={`stop-${idx}`} coordinate={stop}>
              <View style={styles.markerStop} />
            </Marker>
          ))}
          {routePath.length > 0 ? (
            <Polyline
              coordinates={routePath}
              strokeColor="#FFC107"
              strokeWidth={4}
            />
          ) : (originCoords && destCoords && (
            <Polyline
              coordinates={[originCoords, destCoords]}
              strokeColor="#FFC107"
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          ))}
        </MapView>
        {/* Live badge */}
        <View style={styles.mapBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>ROUTE PREVIEW</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {tab === 'search' ? (
          <>
            {/* Origin */}
            <View style={styles.inputRow}>
              <Ionicons name="location" size={20} color="#FFC107" />
              <TextInput
                style={styles.input}
                placeholder="From (e.g. Colombo)"
                placeholderTextColor="#8690A9"
                value={origin}
                onChangeText={setOrigin}
              />
            </View>

            {/* Destination */}
            <View style={styles.inputRow}>
              <Ionicons name="navigate" size={20} color="#f14668" />
              <TextInput
                style={styles.input}
                placeholder="To (e.g. Kandy)"
                placeholderTextColor="#8690A9"
                value={destination}
                onChangeText={setDestination}
              />
            </View>

            {/* Distance indicator */}
            {originCoords && destCoords && (
              <View style={styles.distBadge}>
                <Ionicons name="git-branch-outline" size={14} color="#FFC107" />
                <Text style={{ color: '#FFC107', fontSize: 12, marginLeft: 6 }}>
                  Approx. {getDistance(originCoords.latitude, originCoords.longitude, destCoords.latitude, destCoords.longitude).toFixed(1)} km route
                </Text>
              </View>
            )}

            {/* Date selector */}
            <Text style={styles.label}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {upcomingDates.map(d => (
                <TouchableOpacity key={d} style={[styles.dateChip, date === d && styles.dateChipActive]} onPress={() => setDate(d)}>
                  <Text style={[styles.dateText, date === d && { color: '#0B0F19', fontWeight: 'bold' }]}>{d.slice(5)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSearch}>
              <Ionicons name="search" size={20} color="#000" />
              <Text style={styles.primaryBtnText}>{loading ? 'Searching...' : 'Search Buses'}</Text>
            </TouchableOpacity>

            {/* Promo banners */}
            <View style={[styles.promoBanner, { borderColor: '#f3be0f' }]}>
              <Ionicons name="pricetag" size={18} color="#f3be0f" />
              <Text style={[styles.promoText, { color: '#f3be0f' }]}>Loyalty: 10% off every 10th ticket!</Text>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setTab('search')} style={styles.backRow}>
              <Ionicons name="arrow-back" size={20} color="#FFC107" />
              <Text style={{ color: '#FFC107', marginLeft: 6 }}>Back to search</Text>
            </TouchableOpacity>
            <Text style={styles.cardTitle}>{origin} → {destination}</Text>
            <Text style={{ color: '#8690A9', marginBottom: 16 }}>{date}</Text>

            {results.length > 0 ? results.map(t => (
              <TouchableOpacity key={t._id} style={styles.tripCard} onPress={() => selectTrip(t)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View>
                    <Text style={styles.tripTime}>{t.departureTime || '08:00 AM'} - {t.arrivalTime || '12:00 PM'}</Text>
                    <Text style={styles.tripSub}>{t.routeName || 'Express Bus'} • {t.busNumber || 'AC Coach'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.tripPrice}>LKR {t.dynamicPrice ? t.dynamicPrice.toFixed(2) : (t.ticketPrice ? t.ticketPrice.toFixed(2) : '1500.00')}</Text>
                    <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold', marginTop: 4 }}>{t.status || 'Scheduled'}</Text>
                  </View>
                </View>
                <View style={styles.tripBottom}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people" size={14} color="#8690A9" />
                      <Text style={styles.tripSeats}>40 seats</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="navigate" size={14} color="#8690A9" />
                      <Text style={styles.tripSeats}>{t.calculatedDistance || t.distance || '150'} km</Text>
                    </View>
                  </View>
                  <Text style={styles.fast}>{t.routeNumber || 'EX01'}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="bus-outline" size={48} color="#232940" />
                <Text style={{ color: '#8690A9', marginTop: 12, textAlign: 'center' }}>
                  {loading ? 'Searching...' : 'No buses found for this route.\nTry a different date or city.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mapContainer: { height: 200, margin: 16, borderRadius: 16, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  mapBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,25,38,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFC107', marginRight: 6 },
  liveText: { color: '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  markerOrigin: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerDest: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f14668', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerStop: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFC107', borderWidth: 1.5, borderColor: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: '#232940' },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14, marginLeft: 10 },
  distBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFC10715', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, borderWidth: 1, borderColor: '#FFC10740' },
  label: { color: '#8690A9', fontSize: 13, marginBottom: 8 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#232940', marginRight: 8, backgroundColor: '#141926' },
  dateChipActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  dateText: { color: '#8690A9', fontSize: 13 },
  primaryBtn: { backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  promoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12, gap: 10, backgroundColor: 'rgba(255,221,87,0.08)' },
  promoText: { flex: 1, fontSize: 13 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  tripCard: { backgroundColor: '#141926', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#232940' },
  tripTime: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tripSub: { color: '#8690A9', fontSize: 13, marginTop: 2 },
  tripPrice: { color: '#FFC107', fontSize: 20, fontWeight: 'bold' },
  tripBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#232940', paddingTop: 10, marginTop: 10 },
  tripSeats: { color: '#8690A9', fontSize: 13 },
  fast: { color: '#f14668', fontSize: 12, fontWeight: 'bold' },
});
