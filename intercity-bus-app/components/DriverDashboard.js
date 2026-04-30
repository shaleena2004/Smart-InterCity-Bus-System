import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { AlertBanner } from './ui/AlertBanner';
import { API_BASE } from '../services/api';
import { io } from 'socket.io-client';

export default function DriverDashboard() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  
  const [vehicle, setVehicle] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [successTaskId, setSuccessTaskId] = useState(null);
  const [sendingSOS, setSendingSOS] = useState(false);

  // Modal Incident
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState(null);

  // SOS Hold logic
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef(null);
  const progressInterval = useRef(null);

  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      console.log('Driver socket connected', socket.id);
    });

    socket.on('issueUpdated', (data) => {
      if (data.vehicleId === vehicle?.vehicleId) {
        console.log('Issue updated:', data.issue);
        fetchDashboard(); // Refresh incidents
      }
    });


    return () => {
      socket.disconnect();
    };
  }, [vehicle?.vehicleId]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to close Book&Go?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() }
        ]);
        return true; 
      };
      if (Platform.OS === 'web') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      router.replace('/role');
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/driver/dashboard`, {
        headers: { 
          'x-user-role': role || 'driver',
          'x-user-phone': phone
        }
      });
      if (!res.ok) {
        throw new Error('Unable to retrieve dashboard data');
      }
      const data = await res.json();
      setVehicle(data.vehicle);
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.message || 'Error pulling assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleReportIssue = async () => {
    if (!formType || !formDesc) {
      if (Platform.OS === 'web') window.alert('Topic and Description are required.');
      else Alert.alert('Validation', 'Topic and Description are required.');
      return;
    }
    
    setSubmitting(true);
    try {
      const url = editingIncidentId ? `${API_BASE}/incidents/${editingIncidentId}` : `${API_BASE}/incidents`;
      const method = editingIncidentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || 'driver' },
        body: JSON.stringify({
          vehicleId: vehicle.vehicleId,
          type: formType,
          description: formDesc,
          priority: formPriority,
          reporter: phone || 'Driver'
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Submission failed');
      }
      
      setModalVisible(false);
      setEditingIncidentId(null);
      setFormType('');
      setFormDesc('');
      setFormPriority('medium');
      fetchDashboard();
      
      const msg = editingIncidentId ? 'Incident report updated.' : 'Incident reported to administration.';
      if (Platform.OS === 'web') window.alert('Success: ' + msg);
      else Alert.alert('Success', msg);
    } catch (err) {
      if (Platform.OS === 'web') window.alert('Error: ' + err.message);
      else Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditIncident = (inc) => {
     setEditingIncidentId(inc._id);
     setFormType(inc.type);
     setFormDesc(inc.description);
     setFormPriority(inc.priority || 'medium');
     setModalVisible(true);
  };

  const handleDeleteIncident = async (id) => {
    const confirmDelete = async () => {
      try {
        const res = await fetch(`${API_BASE}/incidents/${id}`, {
          method: 'DELETE',
          headers: { 'x-user-role': role || 'driver' }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Delete failed');
        }
        fetchDashboard();
        if (Platform.OS === 'web') window.alert('Incident report deleted.');
      } catch (err) {
        if (Platform.OS === 'web') window.alert('Error: ' + err.message);
        else Alert.alert('Error', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to remove this report?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Delete Report', 'Are you sure you want to remove this report?', [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete }
      ]);
    }
  };



  const handleSOS = () => {
    if (!vehicle) return;
    router.push({ pathname: '/sos', params: { role: role || 'driver', phone: phone || 'Driver' } });
  };

  const startSOSHold = () => {
    if (sendingSOS) return;
    setHoldProgress(0.01);
    
    // Smooth progress update for UI
    let startTime = Date.now();
    progressInterval.current = setInterval(() => {
      let elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / 3000, 1);
      setHoldProgress(progress);
    }, 50);

    holdTimer.current = setTimeout(() => {
      cancelSOSHold();
      handleSOS();
    }, 3000);
  };

  const cancelSOSHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    setHoldProgress(0);
  };


  const renderStatus = (status) => {
    const map = {
      'ready': { label: 'VEHICLE READY', color: Colors.success, bg: 'rgba(76, 175, 80, 0.1)' },
      'not_ready': { label: 'NOT READY', color: '#ff4444', bg: 'rgba(255, 68, 68, 0.1)' },
      'under_maintenance': { label: 'UNDER MAINTENANCE', color: Colors.warning, bg: 'rgba(255, 152, 0, 0.1)' },
    };
    return map[status] || map['not_ready'];
  };

  const statusBadge = (incidentStatus) => {
    const map = {
      pending: { label: 'PENDING', color: '#ff9800' },
      reported: { label: 'REPORTED', color: '#2196F3' },
      in_progress: { label: 'IN PROGRESS', color: Colors.primary },
      resolved: { label: 'RESOLVED', color: Colors.success },
      closed: { label: 'CLOSED', color: '#777' },
    };
    const mapped = map[incidentStatus] || { label: incidentStatus?.toUpperCase(), color: '#CCC' };
    return <Text style={{ color: mapped.color, fontSize: 11, fontWeight: 'bold' }}>{mapped.label}</Text>;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.appTitle}>BOOK&GO</Text>
          <Text style={styles.subtitle}>Driver Dashboard</Text>
        </View>

      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} tintColor={Colors.primary}/>}
      >
        <AlertBanner type="error" message={error} onRetry={fetchDashboard} />
        
        {loading && !vehicle ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 50 }} /> : null}

        {vehicle ? (
          <>

            <View style={styles.mapContainer}>
              <View style={styles.liveBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveText}>LIVE ROUTE TRACKING</Text>
              </View>
              <Ionicons name="map-outline" size={80} color="#333" />
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>Tracking active: Kaduwela Interchange</Text>
              </View>
            </View>

            <View style={styles.vehicleCard}>
               <View style={styles.vhHeader}>
                 <Ionicons name="bus" size={32} color={Colors.primary} />
                 <TouchableOpacity 
                   style={[styles.tripToggle, isTripStarted ? styles.tripStarted : styles.tripNotStarted]} 
                   onPress={() => setIsTripStarted(!isTripStarted)}
                   activeOpacity={0.8}
                 >
                    <Ionicons 
                      name={isTripStarted ? "stop-circle" : "play-circle"} 
                      size={18} 
                      color={isTripStarted ? "#000" : "#FFF"} 
                    />
                    <Text style={[styles.tripToggleText, isTripStarted ? { color: "#000" } : { color: "#FFF" }]}>
                     {isTripStarted ? 'TRIP STARTED' : 'NOT STARTED'}
                   </Text>
                 </TouchableOpacity>
               </View>
              <Text style={styles.vhNumber}>{vehicle.busNumber || vehicle.vehicleId}</Text>
              <Text style={styles.vhModel}>{vehicle.model} • {vehicle.year}</Text>
              
              <View style={styles.meterGrid}>
                  <View style={styles.meterItem}>
                    <Text style={styles.meterLabel}>Total Mileage</Text>
                    <Text style={styles.meterValue}>{vehicle.currentMileage} km</Text>
                  </View>
               </View>

              <TouchableOpacity 
                 style={[styles.sosCornerButton, (sendingSOS || holdProgress > 0) && { opacity: 0.9 }]} 
                 onPressIn={startSOSHold}
                 onPressOut={cancelSOSHold}
                 disabled={sendingSOS}
                 activeOpacity={0.8}
               >
                 {holdProgress > 0 && <View style={[styles.sosProgress, { width: `${holdProgress * 100}%` }]} />}
                  <View style={styles.sosInline}>
                    <Ionicons name="warning" size={18} color="#FFF" />
                    <Text style={styles.sosCornerText}>
                     {sendingSOS ? 'SOS SENT' : holdProgress > 0 ? `0${Math.ceil(3 - holdProgress * 3)}s` : 'SOS'}
                   </Text>
                 </View>
               </TouchableOpacity>
            </View>


             <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>My Incidents</Text>
                <TouchableOpacity style={styles.addIssueBtn} onPress={() => {
                  setEditingIncidentId(null);
                  setFormType('');
                  setFormDesc('');
                  setFormPriority('medium');
                  setModalVisible(true);
                }}>
                   <Ionicons name="add" size={18} color="#000" />
                  <Text style={styles.addIssueText}>Report</Text>
                </TouchableOpacity>
             </View>
            
            {incidents.length === 0 ? (
               <View style={styles.emptyIncidents}>
                 <Ionicons name="checkmark-done" size={32} color={Colors.textMuted} />
                 <Text style={styles.emptyText}>No incidents reported for this vehicle.</Text>
               </View>
            ) : (
                incidents.map((inc, index) => (
                  <View key={index} style={styles.incidentCard}>
                    <View style={styles.incHeader}>
                      <Text style={styles.incTitle}>{inc.type}</Text>
                      {statusBadge(inc.incidentStatus)}
                    </View>
                    <Text style={styles.incDesc} numberOfLines={2}>{inc.description}</Text>
                    
                    {inc.comments && inc.comments.length > 0 && (
                      <View style={styles.commentsPreview}>
                        <Text style={styles.commentsTitle}>Responses:</Text>
                        {inc.comments.map((c, i) => (
                          <View key={i} style={styles.commentLine}>
                            <Text style={styles.commentText}>
                              <Text style={styles.commentAuthor}>{c.actorRole.toUpperCase()}:</Text> {c.comment}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.incFooter}>
                       <Text style={styles.incMeta}>{new Date(inc.createdAt || Date.now()).toLocaleDateString()}</Text>
                       <View style={styles.actionGroup}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditIncident(inc)}>
                             <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteIncident(inc._id)}>
                             <Ionicons name="trash-outline" size={16} color="#ff4444" />
                          </TouchableOpacity>
                       </View>
                    </View>
                  </View>
                ))
            )}
            
          </>
        ) : !loading ? (
          <View style={styles.emptyIncidents}>
             <Ionicons name="bus-outline" size={48} color={Colors.textMuted} />
             <Text style={styles.emptyText}>You do not have a vehicle assigned to your profile.</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Report Incident Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingIncidentId ? 'Edit Incident' : 'Report Issue'}</Text>
            <View style={{ width: 50 }}/>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
             <Text style={styles.label}>Issue Component</Text>
             <TextInput style={styles.input} placeholder="e.g AC, Engine, Tire..." placeholderTextColor={Colors.textMuted} value={formType} onChangeText={setFormType}/>
             
             <Text style={styles.label}>Priority Level</Text>
             <View style={styles.priorityRow}>
               {['low', 'medium', 'high'].map(p => (
                 <TouchableOpacity key={p} style={[styles.pPill, formPriority === p && styles.pPillActive]} onPress={() => setFormPriority(p)}>
                   <Text style={[styles.pPillText, formPriority === p && {color:'#000'}]}>{p.toUpperCase()}</Text>
                 </TouchableOpacity>
               ))}
             </View>
             <Text style={styles.label}>Detailed Description</Text>
             <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="What exactly is wrong..." placeholderTextColor={Colors.textMuted} multiline value={formDesc} onChangeText={setFormDesc}/>
             
             <TouchableOpacity style={styles.submitBtn} onPress={handleReportIssue} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>{editingIncidentId ? 'Update Report' : 'Submit Report'}</Text>}
             </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 36, paddingBottom: 20 },
  titleGroup: { flex: 1 },
  appTitle: { color: '#FFD700', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#FFF', fontSize: 14, marginTop: 4 },
  logoutButton: { padding: 5 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  
  vehicleCard: { backgroundColor: '#1a1a1a', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333', position: 'relative' },
  vhHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tripToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 25,
  },
  tripStarted: {
    backgroundColor: Colors.primary,
  },
  tripNotStarted: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  tripToggleText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.8,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  vhNumber: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  vhModel: { color: Colors.textMuted, fontSize: 14, marginBottom: 20 },
  meterGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15, paddingRight: 80 },
  meterItem: { flex: 1 },
  meterLabel: { color: Colors.textMuted, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  meterValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  sosCornerButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#ff4444',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ff4444',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  sosInline: { flexDirection: 'row', alignItems: 'center' },
  sosCornerText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginLeft: 8 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionHeading: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  addIssueBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
  },
  addIssueText: { color: '#000', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },

  taskCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  taskTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  taskInfoText: { color: Colors.textMuted, fontSize: 13, marginLeft: 6 },
  taskActions: { flexDirection: 'row', marginTop: 15, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15, justifyContent: 'space-between' },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  completeBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold', marginLeft: 4 },
  reportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 8, borderRadius: 10 },
  reportBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginLeft: 4 },

  sosButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ff4444', 
    borderRadius: 16, 
    paddingVertical: 18, 
    marginBottom: 20,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  sosProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 0
  },
  sosButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8, zIndex: 1 },
  mapContainer: {
    height: 200,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
  },
  liveBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  liveText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold' },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    alignItems: 'center',
  },
  mapOverlayText: { color: '#AAA', fontSize: 11, fontWeight: '500' },

  emptyIncidents: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, backgroundColor: '#161616', borderRadius: 16 },
  emptyText: { color: Colors.textMuted, marginTop: 10, fontSize: 13 },

  incidentCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  incHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  incTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  incDesc: { color: Colors.textMuted, fontSize: 13, marginBottom: 15, lineHeight: 18 },
  incFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#252525', paddingTop: 12 },
  incMeta: { color: Colors.textMuted, fontSize: 12 },
  actionGroup: { flexDirection: 'row' },
  actionBtn: { marginLeft: 15, padding: 4 },

  modalArea: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeBtn: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  label: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, color: '#FFF', fontSize: 15, borderWidth: 1, borderColor: '#333' },
  priorityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pPill: { flex: 1, backgroundColor: '#1a1a1a', alignItems: 'center', paddingVertical: 12, marginHorizontal: 4, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  pPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pPillText: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 30 },
  submitText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  sosButton: { flexDirection: 'row', backgroundColor: '#e53935', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 20 },
  sosButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  commentsPreview: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 10, padding: 12, marginBottom: 15 },
  commentsTitle: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  commentLine: { marginBottom: 4 },
  commentText: { color: '#E0E0E0', fontSize: 13, lineHeight: 18 },
  commentAuthor: { fontWeight: 'bold', color: '#FFF' }
});
