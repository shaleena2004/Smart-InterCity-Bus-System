import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIncidents, updateIncidentStatus } from '../services/api';

export default function EmergenciesScreen() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const openMaps = (lat, lng) => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  useEffect(() => {
    fetchIncidents(false);
    const intervalId = setInterval(() => {
      fetchIncidents(true);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchIncidents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getIncidents();
      // Filter out resolved/closed incidents if needed, or show all
      const activeIncidents = (res.data || []).filter(inc => inc.status !== 'resolved' && inc.status !== 'closed');
      setIncidents(activeIncidents);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIncident = async (id, newStatus) => {
    try {
      await updateIncidentStatus(id, newStatus);
      if (newStatus === 'resolved') {
        setIncidents(prev => prev.filter(inc => inc._id !== id));
      } else {
        setIncidents(prev => prev.map(inc => inc._id === id ? { ...inc, status: newStatus } : inc));
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update incident status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadCenter}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        <View style={{ backgroundColor: '#1A1D24', marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2D2915', marginTop: 16 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Active Emergencies</Text>
          
          {incidents.length === 0 ? (
            <Text style={{ color: '#8690A9', textAlign: 'center', marginTop: 20 }}>No active emergencies.</Text>
          ) : (
            incidents.map((inc, i) => {
              const isAcknowledged = inc.status === 'investigating' || inc.status === 'acknowledged';
              return (
                <View key={i} style={{ backgroundColor: '#141926', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2A2E3D' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ color: '#f14668', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>SOS ALERT RECEIVED</Text>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{inc.description}</Text>
                    </View>
                    <View style={{ backgroundColor: isAcknowledged ? '#FFC107' : '#f14668', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                      <Text style={{ color: isAcknowledged ? '#000' : '#fff', fontSize: 10, fontWeight: 'bold' }}>{isAcknowledged ? 'ACKNOWLEDGED' : 'PENDING'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#1C202B', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#8690A9', fontSize: 12, fontWeight: 'bold' }}>SENDER: <Text style={{ color: '#fff', fontWeight: 'normal' }}>{inc.userId?.name || 'Unknown'}</Text></Text>
                      <Text style={{ color: '#8690A9', fontSize: 12, fontWeight: 'bold' }}>PHONE: <Text style={{ color: '#fff', fontWeight: 'normal' }}>{inc.userId?.phone || 'Unknown'}</Text></Text>
                    </View>
                    <Text style={{ color: '#8690A9', fontSize: 12, fontWeight: 'bold' }}>VEHICLE: <Text style={{ color: '#fff', fontWeight: 'normal' }}>{(() => {
                      const busNo = inc.busId?.busNumber || inc.description.match(/Bus: ([^)]+)/)?.[1];
                      const plateNo = inc.busId?.plateNumber;
                      return busNo ? (plateNo ? `${busNo} (${plateNo})` : busNo) : 'Unknown';
                    })()}</Text></Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    {!isAcknowledged ? (
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#FFC107', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => handleUpdateIncident(inc._id, 'investigating')}
                      >
                        <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Acknowledge</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' }}
                        onPress={() => setSelectedIncident(inc)}
                      >
                        <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold' }}>View Details</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' }}
                      onPress={() => handleUpdateIncident(inc._id, 'resolved')}
                    >
                      <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold' }}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selectedIncident} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#141926', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2D2915' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Emergency Details</Text>
              <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                <Ionicons name="close" size={24} color="#8690A9" />
              </TouchableOpacity>
            </View>

            {selectedIncident && (
              <>
                <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 4 }}>SENDER</Text>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>{selectedIncident.userId?.name || 'Unknown'} - {selectedIncident.userId?.phone || 'Unknown'}</Text>

                <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 4 }}>VEHICLE</Text>
                <Text style={{ color: '#fff', fontSize: 16, marginBottom: 12 }}>{(() => {
                  const sBusNo = selectedIncident.busId?.busNumber || selectedIncident.description.match(/Bus: ([^)]+)/)?.[1];
                  const sPlateNo = selectedIncident.busId?.plateNumber;
                  return sBusNo ? (sPlateNo ? `${sBusNo} (${sPlateNo})` : sBusNo) : 'Unknown';
                })()}</Text>

                <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 4 }}>LOCATION</Text>
                {selectedIncident.location ? (
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#232940', padding: 10, borderRadius: 8 }} onPress={() => openMaps(selectedIncident.location.latitude, selectedIncident.location.longitude)}>
                    <Ionicons name="location" size={20} color="#FFC107" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold' }}>Open Location in Google Maps</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: '#fff', fontSize: 14, marginBottom: 16 }}>Location not provided</Text>
                )}

                <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 8 }}>EMERGENCY CONTACTS</Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#f14668', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => makeCall('119')}>
                      <Ionicons name="call" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Police (119)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFC107', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => makeCall('1990')}>
                      <Ionicons name="medkit" size={16} color="#000" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>Ambulance (1990)</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#3298dc', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => makeCall('110')}>
                      <Ionicons name="flame" size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Fire (110)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#4ade80', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} onPress={() => makeCall('1969')}>
                      <Ionicons name="car" size={16} color="#000" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>Highway (1969)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  loadCenter: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' },
});
