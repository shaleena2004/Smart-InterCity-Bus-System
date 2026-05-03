import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function RoutesScreen() {
  const router = useRouter();
  const { userRole, userId } = useAuth();
  const isStaff = userRole && userRole !== 'passenger' && userRole !== 'driver';
  const [tab, setTab] = useState('tracking');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [form, setForm] = useState({ routeName:'', routeNumber:'', startLocation:'', endLocation:'', busNumber:'', departureTime:'', arrivalTime:'', distance:'', stops:'', status:'On Time', ticketPrice:'' });

  useEffect(() => { 
    fetchRoutes(); 
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await api.get('/bus');
      setAvailableBuses(res.data || []);
    } catch(e) { console.log('Buses fetch:', e.message); }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/route'); 
      setRoutes(res.data || []); 
    } catch(e) { 
      console.log('Route fetch:', e.message); 
    }
    setLoading(false);
  };

  const saveSchedule = async () => {
    if (!form.routeName || !form.startLocation || !form.endLocation || !form.departureTime || !form.arrivalTime) { 
      Alert.alert('Error','Please fill all required fields'); 
      return; 
    }
    if (form.startLocation.trim().toLowerCase() === form.endLocation.trim().toLowerCase()) {
      Alert.alert('Error','Start and End locations cannot be the same');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        ticketPrice: form.ticketPrice ? Number(form.ticketPrice) : 0,
        stops: typeof form.stops === 'string' ? form.stops.split(',').map(s => ({ name: s.trim() })) : form.stops
      };
      
      if (isEditing) {
        const res = await api.put(`/route/${editingId}`, payload);
        setRoutes(routes.map(r => r._id === editingId ? res.data : r));
        Alert.alert('Updated', 'Route schedule updated successfully');
      } else {
        const res = await api.post('/route', payload);
        setRoutes([res.data, ...routes]);
        Alert.alert('Created', `Schedule ${form.routeName} added successfully`);
      }
      
      closeForm();
    } catch(e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRoute = (id) => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to remove this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/route/${id}`);
            setRoutes(routes.filter(r => r._id !== id));
          } catch(e) {
            Alert.alert('Error', 'Failed to delete route');
          }
        }}
      ]
    );
  };

  const openEdit = (route) => {
    setIsEditing(true);
    setEditingId(route._id);
    setForm({
      routeName: route.routeName,
      routeNumber: route.routeNumber || '',
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      busNumber: route.busNumber || '',
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      distance: route.distance || '',
      stops: route.stops ? route.stops.map(s => s.name).join(', ') : '',
      status: route.status || 'On Time',
      ticketPrice: route.ticketPrice ? route.ticketPrice.toString() : ''
    });
    setShowCreate(true);
  };

  const closeForm = () => {
    setShowCreate(false);
    setIsEditing(false);
    setEditingId(null);
    setForm({ routeName:'', routeNumber:'', startLocation:'', endLocation:'', busNumber:'', departureTime:'', arrivalTime:'', distance:'', stops:'', status:'On Time', ticketPrice:'' });
  };

  const statusColor = (s) => {
    const st = (s || '').toLowerCase();
    if(st.includes('active') || st.includes('on time')) return '#4ade80';
    if(st.includes('delayed')) return '#f14668';
    if(st.includes('completed')) return '#8690A9';
    return '#3298dc';
  };

  const handleStartTrip = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please login to start a trip');
      return;
    }
    try {
      await api.post('/booking', {
        user: userId,
        busRoute: `${selectedRoute.startLocation} → ${selectedRoute.endLocation}`,
        seatNumber: 'Assigned',
        date: selectedRoute.date || new Date().toISOString()
      });
      Alert.alert('Success', 'Trip started! Check your home dashboard.');
      setSelectedRoute(null);
      router.push('/');
    } catch(e) {
      Alert.alert('Error', 'Could not start trip');
    }
  };

  const renderTracking = () => (
    <View>
      {/* Map Simulation */}
      <View style={styles.mapSim}>
        <Ionicons name="map" size={48} color="#3298dc" style={{opacity:0.5}} />
        <Text style={{color:'#3298dc', fontWeight:'bold', marginTop:8}}>Live Route Map (Simulation)</Text>
        <View style={{flexDirection:'row', marginTop:12, gap:20}}>
          <View style={{alignItems:'center'}}>
            <View style={[styles.marker, {backgroundColor:'#e67e22'}]}><Ionicons name="bus" size={16} color="#fff" /></View>
            <Text style={styles.markerLabel}>Bus</Text>
          </View>
          <View style={{alignItems:'center'}}>
            <View style={[styles.marker, {backgroundColor:'#3498db'}]}><Ionicons name="person" size={16} color="#fff" /></View>
            <Text style={styles.markerLabel}>You</Text>
          </View>
          <View style={{alignItems:'center'}}>
            <View style={[styles.marker, {backgroundColor:'#2ecc71'}]}><Ionicons name="flag" size={16} color="#fff" /></View>
            <Text style={styles.markerLabel}>Dest</Text>
          </View>
        </View>
      </View>

      {/* Active Trip Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Active Trip Status</Text>
        <View style={styles.infoRow}><Ionicons name="location" size={20} color="#FFC107" /><View style={{marginLeft:12}}><Text style={styles.infoLabel}>Next Stop</Text><Text style={styles.infoValue}>{routes[0]?.endLocation || 'Pending...'}</Text></View></View>
        <View style={styles.infoRow}><Ionicons name="time" size={20} color="#FFC107" /><View style={{marginLeft:12}}><Text style={styles.infoLabel}>ETA</Text><Text style={styles.infoValue}>{routes[0]?.arrivalTime || '--:--'}</Text></View></View>
        <View style={styles.infoRow}><Ionicons name="bus" size={20} color="#FFC107" /><View style={{marginLeft:12}}><Text style={styles.infoLabel}>Bus</Text><Text style={styles.infoValue}>{routes[0]?.busNumber || 'N/A'}</Text></View></View>
      </View>

      {isStaff && (
        <TouchableOpacity style={styles.primaryBtn} onPress={()=>setShowCreate(true)}>
          <Ionicons name="add-circle" size={20} color="#000" />
          <Text style={styles.primaryBtnText}>New Schedule</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSchedules = () => (
    <View>
      {isStaff && (
        <TouchableOpacity style={[styles.primaryBtn, {marginBottom:16}]} onPress={()=>setShowCreate(true)}>
          <Ionicons name="add-circle" size={20} color="#000" />
          <Text style={styles.primaryBtnText}>Create New Schedule</Text>
        </TouchableOpacity>
      )}
      {loading ? <ActivityIndicator size="large" color="#FFC107" /> : 
        routes.length === 0 ? <Text style={{color:'#8690A9', textAlign:'center', marginTop:20}}>No routes available.</Text> :
        routes.map(r => (
        <TouchableOpacity key={r._id} style={styles.schedCard} onPress={() => setSelectedRoute(r)}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
            <Text style={{color:'#fff', fontWeight:'bold', fontSize:15}}>{r.routeName}</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
              <View style={[styles.statusBadge, {backgroundColor:statusColor(r.status)+'20'}]}>
                <Text style={{color:statusColor(r.status), fontSize:11, fontWeight:'bold'}}>{(r.status || 'Scheduled').toUpperCase()}</Text>
              </View>
              {isStaff && (
                <View style={{flexDirection:'row', gap: 4}}>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); openEdit(r); }} style={styles.miniActionBtn}>
                    <Ionicons name="pencil" size={14} color="#FFC107" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={(e) => { e.stopPropagation(); deleteRoute(r._id); }} style={[styles.miniActionBtn, {borderColor:'#f1466820'}]}>
                    <Ionicons name="trash" size={14} color="#f14668" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <View style={{flexDirection:'row', gap:16, flexWrap: 'wrap'}}>
            <Text style={styles.schedSub}><Ionicons name="bus" size={12} /> {r.busNumber || 'N/A'}</Text>
            <Text style={styles.schedSub}><Ionicons name="time" size={12} /> {r.departureTime} - {r.arrivalTime}</Text>
            <Text style={styles.schedSub}><Ionicons name="pricetag" size={12} /> LKR {r.ticketPrice || 'N/A'}</Text>
          </View>
          <Text style={[styles.schedSub, {marginTop: 4}]}><Ionicons name="navigate" size={12} /> {r.startLocation} → {r.endLocation}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPerformance = () => (
    <View>
      <Text style={styles.cardTitle}>Schedule Performance</Text>
      {loading ? <ActivityIndicator size="large" color="#FFC107" /> : 
        routes.length === 0 ? <Text style={{color:'#8690A9', textAlign:'center', marginTop:20}}>No data available.</Text> :
        routes.map((r, idx) => {
        // Mock on-time performance based on route properties or index
        const onTime = Math.max(70, 100 - (idx * 5));
        return (
        <View key={r._id} style={styles.perfCard}>
          <Text style={{color:'#fff', fontWeight:'bold', marginBottom:8}}>{r.routeName}</Text>
          <View style={styles.perfBar}><View style={[styles.perfFill, {width:`${onTime}%`, backgroundColor: onTime>85?'#4ade80':onTime>70?'#f3be0f':'#f14668'}]} /></View>
          <Text style={{color:'#8690A9', fontSize:12, marginTop:4}}>{onTime}% on-time performance</Text>
        </View>
      )})}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
      <View style={styles.tabBar}>
        {[{k:'tracking',l:'Live Track',i:'navigate'},{k:'schedules',l:'Schedules',i:'calendar'},{k:'performance',l:'Performance',i:'analytics'}].map(t=>(
          <TouchableOpacity key={t.k} style={[styles.tab, tab===t.k && styles.tabActive]} onPress={()=>setTab(t.k)}>
            <Ionicons name={t.i} size={16} color={tab===t.k?'#0B0F19':'#8690A9'} />
            <Text style={[styles.tabText, tab===t.k && {color:'#0B0F19'}]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{padding:20}}>
        {tab==='tracking' && renderTracking()}
        {tab==='schedules' && renderSchedules()}
        {tab==='performance' && renderPerformance()}
      </View>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '100%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold', marginBottom:16}}>{isEditing ? 'Edit Schedule' : 'New Schedule'}</Text>
              
            <Text style={styles.inputLabel}>ROUTE NAME *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Colombo - Kandy" placeholderTextColor="#8690A9" value={form.routeName} onChangeText={v=>setForm({...form,routeName:v})} />
            
            <Text style={styles.inputLabel}>ROUTE NO</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 138, 120" placeholderTextColor="#8690A9" value={form.routeNumber} onChangeText={v=>setForm({...form,routeNumber:v})} />
            
            <Text style={styles.inputLabel}>START LOCATION *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Colombo Fort" placeholderTextColor="#8690A9" value={form.startLocation} onChangeText={v=>setForm({...form,startLocation:v})} />
            
            <Text style={styles.inputLabel}>END LOCATION *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Kandy Bus Stand" placeholderTextColor="#8690A9" value={form.endLocation} onChangeText={v=>setForm({...form,endLocation:v})} />
            
            <Text style={styles.inputLabel}>DEPARTURE TIME *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 08:30 AM" placeholderTextColor="#8690A9" value={form.departureTime} onChangeText={v=>setForm({...form,departureTime:v})} />
            
            <Text style={styles.inputLabel}>ARRIVAL TIME *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 01:15 PM" placeholderTextColor="#8690A9" value={form.arrivalTime} onChangeText={v=>setForm({...form,arrivalTime:v})} />
            
            <Text style={styles.inputLabel}>TICKET PRICE (LKR) *</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 1500" placeholderTextColor="#8690A9" keyboardType="numeric" value={form.ticketPrice} onChangeText={v=>setForm({...form,ticketPrice:v})} />
            
            <Text style={styles.inputLabel}>BUS SELECTION</Text>
            <View style={{flexDirection:'row', flexWrap:'wrap', gap: 8, marginBottom: 12}}>
              {availableBuses.map(b => (
                <TouchableOpacity key={b._id} style={[styles.busChip, form.busNumber===b.busNumber && styles.busChipActive]} onPress={()=>setForm({...form,busNumber:b.busNumber})}>
                  <Text style={[styles.busChipText, form.busNumber===b.busNumber && {color:'#0B0F19',fontWeight:'bold'}]}>{b.busNumber} ({b.seatCount} seats)</Text>
                </TouchableOpacity>
              ))}
              {availableBuses.length===0 && <Text style={{color:'#8690A9', fontSize:13}}>No buses available in fleet. Add buses in Supplier Portal.</Text>}
            </View>
            
            <Text style={styles.inputLabel}>PLACES BUS STOPS (Comma Separated)</Text>
            <TextInput style={styles.formInput} placeholder="e.g. Kadawatha, Nittambuwa, Kegalle" placeholderTextColor="#8690A9" value={form.stops} onChangeText={v=>setForm({...form,stops:v})} />
            
            <Text style={styles.inputLabel}>DISTANCE (km)</Text>
            <TextInput style={styles.formInput} placeholder="e.g. 115" placeholderTextColor="#8690A9" keyboardType="numeric" value={form.distance} onChangeText={v=>setForm({...form,distance:v})} />
            
              <View style={{flexDirection:'row', gap:8, marginTop: 10}}>
                <TouchableOpacity style={[styles.primaryBtn, {flex:1}]} onPress={saveSchedule} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.primaryBtnText}>{isEditing ? 'Update' : 'Create'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, {flex:1, backgroundColor:'#f14668'}]} onPress={closeForm}>
                  <Text style={[styles.primaryBtnText, {color: '#fff'}]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Selected Route Details Modal */}
      <Modal visible={!!selectedRoute} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {padding: 24, borderRadius: 20}]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 16}}>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>Route Details</Text>
              <TouchableOpacity onPress={() => setSelectedRoute(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {selectedRoute && (
              <View style={{width:'100%', gap: 12}}>
                <Text style={{color:'#FFC107', fontSize:18, fontWeight:'bold'}}>{selectedRoute.routeName}</Text>
                <Text style={{color:'#fff', fontSize:16}}><Ionicons name="navigate" /> {selectedRoute.startLocation} → {selectedRoute.endLocation}</Text>
                <Text style={{color:'#8690A9', fontSize:14}}><Ionicons name="time" /> {selectedRoute.departureTime} - {selectedRoute.arrivalTime}</Text>
                <Text style={{color:'#8690A9', fontSize:14}}><Ionicons name="map" /> Distance: {selectedRoute.distance || 'N/A'}</Text>
                
                <View style={{backgroundColor:'#232940', padding: 12, borderRadius: 8, marginTop: 10}}>
                  <Text style={{color:'#fff', fontWeight:'bold', marginBottom:4}}>Bus Details</Text>
                  <Text style={{color:'#8690A9', fontSize:14}}><Ionicons name="bus" /> Bus No: {selectedRoute.busNumber || 'N/A'}</Text>
                  <Text style={{color:'#8690A9', fontSize:14}}><Ionicons name="person" /> Status: {selectedRoute.status}</Text>
                </View>

                <View style={{flexDirection:'row', gap:8, marginTop: 20}}>
                  <TouchableOpacity style={[styles.primaryBtn, {flex:1, backgroundColor:'#3298dc'}]} onPress={() => { setTab('tracking'); setSelectedRoute(null); }}>
                    <Ionicons name="map" size={16} color="#fff" />
                    <Text style={[styles.primaryBtnText, {color:'#fff', fontSize:14}]}>View on Map</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, {flex:1}]} onPress={handleStartTrip}>
                    <Ionicons name="play" size={16} color="#000" />
                    <Text style={[styles.primaryBtnText, {fontSize:14}]}>Start Trip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0B0F19' },
  tabBar: { flexDirection:'row', backgroundColor:'#141926', borderBottomWidth:1, borderBottomColor:'#232940' },
  tab: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:14, gap:4 },
  tabActive: { backgroundColor:'#FFC107' },
  tabText: { color:'#8690A9', fontWeight:'600', fontSize:12 },
  cardTitle: { color:'#fff', fontSize:18, fontWeight:'bold', marginBottom:16 },
  mapSim: { backgroundColor:'#141926', borderRadius:16, padding:30, alignItems:'center', borderWidth:1, borderColor:'#232940', marginBottom:16 },
  marker: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  markerLabel: { color:'#8690A9', fontSize:10, marginTop:4 },
  infoCard: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:16 },
  infoTitle: { color:'#FFC107', fontSize:16, fontWeight:'bold', marginBottom:12 },
  infoRow: { flexDirection:'row', alignItems:'center', marginBottom:12 },
  infoLabel: { color:'#8690A9', fontSize:12 },
  infoValue: { color:'#fff', fontSize:15, fontWeight:'600' },
  primaryBtn: { backgroundColor:'#FFC107', borderRadius:12, paddingVertical:14, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8 },
  primaryBtnText: { color:'#000000', fontWeight:'bold', fontSize:15 },
  busChip: { paddingHorizontal:12, paddingVertical:8, borderRadius:16, backgroundColor:'#141926', borderWidth:1, borderColor:'#232940' },
  busChipActive: { backgroundColor:'#FFC107', borderColor:'#FFC107' },
  busChipText: { color:'#8690A9', fontSize:12 },
  schedCard: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  schedSub: { color:'#8690A9', fontSize:12 },
  statusBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  perfCard: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  perfBar: { height:8, backgroundColor:'#232940', borderRadius:4 },
  perfFill: { height:8, borderRadius:4 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', padding:20 },
  modalContent: { backgroundColor:'#141926', borderRadius:20, padding:24, borderWidth:1, borderColor:'#232940', maxHeight: '90%' },
  inputLabel: { color:'#8690A9', fontSize:10, fontWeight:'bold', marginBottom:4, marginLeft:4 },
  formInput: { backgroundColor:'#1c2130', color:'#fff', borderRadius:12, paddingHorizontal:16, paddingVertical:12, fontSize:15, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  miniActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1c2130', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
});
