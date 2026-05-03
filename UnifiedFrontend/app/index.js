import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Pressable, Image, Modal, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect, Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getBusRoutes, getRevenue, createIncident, getIncidents, updateIncidentStatus, getBusDetails, getUserBookings, getSuppliers, getBuses, getUsers, addTrip, updateBooking, updateBus, getDriverStats, updateIncident, deleteIncident, addIncident } from '../services/api';
import { useEffect, useState, useRef } from 'react';

// -------------------------------------------------------------
// PASSENGER DASHBOARD (Matches pdf_image_8_2.jpeg)
// -------------------------------------------------------------
const PassengerDashboard = () => {
  const { userId, userName } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  const savedRoutes = [
    { id: '1', title: 'To Home', sub: '138 Route', icon: 'home', color: '#FFC107' },
    { id: '2', title: 'To Work', sub: '120 Route', icon: 'briefcase', color: '#FFC107' },
    { id: '3', title: 'Frequent', sub: '177 Route', icon: 'star', color: '#FFC107' },
  ];

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      getLocation();
    }, [userId])
  );

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc.coords);
      }
    } catch (e) { }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getBusRoutes();
      setRoutes(res.data);
      setFilteredRoutes(res.data);
      if (userId) {
        const bookRes = await getUserBookings(userId);
        const active = bookRes.data.find(b => b.status === 'Pending' || b.status === 'Confirmed');
        setActiveBooking(active);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const endTrip = () => {
    if (!activeBooking) return;
    Alert.alert(
      'End Trip',
      'Are you sure you want to end your current trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip', style: 'destructive', onPress: async () => {
            try {
              await updateBooking(activeBooking._id, { status: 'Completed' });
              setActiveBooking(null);
              Alert.alert('Trip Ended', 'Your trip has been marked as completed. Thank you for riding!');
            } catch (err) {
              Alert.alert('Error', 'Could not end trip. Please try again.');
            }
          }
        }
      ]
    );
  };

  const triggerPassengerSOS = async () => {
    try {
      await createIncident({
        type: 'sos',
        severity: 'critical',
        userId: userId,
        busNumber: activeBooking?.busNumber,
        description: `Passenger SOS Alert triggered on route ${activeBooking?.busRoute || 'Unknown'} (Bus: ${activeBooking?.busNumber || 'Unknown'})`,
        location: userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null
      });
      Alert.alert('SOS Sent!', 'Emergency responders and admins have been notified of your location.');
    } catch (err) {
      console.error('Failed to send passenger SOS:', err);
      Alert.alert('Error', 'Failed to send SOS alert. Please try again.');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) setFilteredRoutes(routes);
    else setFilteredRoutes(routes.filter(r =>
      (r.routeName || '').toLowerCase().includes(text.toLowerCase()) ||
      (r.startLocation || '').toLowerCase().includes(text.toLowerCase()) ||
      (r.endLocation || '').toLowerCase().includes(text.toLowerCase())
    ));
  };

  const getNearbyStatus = (index) => {
    const statuses = [
      { time: '2 mins', label: 'LIVE', color: '#4ade80' },
      { time: '10 mins', label: 'SCHEDULED', color: '#FFC107' },
      { time: '15 mins', label: 'LIVE', color: '#4ade80' },
      { time: '22 mins', label: 'SCHEDULED', color: '#FFC107' },
    ];
    return statuses[index % statuses.length];
  };

  return (
    <View style={styles.container}>


      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* MAP */}
        <View style={pStyles.mapContainer}>
          {userLocation ? (
            <MapView
              ref={mapRef}
              style={pStyles.map}
              customMapStyle={darkMapStyle}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            />
          ) : (
            <View style={[pStyles.map, { backgroundColor: '#141926', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="map" size={60} color="#232940" />
              <Text style={{ color: '#8690A9', marginTop: 8 }}>Acquiring location...</Text>
            </View>
          )}
          {/* Live badge overlay */}
          <View style={pStyles.liveBadgeOverlay}>
            <View style={pStyles.liveDot} />
            <Text style={pStyles.liveText}>LIVE TRIP TRACKING</Text>
          </View>
        </View>

        {/* Active Booking Card - Current Trip */}
        {activeBooking ? (
          <View style={pStyles.currentTripCard}>
            <View style={pStyles.currentTripHeader}>
              <View style={pStyles.currentTripHeaderLeft}>
                <Ionicons name="bus" size={16} color="#000" />
                <Text style={pStyles.currentTripLabel}>CURRENT TRIP</Text>
              </View>
              <View style={pStyles.tripIdBadge}>
                <Text style={pStyles.tripIdText}>{activeBooking.busNumber || 'EX01'}</Text>
              </View>
            </View>
            <View style={pStyles.currentTripBody}>
              <View style={{ flex: 1 }}>
                <Text style={pStyles.currentTripRoute}>
                  {activeBooking.busRoute?.replace(' → ', ' ')}
                  <Text style={{ color: '#FFC107' }}> → </Text>
                </Text>
                <Text style={pStyles.currentTripStatus}>{activeBooking.status || 'In Transit'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={pStyles.etaTime}>{activeBooking.time || '15 mins'}</Text>
                <Text style={pStyles.etaLabel}>TO DESTINATION</Text>
              </View>
            </View>
            <View style={pStyles.nextStopBox}>
              <View style={pStyles.nextStopIcon}><Ionicons name="navigate" size={16} color="#FFC107" /></View>
              <View>
                <Text style={pStyles.nextStopLabel}>DESTINATION</Text>
                <Text style={pStyles.nextStopName}>{activeBooking.busRoute?.split(' → ')[1] || 'Unknown'}</Text>
              </View>
            </View>
            <View style={pStyles.tripActionsRow}>
              <TouchableOpacity 
                style={pStyles.emergencyBtn} 
                onLongPress={triggerPassengerSOS} 
                delayLongPress={3000} 
                onPress={() => Alert.alert('Hold to trigger', 'Please hold the emergency button for 3 seconds to send an SOS alert with your location.')}
              >
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={pStyles.emergencyText}>EMERGENCY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={pStyles.busDetailsBtn} onPress={() => router.push(`/bus-details?busNumber=${activeBooking.busNumber}`)}>
                <Ionicons name="bus" size={20} color="#000" />
                <Text style={pStyles.busDetailsText}>BUS DETAILS</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={pStyles.tripTicketBtn} onPress={() => router.push('/my-bookings')}>
              <Ionicons name="qr-code" size={18} color="#000" />
              <Text style={pStyles.tripTicketText}>TRIP TICKET</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pStyles.tripTicketBtn, { backgroundColor: '#f14668', marginTop: 10 }]}
              onPress={endTrip}
            >
              <Ionicons name="flag" size={18} color="#fff" />
              <Text style={[pStyles.tripTicketText, { color: '#fff' }]}>END TRIP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Search bar when no active trip */
          <View style={pStyles.searchWrapper}>
            <View style={pStyles.searchBar}>
              <Ionicons name="search" size={20} color="#8690A9" />
              <TextInput
                placeholder="Where are you going?"
                placeholderTextColor="#8690A9"
                style={pStyles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setFilteredRoutes(routes); }}>
                  <Ionicons name="close-circle" size={20} color="#8690A9" />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity style={pStyles.bookNowBtn} onPress={() => router.push('/find-buses')}>
              <Text style={pStyles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Routes */}
        <View style={pStyles.sectionRow}>
          <Text style={pStyles.sectionTitle}>Saved Routes</Text>
          <TouchableOpacity onPress={() => router.push('/my-bookings')}>
            <Text style={pStyles.manageText}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pStyles.savedRoutesScroll}>
          {savedRoutes.map(item => (
            <TouchableOpacity key={item.id} style={pStyles.savedRouteCard} onPress={() => {
              handleSearch(item.sub.split(' ')[0]);
            }}>
              <View style={pStyles.savedRouteIcon}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={pStyles.savedRouteTitle}>{item.title}</Text>
              <Text style={pStyles.savedRouteSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Other Nearby Buses */}
        <View style={[pStyles.sectionRow, { marginTop: 24 }]}>
          <Text style={pStyles.sectionTitle}>Other Nearby Buses</Text>
        </View>
        <View style={pStyles.nearbyList}>
          {loading ? (
            <View style={pStyles.loadingBox}>
              <Text style={{ color: '#8690A9' }}>Loading buses...</Text>
            </View>
          ) : filteredRoutes.length > 0 ? filteredRoutes.slice(0, 5).map((route, idx) => {
            const status = getNearbyStatus(idx);
            return (
              <TouchableOpacity key={route._id || idx} style={pStyles.nearbyCard} onPress={() => router.push('/find-buses')}>
                <View style={pStyles.nearbyIconBox}>
                  <Ionicons name="bus" size={20} color="#FFC107" />
                </View>
                <View style={pStyles.nearbyInfo}>
                  <Text style={pStyles.nearbyTitle}>{route.routeName || `Route ${idx + 138}`}</Text>
                  <Text style={pStyles.nearbySub}>{route.startLocation} → {route.endLocation}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={pStyles.nearbyTime}>{status.time}</Text>
                  <Text style={[pStyles.nearbyStatus, { color: status.color }]}>{status.label}</Text>
                </View>
              </TouchableOpacity>
            );
          }) : (
            <View style={pStyles.loadingBox}>
              <Text style={{ color: '#8690A9' }}>No buses found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Passenger-specific styles
const pStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0B0F19' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mapContainer: { height: 220, position: 'relative' },
  map: { width: '100%', height: 220 },
  liveBadgeOverlay: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11,15,25,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { color: '#4ade80', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  currentTripCard: { backgroundColor: '#141926', marginHorizontal: 0, borderRadius: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, borderBottomWidth: 1, borderColor: '#232940' },
  currentTripHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  currentTripHeaderLeft: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFC107', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 6 },
  currentTripLabel: { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  tripIdBadge: { backgroundColor: '#232940', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tripIdText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  currentTripBody: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  currentTripRoute: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  currentTripStatus: { color: '#4ade80', fontSize: 13, fontWeight: '600', marginTop: 4 },
  etaTime: { color: '#fff', fontSize: 24, fontWeight: '800' },
  etaLabel: { color: '#8690A9', fontSize: 10, letterSpacing: 0.5 },
  nextStopBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B0F19', borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  nextStopIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFC10720', alignItems: 'center', justifyContent: 'center' },
  nextStopLabel: { color: '#8690A9', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  nextStopName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tripActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  emergencyBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#f14668', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  emergencyText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  busDetailsBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  busDetailsText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  tripTicketBtn: { flexDirection: 'row', backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 16 },
  tripTicketText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  searchWrapper: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#232940', gap: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 13 },
  bookNowBtn: { backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  bookNowText: { color: '#000', fontWeight: '800', fontSize: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, marginTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  manageText: { color: '#FFC107', fontSize: 14, fontWeight: '600' },
  savedRoutesScroll: { paddingHorizontal: 20, gap: 12 },
  savedRouteCard: { backgroundColor: '#141926', borderRadius: 14, padding: 16, alignItems: 'center', width: 110, borderWidth: 1, borderColor: '#232940' },
  savedRouteIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFC10720', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  savedRouteTitle: { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center', marginBottom: 4 },
  savedRouteSub: { color: '#8690A9', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  nearbyList: { paddingHorizontal: 20, gap: 0, paddingBottom: 8 },
  nearbyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', borderRadius: 14, padding: 14, marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#232940' },
  nearbyIconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFC10715', alignItems: 'center', justifyContent: 'center' },
  nearbyInfo: { flex: 1 },
  nearbyTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 3 },
  nearbySub: { color: '#8690A9', fontSize: 12 },
  nearbyTime: { color: '#FFC107', fontWeight: '800', fontSize: 15, marginBottom: 2 },
  nearbyStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  loadingBox: { padding: 30, alignItems: 'center' },
});

// -------------------------------------------------------------
// DARK MAP STYLE (matches app theme)
// -------------------------------------------------------------
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0F19' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0F19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8690A9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1D24' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#232940' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8690A9' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#232940' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2a3050' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#FFC107' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#141926' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#141926' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#12191e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1A1D24' }] },
];

// -------------------------------------------------------------
// DRIVER DASHBOARD (Matches pdf_image_6_5.jpeg - Active Trip)
// -------------------------------------------------------------
const DriverDashboard = () => {
  const [sosVisible, setSosVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [busDetailsVisible, setBusDetailsVisible] = useState(false);
  const [maintenanceVisible, setMaintenanceVisible] = useState(false);
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const router = useRouter();
  const { userId } = useAuth();

  // Incident Reporting State
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [driverIncidents, setDriverIncidents] = useState([]);
  const [reportingIncident, setReportingIncident] = useState({ type: 'accident', severity: 'low', description: '' });
  const [isEditingIncident, setIsEditingIncident] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState(null);


  // New state for trip selection
  const [activeTrip, setActiveTrip] = useState(null);
  const [allBuses, setAllBuses] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [submittingIncident, setSubmittingIncident] = useState(false);


  // Location tracking
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const locationWatcher = useRef(null);
  const mapRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchSelectionData();
      startLocationTracking();
      return () => {
        if (locationWatcher.current) {
          locationWatcher.current.remove();
          locationWatcher.current = null;
        }
      };
    }, [userId])
  );


  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      // Get initial position
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation(initial.coords);
      // Watch for updates
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (loc) => {
          setUserLocation(loc.coords);
          // Pan map to follow
          mapRef.current?.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }, 1000);

          // Update operational stats if in a trip
          if (activeTrip) {
            updateLiveStats(loc.coords.latitude, loc.coords.longitude);
          }
        }
      );
    } catch (err) {
      console.error('Location error:', err);
      setLocationError('Unable to get location');
    }
  };

  const fetchSelectionData = async () => {
    try {
      const [bRes, rRes] = await Promise.all([getBuses(), getBusRoutes()]);
      setAllBuses(bRes.data);
      setAllRoutes(rRes.data);
      
      const safeUserId = typeof userId === 'object' ? (userId?._id || userId?.id) : userId;
      if (safeUserId) {
        const statsRes = await getDriverStats(safeUserId);
        setDriverIncidents(statsRes.data.incidents || []);
      }
    } catch (err) {
      console.error('Failed to fetch selection data:', err);
    }
  };


  const handleReportIncident = async () => {
    if (!activeTrip && !isEditingIncident) {
      Alert.alert('No Active Trip', 'Please start a trip to report an incident.');
      return;
    }

    if (!reportingIncident.description || !reportingIncident.description.trim()) {
      Alert.alert('Incomplete Report', 'Please provide a description of the incident before submitting.');
      return;
    }

    setSubmittingIncident(true);
    try {
      if (isEditingIncident) {
        const res = await updateIncident(editingIncidentId, reportingIncident);
        if (res.data) {
          setDriverIncidents(prev => prev.map(inc => inc._id === editingIncidentId ? { ...inc, ...reportingIncident } : inc));
        }
        Alert.alert('Success', 'Incident report updated.');
      } else {
        console.log(">>> [FRONTEND] Submitting new incident for user:", userId);
        const res = await addIncident({
          ...reportingIncident,
          busId: activeTrip.bus._id,
          supplierId: activeTrip.bus.supplierId?._id || activeTrip.bus.supplierId,
          userId: userId,
          date: new Date()
        });
        console.log(">>> [FRONTEND] Incident submission response:", res.data);
        
        // Optimistic update to UI
        if (res.data && res.data.data) {
          setDriverIncidents(prev => [res.data.data, ...prev]);
        }
        
        Alert.alert('Success', 'Incident reported successfully.');
      }

      setIncidentModalVisible(false);
      setReportingIncident({ type: 'accident', severity: 'low', description: '' });
      setIsEditingIncident(false);
      
      // Wait a moment for DB consistency then refetch
      setTimeout(async () => {
        try {
          const safeUserId = typeof userId === 'object' ? (userId?._id || userId?.id) : userId;
          if (!safeUserId) return;
          
          const statsRes = await getDriverStats(safeUserId);
          console.log(`>>> [FRONTEND] Refetched stats for ${safeUserId}. Found ${statsRes.data.incidents?.length} incidents`);
          
          // Only update if we actually got incidents back to prevent "disappearing" bug
          if (statsRes.data && statsRes.data.incidents && statsRes.data.incidents.length > 0) {
            setDriverIncidents(statsRes.data.incidents);
          } else {
            // If refetch is empty but we have an optimistic one, maybe wait longer?
            console.log(">>> [FRONTEND] Refetch returned empty list, keeping optimistic state for now.");
          }
        } catch (e) {
          console.error(">>> [FRONTEND] Failed to refetch stats:", e);
        }
      }, 2000); // Increased delay to 2 seconds

    } catch (err) {

      console.error('Failed to report incident:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit incident report. Please try again.';
      Alert.alert('Submission Failed', errMsg);
    } finally {
      setSubmittingIncident(false);
    }
  };


  const deleteDriverIncident = async (id) => {
    Alert.alert("Delete", "Delete this incident report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteIncident(id);
          const statsRes = await getDriverStats(userId);
          setDriverIncidents(statsRes.data.incidents || []);
        } catch (err) {
          Alert.alert("Error", "Failed to delete incident.");
        }
      }}
    ]);
  };


  const startTrip = () => {
    const bus = allBuses.find(b => b._id === selectedBusId);
    const route = allRoutes.find(r => r._id === selectedRouteId);

    if (!bus || !route) {
      Alert.alert('Selection Required', 'Please select both a bus and a route to start your trip.');
      return;
    }

    setActiveTrip({
      bus,
      route,
      startTime: new Date(),
      status: 'In Transit'
    });
    fetchDirections(route);
  };

  const endTrip = () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end the current trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          onPress: async () => {
            console.log('>>> [FRONTEND] Ending Trip. activeTrip:', activeTrip, 'userId:', userId);
            try {
              if (activeTrip) {
                await addTrip({
                  busId: activeTrip.bus._id,
                  supplierId: activeTrip.bus.supplierId?._id || activeTrip.bus.supplierId,
                  driverId: userId,
                  routeId: activeTrip.route._id,
                  status: 'ON_TIME'
                });
                Alert.alert('Trip Ended', 'Trip data has been recorded successfully.');
              }
              setActiveTrip(null);
              setRouteCoords([]);
            } catch (err) {
              console.error('Failed to record trip:', err);
              setActiveTrip(null);
              setRouteCoords([]);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const startSOS = () => {
    setSosVisible(true);
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSOSConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    clearInterval(timerRef.current);
    setSosVisible(false);
  };

  const handleSOSConfirm = async () => {
    try {
      await createIncident({
        type: 'sos',
        severity: 'critical',
        busId: activeTrip?.bus?._id,
        supplierId: activeTrip?.bus?.supplierId,
        description: `SOS Alert triggered by driver on bus ${activeTrip?.bus?.plateNumber || 'N/A'}`
      });
      Alert.alert('Alert Sent', 'Emergency services and highway patrol have been notified.');
    } catch (err) {
      console.error('Failed to send SOS:', err);
      Alert.alert('Error', 'Failed to send SOS alert. Please call 119 directly.');
    } finally {
      setSosVisible(false);
    }
  };

  const decodePolyline = (t) => {
    let points = [];
    for (let i = 0, l = t.length, lat = 0, lng = 0; i < l;) {
      let b, shift = 0, result = 0;
      do { b = t.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (result & 1 ? ~(result >> 1) : (result >> 1));
      shift = 0; result = 0;
      do { b = t.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (result & 1 ? ~(result >> 1) : (result >> 1));
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const fetchDirections = async (route) => {
    if (!route?.startLocation || !route?.endLocation) return;
    const apiKey = 'AIzaSyAR1hIc1CkvSu79noTgVBtWLzNtbEPk3r0';
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(route.startLocation)}&destination=${encodeURIComponent(route.endLocation)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        const duration = leg.duration.text;
        const distance = leg.distance.text;
        const destinationCoords = leg.end_location;

        setActiveTrip(prev => {
          if (!prev) return null;
          return {
            ...prev,
            duration,
            distance,
            remainingDuration: duration,
            remainingDistance: distance,
            destinationCoords
          };
        });

        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);

        // Fit map to route
        mapRef.current?.fitToCoordinates(points, {
          edgePadding: { top: 50, right: 40, bottom: 50, left: 40 },
          animated: true,
        });
      }
    } catch (err) {
      console.error('Directions API failed:', err);
    }
  };

  const updateLiveStats = async (lat, lng) => {
    if (!activeTrip?.destinationCoords) return;
    const apiKey = 'AIzaSyAR1hIc1CkvSu79noTgVBtWLzNtbEPk3r0';
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${activeTrip.destinationCoords.lat},${activeTrip.destinationCoords.lng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        setActiveTrip(prev => {
          if (!prev) return null;
          return {
            ...prev,
            remainingDuration: leg.duration.text,
            remainingDistance: leg.distance.text
          };
        });
      }
    } catch (err) {
      console.error('Live Stats update failed:', err);
    }
  };

  const openBusDetails = () => {
    if (!activeTrip) {
      Alert.alert('No Active Trip', 'Please start a trip to view vehicle details.');
      return;
    }
    setBusData(activeTrip.bus);
    setBusDetailsVisible(true);
  };

  const openMaintenance = () => {
    if (!activeTrip) {
      Alert.alert('No Active Trip', 'Please start a trip to view technical status.');
      return;
    }
    setBusData(activeTrip.bus);
    setMaintenanceVisible(true);
  };

  const toggleReminderStatus = async (index) => {
    if (!busData || !busData.reminders) return;
    const currentReminders = [...busData.reminders];
    const reminder = currentReminders[index];
    
    const newStatus = reminder.status === 'Completed' ? 'Pending' : 'Completed';
    currentReminders[index] = { ...reminder, status: newStatus };

    const updatedBus = { ...busData, reminders: currentReminders };
    setBusData(updatedBus);
    
    setActiveTrip(prev => {
      if (!prev) return null;
      return { ...prev, bus: updatedBus };
    });

    try {
      await updateBus(updatedBus._id, { reminders: currentReminders });
    } catch (e) {
      console.error('Failed to update reminder:', e);
      Alert.alert('Error', 'Failed to update reminder status');
      currentReminders[index] = { ...reminder, status: reminder.status };
      const revertedBus = { ...busData, reminders: currentReminders };
      setBusData(revertedBus);
      setActiveTrip(prev => prev ? { ...prev, bus: revertedBus } : null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top Map Area */}
        <View style={[styles.mapContainer, { height: 260 }]}>
          {userLocation ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={5}
              >
                <View style={styles.busMarker}>
                  <Ionicons name="bus" size={18} color="#fff" />
                </View>
              </Marker>

              {routeCoords.length > 0 && (
                <>
                  <Polyline
                    coordinates={routeCoords}
                    strokeWidth={5}
                    strokeColor="#FFC107"
                    lineDashPattern={[0]}
                  />
                  <Marker coordinate={routeCoords[0]} title="Start Location">
                    <View style={[styles.endpointMarker, { backgroundColor: '#4ade80' }]}>
                      <Ionicons name="pin" size={14} color="#fff" />
                    </View>
                  </Marker>
                  <Marker coordinate={routeCoords[routeCoords.length - 1]} title="End Location">
                    <View style={[styles.endpointMarker, { backgroundColor: '#f14668' }]}>
                      <Ionicons name="flag" size={14} color="#fff" />
                    </View>
                  </Marker>
                </>
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="locate" size={32} color="#FFC107" style={{ marginBottom: 10 }} />
              <Text style={{ color: '#8690A9', fontSize: 13 }}>
                {locationError || 'Acquiring GPS signal...'}
              </Text>
            </View>
          )}
          {/* Floating LIVE badge */}
          <View style={styles.liveBadgeFloat}>
            <View style={[styles.liveDot, activeTrip ? {} : { backgroundColor: '#8690A9' }]} />
            <Text style={styles.liveText}>{activeTrip ? 'LIVE TRIP TRACKING' : 'IDLE - READY FOR TRIP'}</Text>
          </View>
        </View>

        {!activeTrip ? (
          /* NO ACTIVE TRIP VIEW */
          <View style={{ padding: 20, marginTop: -40 }}>
            <View style={styles.activeTripBox}>
              <View style={styles.activeTripHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bus" size={18} color="#000" />
                  <Text style={styles.currentTripText}>TRIP SETUP</Text>
                </View>
              </View>

              <Text style={{ color: '#fff', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                Select your assigned vehicle and route to begin tracking and operations.
              </Text>

              <Text style={styles.infoLabelSmall}>SELECT BUS</Text>
              <View style={{ gap: 8, marginTop: 10, marginBottom: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {allBuses.map(bus => (
                    <TouchableOpacity
                      key={bus._id}
                      style={[styles.horizontalCard, { width: 140, borderColor: selectedBusId === bus._id ? '#FFC107' : '#232940', borderWidth: selectedBusId === bus._id ? 2 : 1 }]}
                      onPress={() => setSelectedBusId(bus._id)}
                    >
                      <Ionicons name="bus" size={24} color={selectedBusId === bus._id ? '#FFC107' : '#8690A9'} />
                      <Text style={[styles.cardTitle, { marginTop: 8 }]}>{bus.plateNumber}</Text>
                      <Text style={styles.cardSub}>{bus.busType}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.infoLabelSmall}>SELECT ROUTE</Text>
              <View style={{ gap: 8, marginTop: 10, marginBottom: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {allRoutes.map(route => (
                    <TouchableOpacity
                      key={route._id}
                      style={[styles.horizontalCard, { width: 140, borderColor: selectedRouteId === route._id ? '#4ade80' : '#232940', borderWidth: selectedRouteId === route._id ? 2 : 1 }]}
                      onPress={() => setSelectedRouteId(route._id)}
                    >
                      <Ionicons name="map" size={24} color={selectedRouteId === route._id ? '#4ade80' : '#8690A9'} />
                      <Text style={[styles.cardTitle, { marginTop: 8 }]}>{route.routeName || 'Standard'}</Text>
                      <Text style={styles.cardSub}>{route.startLocation} → {route.endLocation}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: '#FFC107', marginTop: 10 }]}
                onPress={startTrip}
              >
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.reportBtnText}>START TRIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ACTIVE TRIP VIEW */
          <View style={{ padding: 20, marginTop: -40 }}>
            <View style={styles.activeTripBox}>
              <View style={styles.activeTripHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="analytics" size={16} color="#000" />
                  <Text style={styles.currentTripText}>ACTIVE TRIP</Text>
                </View>
                <View style={styles.exBadge}><Text style={styles.exBadgeText}>{activeTrip?.bus?.plateNumber}</Text></View>
              </View>

              <View style={styles.activeTripMain}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeTripRoute}>
                    {activeTrip?.route?.startLocation} <Text style={{ color: '#FFC107' }}>→</Text> {activeTrip?.route?.endLocation}
                  </Text>
                  <Text style={styles.activeTripStatus}>{activeTrip?.route?.routeName || 'Luxury Express'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.activeTripTime}>ETA</Text>
                  <Text style={styles.activeTripDest}>{activeTrip?.remainingDuration || activeTrip?.duration || 'Calculating...'}</Text>
                </View>
              </View>

              <View style={styles.nextStopBox}>
                <View style={styles.nextStopIcon}><Ionicons name="navigate" size={16} color="#FFC107" /></View>
                <View>
                  <Text style={styles.nextStopLabel}>REMAINING DISTANCE</Text>
                  <Text style={styles.nextStopName}>
                    {activeTrip?.remainingDistance || activeTrip?.distance || 'Syncing...'}
                  </Text>
                </View>
              </View>

              <View style={styles.tripActionsRow}>
                <TouchableOpacity
                  style={styles.emergencyBtn}
                  onLongPress={startSOS}
                  delayLongPress={1000}
                  onPress={() => Alert.alert('Hold to Trigger', 'Please press and hold for 1 second to trigger the emergency SOS alert.')}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.emergencyText}>EMERGENCY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.busDetailsBtn} onPress={openBusDetails}>
                  <Ionicons name="bus" size={20} color="#000" />
                  <Text style={styles.busDetailsText}>BUS DETAILS</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.tripTicketBtn, { flex: 1 }]} onPress={openMaintenance}>
                  <Ionicons name="build" size={18} color="#000" />
                  <Text style={styles.tripTicketText}>MAINTENANCE</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: '#f14668', marginTop: 12, borderTopWidth: 1, borderTopColor: '#232940' }]}
                onPress={endTrip}
              >
                <Ionicons name="stop-circle" size={20} color="#fff" />
                <Text style={[styles.reportBtnText, { color: '#fff' }]}>FINISH & END TRIP</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Operational Statistics */}
        <View style={[styles.sectionHeader, { marginTop: activeTrip ? 10 : 0 }]}>
          <Text style={styles.sectionTitle}>Operational Stats</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {[
            { id: '1', title: 'Distance', sub: activeTrip?.distance || '0 km', icon: 'navigate', color: '#FFC107' },
            { id: '2', title: 'Speed', sub: activeTrip ? '65 KM/H' : '0 KM/H', icon: 'speedometer', color: '#3298dc' },
            { id: '3', title: 'Fuel', sub: activeTrip?.bus?.technicalStatus?.fuelLevel ? `${activeTrip.bus.technicalStatus.fuelLevel}%` : '85%', icon: 'water', color: '#4ade80' },
            { id: '4', title: 'Engine', sub: activeTrip?.bus?.technicalStatus?.engineHealth ? `${activeTrip.bus.technicalStatus.engineHealth}%` : 'Optimal', icon: 'flash', color: '#E53935' }
          ].map(item => (
            <View key={item.id} style={styles.horizontalCard}>
              <View style={[styles.horizontalIconBox, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {/* My Incident Reports */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>My Incident Reports</Text>
          <TouchableOpacity onPress={() => {
            setIsEditingIncident(false);
            setReportingIncident({ type: 'accident', severity: 'low', description: '' });
            setIncidentModalVisible(true);
          }}>
            <Text style={styles.seeAllText}>+ Report New</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {driverIncidents.length > 0 ? (
            driverIncidents.map((inc) => (
              <View key={inc._id} style={[styles.verticalCard, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFC107', fontSize: 12, fontWeight: 'bold' }}>{inc.type?.toUpperCase()}</Text>
                    <Text style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>{inc.description}</Text>
                    <Text style={{ color: '#8690A9', fontSize: 11, marginTop: 4 }}>{new Date(inc.date).toLocaleDateString()} • {inc.severity?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => {
                      setReportingIncident({ type: inc.type, severity: inc.severity, description: inc.description });
                      setIsEditingIncident(true);
                      setEditingIncidentId(inc._id);
                      setIncidentModalVisible(true);
                    }}>
                      <Ionicons name="create-outline" size={18} color="#FFC107" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteDriverIncident(inc._id)}>
                      <Ionicons name="trash-outline" size={18} color="#f14668" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#8690A9', fontSize: 13, textAlign: 'center', marginTop: 10 }}>No incidents reported by you yet.</Text>
          )}
        </View>

      </ScrollView>

      {/* SOS Modal */}
      <Modal visible={sosVisible} transparent animationType="fade">
        <View style={styles.sosOverlay}>
          <View style={styles.sosTopHeader}>
            <Ionicons name="warning" size={24} color="#fff" />
            <Text style={styles.sosTitle}>sos</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={styles.sosAlertText}>Alerting in 0{countdown}...</Text>

          <View style={styles.sosCircle}>
            <Text style={styles.sosCountdown}>0{countdown}</Text>
          </View>
          <Text style={styles.sosSecondsLabel}>SECONDS</Text>

          <Text style={styles.sosInfoText}>Sending your location to Highway Police and Emergency Contacts</Text>

          <TouchableOpacity style={styles.sosCancelBtn} onPress={cancelSOS}>
            <Text style={styles.sosCancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.sosActionRow}>
            <TouchableOpacity style={styles.sosCallBtn} onPress={() => Linking.openURL('tel:119')}>
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.sosActionLabel}>Call 119</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sosPatrolBtn} onPress={() => Linking.openURL('tel:1969')}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
              <Text style={styles.sosActionLabel}>Highway Patrol</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sosFooter}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsText}>GPS Locked: Kaduwela Interchange Area</Text>
          </View>
        </View>
      </Modal>

      {/* Premium Bus Details Modal */}
      <Modal visible={busDetailsVisible} transparent animationType="slide">
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="bus-outline" size={20} color="#FFC107" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderText}>Vehicle Specifications</Text>
              </View>
              <TouchableOpacity onPress={() => setBusDetailsVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              {busData && (
                <>
                  <View style={styles.busHeroSection}>
                    <Image
                      source={{ uri: 'file:///C:/Users/MSI SWORD/.gemini/antigravity/brain/5ca18274-85bc-45fb-98d6-7217aa1d2fd5/luxury_bus_hero_1777728747394.png' }}
                      style={styles.busHeroImage}
                    />
                    <View style={styles.busHeroOverlay}>
                      <View style={styles.premiumBadge}><Text style={styles.premiumText}>PREMIUM COACH</Text></View>
                      <Text style={styles.busHeroTitle}>{busData.brand} {busData.model}</Text>
                      <Text style={styles.busHeroSub}>{busData.plateNumber} • {busData.busType}</Text>
                    </View>
                  </View>

                  <View style={styles.modalPadding}>
                    <View style={styles.amenitiesGrid}>
                      <View style={[styles.amenitySquare, { opacity: busData.amenities?.wifi ? 1 : 0.3 }]}>
                        <Ionicons name="wifi" size={24} color="#FFC107" />
                        <Text style={styles.amenitySquareText}>WiFi</Text>
                      </View>
                      <View style={[styles.amenitySquare, { opacity: busData.amenities?.ac ? 1 : 0.3 }]}>
                        <Ionicons name="snow" size={24} color="#FFC107" />
                        <Text style={styles.amenitySquareText}>A/C</Text>
                      </View>
                      <View style={[styles.amenitySquare, { opacity: busData.amenities?.charging ? 1 : 0.3 }]}>
                        <Ionicons name="battery-charging" size={24} color="#FFC107" />
                        <Text style={styles.amenitySquareText}>USB Port</Text>
                      </View>
                    </View>

                    <View style={styles.specCard}>
                      <View style={styles.specRow}>
                        <Ionicons name="people" size={20} color="#8690A9" />
                        <Text style={styles.specLabel}>Capacity</Text>
                        <Text style={styles.specValue}>{busData.seatCount || 54} Seats</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.specRow}>
                        <Ionicons name="shield-checkmark" size={20} color="#8690A9" />
                        <Text style={styles.specLabel}>Insurance</Text>
                        <Text style={styles.specValue}>{busData.compliance?.insurancePolicy || 'Active'}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.specRow}>
                        <Ionicons name="calendar" size={20} color="#8690A9" />
                        <Text style={styles.specLabel}>License Expiry</Text>
                        <Text style={styles.specValue}>{busData.compliance?.licenseExpiry || '2025-12-15'}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Premium Maintenance Modal */}
      <Modal visible={maintenanceVisible} transparent animationType="slide">
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pulse-outline" size={20} color="#4ade80" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderText}>Technical Monitoring</Text>
              </View>
              <TouchableOpacity onPress={() => setMaintenanceVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalPadding}>
              <View style={styles.alertBanner}>
                <Ionicons name="shield-checkmark" size={22} color="#000" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.alertTitle}>All Systems Optimal</Text>
                  <Text style={styles.alertSub}>Last diagnostics check performed today.</Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Engine Health</Text>
                  <Text style={styles.gridValue}>{busData?.technicalStatus?.engineHealth || 98}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${busData?.technicalStatus?.engineHealth || 98}%`, backgroundColor: '#4ade80' }]} />
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Fuel Level</Text>
                  <Text style={styles.gridValue}>{busData?.technicalStatus?.fuelLevel || 65}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${busData?.technicalStatus?.fuelLevel || 65}%`, backgroundColor: '#FFC107' }]} />
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Battery Status</Text>
                  <Text style={styles.infoValText}>{busData?.technicalStatus?.batteryStatus || '12.8V'}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Coolant Temp</Text>
                  <Text style={styles.infoValText}>{busData?.technicalStatus?.coolantTemp || 88}°C</Text>
                </View>
              </View>

              <Text style={styles.subSectionTitle}>Upcoming Tasks</Text>
              {(busData?.reminders || []).length > 0 ? (
                busData.reminders.map((reminder, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.reminderCard, { marginBottom: 10, borderColor: reminder.status === 'Completed' ? '#4ade80' : '#232940' }]}
                    onPress={() => toggleReminderStatus(i)}
                  >
                    <View style={styles.reminderIconCircle}>
                      <Ionicons name={reminder.status === 'Completed' ? "checkmark-circle" : "construct"} size={20} color={reminder.status === 'Completed' ? '#4ade80' : '#8690A9'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.reminderTitle}>{reminder.task || 'Task'}</Text>
                      <Text style={styles.reminderSub}>{reminder.dueDate ? new Date(reminder.dueDate).toLocaleDateString() : 'No date'} {reminder.dueMileage ? `- ${reminder.dueMileage} KM` : ''}</Text>
                    </View>
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>{reminder.status.toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#8690A9', fontSize: 13, marginTop: 10, textAlign: 'center', marginBottom: 20 }}>No upcoming maintenance tasks.</Text>
              )}

              <TouchableOpacity 
                style={styles.reportBtnAction}
                onPress={() => {
                  setMaintenanceVisible(false);
                  setIsEditingIncident(false);
                  setReportingIncident({ type: 'breakdown', severity: 'medium', description: '' });
                  setIncidentModalVisible(true);
                }}
              >
                <Ionicons name="alert-circle-outline" size={20} color="#fff" />
                <Text style={styles.reportBtnActionText}>REPORT TECHNICAL ISSUE</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Incident Reporting Modal */}
      <Modal visible={incidentModalVisible} transparent animationType="slide">
        <View style={styles.modalFullOverlay}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={20} color="#FFC107" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderText}>{isEditingIncident ? 'Edit Incident Report' : 'Submit Incident Report'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIncidentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalPadding}>
              <Text style={styles.inputLabel}>Incident Category</Text>
              <View style={styles.amenitiesGrid}>
                {[
                  { id: 'accident', label: 'Accident', icon: 'car-sport' },
                  { id: 'breakdown', label: 'Breakdown', icon: 'construct' },
                  { id: 'medical', label: 'Medical', icon: 'medkit' },
                  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
                ].map((t) => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.amenitySquare, reportingIncident.type === t.id && { backgroundColor: '#FFC10720', borderColor: '#FFC107' }]}
                    onPress={() => setReportingIncident({ ...reportingIncident, type: t.id })}
                  >
                    <Ionicons name={t.icon} size={24} color={reportingIncident.type === t.id ? '#FFC107' : '#8690A9'} />
                    <Text style={[styles.amenitySquareText, reportingIncident.type === t.id && { color: '#FFC107' }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Severity Level</Text>
              <View style={styles.gridRow}>
                {[
                  { id: 'low', label: 'Low', color: '#4ade80' },
                  { id: 'medium', label: 'Medium', color: '#FFC107' },
                  { id: 'high', label: 'High', color: '#ff3860' },
                  { id: 'critical', label: 'Critical', color: '#f14668' },
                ].map((s) => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={[styles.gridItem, reportingIncident.severity === s.id && { borderColor: s.color, borderWidth: 2 }]}
                    onPress={() => setReportingIncident({ ...reportingIncident, severity: s.id })}
                  >
                    <Text style={[styles.gridLabel, reportingIncident.severity === s.id && { color: s.color }]}>{s.label}</Text>
                    <View style={[styles.progressBar, { marginTop: 8 }]}>
                      <View style={[styles.progressFill, { width: '100%', backgroundColor: s.color, opacity: reportingIncident.severity === s.id ? 1 : 0.2 }]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 120, backgroundColor: '#1A1D24', padding: 15, borderRadius: 12, color: '#fff', textAlignVertical: 'top' }]}
                multiline
                placeholder="Please provide as much detail as possible about the incident..."
                placeholderTextColor="#8690A9"
                value={reportingIncident.description}
                onChangeText={(text) => setReportingIncident({ ...reportingIncident, description: text })}
              />

              <TouchableOpacity 
                style={[styles.reportBtnAction, { marginTop: 30, backgroundColor: submittingIncident ? '#444' : '#FFC107' }]}
                onPress={handleReportIncident}
                disabled={submittingIncident}
              >
                {submittingIncident ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#000" />
                    <Text style={[styles.reportBtnActionText, { color: '#000' }]}>{isEditingIncident ? 'UPDATE REPORT' : 'SUBMIT INCIDENT REPORT'}</Text>
                  </>
                )}
              </TouchableOpacity>

              
              <TouchableOpacity style={{ padding: 15, alignItems: 'center' }} onPress={() => setIncidentModalVisible(false)}>
                <Text style={{ color: '#8690A9', fontWeight: 'bold' }}>CANCEL</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
};

// Finance users will be redirected to the main Finance Dashboard

// -------------------------------------------------------------
// SUPPLIER DASHBOARD HOME
// -------------------------------------------------------------
const SupplierDashboardHome = () => {
  const router = useRouter();
  const [supplierCount, setSupplierCount] = useState(0);
  const [busCount, setBusCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchSupplierStats();
    }, [])
  );

  const fetchSupplierStats = async () => {
    try {
      const [sRes, bRes] = await Promise.all([getSuppliers(), getBuses()]);
      setSupplierCount((sRes.data || []).length);
      setBusCount((bRes.data || []).length);
    } catch (e) { console.log('Supplier stats error:', e.message); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        <View style={[styles.sectionHeader, { marginTop: 0 }]}><Text style={styles.sectionTitle}>Supplier Portal</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' }}>
          {[
            { title: 'Suppliers', value: loading ? '...' : supplierCount.toString(), icon: 'people', color: '#FFC107' },
            { title: 'Fleet Size', value: loading ? '...' : busCount.toString(), icon: 'bus', color: '#3298dc' },
            { title: 'Performance', value: 'A+', icon: 'analytics', color: '#4ade80' },
            { title: 'Complaints', value: '2', icon: 'chatbubbles', color: '#f14668' },
          ].map((s, i) => (
            <View key={i} style={[styles.horizontalCard, { width: '48%', marginBottom: 16 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.color + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.cardSub}>{s.title}</Text>
              <Text style={[styles.cardTitle, { fontSize: 18 }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 8 }]}><Text style={styles.sectionTitle}>Management</Text></View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[
            { title: 'Supplier Management', sub: 'Add, edit and manage suppliers', icon: 'people', color: '#FFC107', route: '/suppliers' },
            { title: 'Fleet Management', sub: 'Manage buses, maintenance', icon: 'bus', color: '#3298dc', route: '/suppliers' },
            { title: 'Performance Reports', sub: 'View supplier performance scores', icon: 'analytics', color: '#4ade80', route: '/suppliers' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.verticalCard, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => router.push(item.route)}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.color + '20', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.verticalTitle}>{item.title}</Text>
                <Text style={styles.verticalSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8690A9" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// -------------------------------------------------------------
// STAFF/ADMIN DASHBOARD
// -------------------------------------------------------------
const StaffDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState({ revenue: '0', buses: '0', routes: '0', users: '0' });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    setLoading(true);
    try {
      let revData = [], routeData = [], busData = [], userData = [];

      try { const res = await getRevenue(); revData = res.data; } catch (e) { console.error('Revenue API failed:', e.response?.data || e.message); }
      try { const res = await getBusRoutes(); routeData = res.data; } catch (e) { console.error('Routes API failed:', e.response?.data || e.message); }
      try { const res = await getBuses(); busData = res.data; } catch (e) { console.error('Buses API failed:', e.response?.data || e.message); }
      try { const res = await getUsers(); userData = res.data; } catch (e) { console.error('Users API failed:', e.response?.data || e.message); }

      const totalRevenue = (revData || []).reduce((acc, curr) => acc + (curr.ticketSales || curr.amount || 0), 0);

      setStats({
        revenue: `Rs. ${totalRevenue.toLocaleString()}`,
        routes: (routeData || []).length.toString(),
        buses: (busData || []).length.toString(),
        users: (userData || []).length.toString()
      });
    } catch (err) {
      console.error('Failed to process staff stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        <View style={[styles.sectionHeader, { marginTop: 0 }]}><Text style={styles.sectionTitle}>System Operations</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' }}>
          {[
            { title: 'Active Buses', value: stats.buses, icon: 'bus', color: '#3298dc' },
            { title: 'Active Routes', value: stats.routes, icon: 'map', color: '#4ade80' },
            { title: 'Total Users', value: stats.users, icon: 'people', color: '#f3be0f' },
            { title: 'Total Revenue', value: stats.revenue, icon: 'cash', color: '#FFC107' }
          ].map((s, i) => (
            <View key={i} style={[styles.horizontalCard, { width: '48%', marginBottom: 16 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.color + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.cardSub}>{s.title}</Text>
              <Text style={[styles.cardTitle, { fontSize: 18 }]}>{loading ? '...' : s.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionHeader, { marginTop: 8 }]}><Text style={styles.sectionTitle}>Quick Access</Text></View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[
            { title: 'Route Scheduling', sub: 'Manage routes and schedules', icon: 'map', color: '#FFC107', route: '/routes' },
            { title: 'Booking Management', sub: 'View and manage bookings', icon: 'ticket', color: '#3298dc', route: '/bookings' },
            { title: 'Financial Dashboard', sub: 'Revenue, salaries, reports', icon: 'cash', color: '#4ade80', route: '/finance' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.verticalCard, { flexDirection: 'row', alignItems: 'center' }]} onPress={() => router.push(item.route)}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: item.color + '20', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.verticalTitle}>{item.title}</Text>
                <Text style={styles.verticalSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8690A9" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function Home() {
  const { userRole } = useAuth();

  if (userRole === 'driver') return <DriverDashboard />;
  if (userRole === 'finance') return <Redirect href="/finance" />;
  if (userRole === 'supplier') return <SupplierDashboardHome />;
  if (userRole === 'admin' || userRole === 'super-admin' || userRole === 'staff') return <StaffDashboard />;

  // Default to Passenger Dashboard
  return <PassengerDashboard />;
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  mapContainer: { height: 260, backgroundColor: '#141926', overflow: 'hidden', position: 'relative' },
  mapPlaceholder: { flex: 1, backgroundColor: '#1A1D24', justifyContent: 'center', alignItems: 'center' },
  liveBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#2D2915', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  liveBadgeFloat: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(45, 41, 21, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFC107', marginRight: 6 },
  liveText: { color: '#FFC107', fontSize: 10, fontWeight: 'bold' },
  busMarker: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },
  endpointMarker: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  searchContainer: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#232940', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 12 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: '#FFC107', fontSize: 14, fontWeight: '600' },

  horizontalScroll: { paddingHorizontal: 16 },
  horizontalCard: { backgroundColor: '#141926', borderRadius: 16, padding: 16, marginHorizontal: 4, width: 120, borderWidth: 1, borderColor: '#232940' },
  horizontalIconBox: { width: 36, height: 36, backgroundColor: '#FFC107', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  cardSub: { color: '#8690A9', fontSize: 11, marginTop: 4 },

  verticalList: { paddingHorizontal: 20, gap: 12 },
  verticalCard: { backgroundColor: '#141926', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#232940' },
  verticalCardTop: { flexDirection: 'row', alignItems: 'center' },
  verticalIconBox: { width: 48, height: 48, backgroundColor: '#FFC107', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  verticalInfo: { flex: 1 },
  verticalTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  verticalSub: { color: '#8690A9', fontSize: 12 },
  verticalRight: { alignItems: 'flex-end' },
  verticalTime: { color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  verticalStatus: { color: '#8690A9', fontSize: 10, letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cardBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#232940', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cardBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },

  // Driver Dashboard Styles
  activeTripBox: { backgroundColor: '#141926', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: 20, borderWidth: 1, borderColor: '#232940', borderTopWidth: 0 },
  activeTripHeader: { backgroundColor: '#FFC107', margin: -20, padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  currentTripText: { color: '#000', fontSize: 12, fontWeight: 'bold', marginLeft: 6, letterSpacing: 1 },
  exBadge: { backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  exBadgeText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  activeTripMain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  activeTripRoute: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  activeTripStatus: { color: '#FFC107', fontSize: 13, fontWeight: 'bold' },
  activeTripTime: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 30 },
  activeTripDest: { color: '#8690A9', fontSize: 10, letterSpacing: 1 },
  nextStopBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1D24', padding: 16, borderRadius: 12, marginBottom: 20 },
  nextStopIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2D2915', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  nextStopLabel: { color: '#8690A9', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  nextStopName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  tripActionsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  emergencyBtn: { flex: 1, backgroundColor: '#E53935', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  emergencyText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  busDetailsBtn: { flex: 1, backgroundColor: '#FFC107', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  busDetailsText: { color: '#000', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  tripTicketBtn: { flex: 1, backgroundColor: '#FFC107', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12 },
  tripTicketText: { color: '#000', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
  activeBookingCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#FFC107', shadowColor: '#FFC107', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  activeLabel: { color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  activeStatus: { color: '#FFC107', fontSize: 12, fontWeight: 'bold' },
  activeRoute: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  activeTime: { color: '#fff', fontSize: 14, marginLeft: 6 },
  activeSeat: { color: '#FFC107', fontSize: 14, fontWeight: 'bold' },
  filterBtn: { padding: 10 },

  shareBtn: { backgroundColor: '#232940', width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  // SOS Modal Styles
  sosOverlay: { flex: 1, backgroundColor: '#0B0F19', padding: 24, alignItems: 'center' },
  sosTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 20, marginBottom: 60 },
  sosTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textTransform: 'lowercase' },
  sosAlertText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 40 },
  sosCircle: { width: 140, height: 140, borderRadius: 70, borderWeight: 4, borderColor: '#E53935', borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#E53935', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  sosCountdown: { color: '#fff', fontSize: 44, fontWeight: 'bold' },
  sosSecondsLabel: { color: '#8690A9', fontSize: 12, letterSpacing: 2, marginBottom: 60 },
  sosInfoText: { color: '#8690A9', fontSize: 14, textAlign: 'center', marginBottom: 40, paddingHorizontal: 40, lineHeight: 22 },
  sosCancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 60, paddingVertical: 14, borderRadius: 10, marginBottom: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sosCancelText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sosActionRow: { flexDirection: 'row', gap: 16, width: '100%' },
  sosCallBtn: { flex: 1, backgroundColor: '#E53935', paddingVertical: 20, borderRadius: 12, alignItems: 'center', gap: 8 },
  sosPatrolBtn: { flex: 1, backgroundColor: '#E53935', paddingVertical: 20, borderRadius: 12, alignItems: 'center', gap: 8 },
  sosActionLabel: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  sosFooter: { position: 'absolute', bottom: 30, flexDirection: 'row', alignItems: 'center' },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 10 },
  gpsText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Modal Overlay Styles
  modalFullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  modalFullContent: { flex: 1, backgroundColor: '#0B0F19', marginTop: 50, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#232940' },
  modalHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalPadding: { padding: 20 },

  // Hero Section
  busHeroSection: { height: 240, position: 'relative' },
  busHeroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  busHeroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(11, 15, 25, 0.6)' },
  busHeroTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  busHeroSub: { color: '#FFC107', fontSize: 14, marginTop: 4, fontWeight: '600' },
  premiumBadge: { backgroundColor: '#FFC107', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 8 },
  premiumText: { color: '#000', fontSize: 10, fontWeight: 'bold' },

  // Amenities Grid
  amenitiesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  amenitySquare: { backgroundColor: '#141926', width: '31%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#232940' },
  amenitySquareText: { color: '#8690A9', fontSize: 11, fontWeight: '600' },

  // Spec Card
  specCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#232940' },
  specRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  specLabel: { flex: 1, color: '#8690A9', fontSize: 14, marginLeft: 15 },
  specValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Technical Grid
  alertBanner: { backgroundColor: '#4ade80', flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  alertTitle: { color: '#000', fontSize: 15, fontWeight: 'bold' },
  alertSub: { color: '#000', fontSize: 12, opacity: 0.8 },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridItem: { flex: 1, backgroundColor: '#141926', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#232940' },
  gridLabel: { color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  gridValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  progressBar: { height: 4, backgroundColor: '#232940', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  infoCol: { flex: 1, backgroundColor: '#141926', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#232940', alignItems: 'center' },
  infoLabel: { color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  infoValText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subSectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  reminderCard: { backgroundColor: '#141926', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#232940' },
  reminderIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c2130', justifyContent: 'center', alignItems: 'center' },
  reminderTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  reminderSub: { color: '#8690A9', fontSize: 12, marginTop: 2 },
  priorityBadge: { backgroundColor: '#232940', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priorityText: { color: '#8690A9', fontSize: 9, fontWeight: 'bold' },
  reportBtnAction: { backgroundColor: '#232940', paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 25, borderWidth: 1, borderColor: '#30374e' },
  reportBtnActionText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#232940', marginVertical: 4 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 10 },
  reportBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  
  // Incident Form Extras
  inputLabel: { color: '#8690A9', fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: 20, letterSpacing: 0.5 },
  textInput: { color: '#fff', fontSize: 15, lineHeight: 22 },
  severityOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#232940' },
  severityOptionText: { color: '#8690A9', fontSize: 11, fontWeight: 'bold' }
});
