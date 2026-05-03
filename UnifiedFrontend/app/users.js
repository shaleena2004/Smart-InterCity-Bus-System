import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUsers, getMaintenance } from '../services/api';
import { useEffect } from 'react';

export default function UsersScreen() {
  const { userRole } = useAuth();
  const [tab, setTab] = useState('home');

  const [users, setUsers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, mRes] = await Promise.all([
        getUsers(),
        getMaintenance()
      ]);
      setUsers(uRes.data);
      setMaintenance(mRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = userRole || 'admin';

  const ALL_TABS = [
    { k:'home', l:'Home', i:'home', roles: ['admin', 'driver', 'passenger', 'staff', 'supplier', 'finance'] },
    { k:'users', l:'Users', i:'people', roles: ['admin'] },
    { k:'maintenance', l:'Maint.', i:'build', roles: ['admin', 'staff', 'supplier'] },
  ];

  const filteredTabs = ALL_TABS.filter(t => t.roles.includes(role));

  const renderHome = () => (
    <View>
      {/* Trip Card (Only for drivers or admins) */}
      {(role === 'driver' || role === 'admin') && (
        <View style={styles.tripCard}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:12}}>
            <View style={styles.badge}><Text style={{color:'#f3be0f', fontSize:10, fontWeight:'bold'}}>CURRENT TRIP</Text></View>
            <View style={[styles.badge, {backgroundColor:'#333'}]}><Text style={{color:'#fff', fontSize:10}}>EX1-10</Text></View>
          </View>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:16}}>
            <View>
              <Text style={{color:'#fff', fontSize:18, fontWeight:'bold'}}>Negombo → Kaduwela</Text>
              <Text style={{color:'#f3be0f', fontSize:12, fontWeight:'bold'}}>In Transit</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={{color:'#fff', fontSize:26, fontWeight:'bold'}}>15<Text style={{fontSize:14}}> mins</Text></Text>
              <Text style={{color:'#8690A9', fontSize:10}}>TO KADAWATHA</Text>
            </View>
          </View>
          <View style={styles.nextStop}>
            <View style={styles.iconCircle}><Ionicons name="location" size={16} color="#f3be0f" /></View>
            <View><Text style={{color:'#8690A9', fontSize:10}}>NEXT STOP</Text><Text style={{color:'#fff', fontSize:14, fontWeight:'bold'}}>Kadawatha Interchange</Text></View>
          </View>
          <View style={{flexDirection:'row', gap:10, marginTop:12}}>
            <Pressable style={styles.sosBtn} onLongPress={()=>Alert.alert('SOS','Emergency services notified!')} delayLongPress={2000}>
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={{color:'#fff', fontWeight:'bold', marginLeft:6}}>EMERGENCY</Text>
            </Pressable>
            <TouchableOpacity style={[styles.actionCardBtn, {flex:1}]}>
              <Ionicons name="bus" size={18} color="#000" />
              <Text style={{color:'#000', fontWeight:'bold', marginLeft:6}}>BUS DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Saved Routes (Only for passengers or admins) */}
      {(role === 'passenger' || role === 'admin') && (
        <>
          <Text style={styles.sectionTitle}>Saved Routes</Text>
          <View style={{flexDirection:'row', gap:8}}>
            {[{t:'Home', sub:'138 Route', i:'home'},{t:'Work', sub:'120 Route', i:'briefcase'},{t:'Frequent', sub:'177 Route', i:'star'}].map((r,i)=>(
              <View key={i} style={styles.savedRoute}>
                <Ionicons name={r.i} size={22} color={i===0?'#f3be0f':'#8690A9'} />
                <Text style={{color:'#fff', fontWeight:'bold', marginTop:8, fontSize:13}}>{r.t}</Text>
                <Text style={{color:'#8690A9', fontSize:11}}>{r.sub}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Quick Access for Staff */}
      {(role === 'staff') && (
        <View style={styles.card}>
          <Text style={{color:'#fff', fontWeight:'bold', fontSize:16, marginBottom:10}}>Staff Operations</Text>
          <Text style={{color:'#8690A9', fontSize:14}}>Access maintenance reports using the tabs above to manage the fleet.</Text>
        </View>
      )}
    </View>
  );

  const renderUsers = () => (
    <View>
      <Text style={styles.sectionTitle}>User Management</Text>
      {users.length > 0 ? users.map(u => (
        <View key={u._id} style={styles.card}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:6}}>
            <Text style={{color:'#fff', fontWeight:'bold', fontSize:15}}>{u.name}</Text>
            <View style={[styles.roleBadge, {backgroundColor:(u.role==='admin'?'#f14668':u.role==='driver'?'#3298dc':'#4ade80')+'20'}]}>
              <Text style={{color:u.role==='admin'?'#f14668':u.role==='driver'?'#3298dc':'#4ade80', fontSize:11, fontWeight:'bold'}}>{u.role?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={{color:'#8690A9', fontSize:13}}>{u.phone} · {u.email}</Text>
        </View>
      )) : <Text style={{color: '#8690A9', textAlign: 'center', padding: 20}}>{loading ? 'Loading...' : 'No users found'}</Text>}
    </View>
  );

  const renderMaintenance = () => (
    <View>
      <Text style={styles.sectionTitle}>Maintenance Records</Text>
      {maintenance.length > 0 ? maintenance.map(m => (
        <View key={m._id} style={styles.card}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:6}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>{m.busId?.registrationNumber || 'Bus'} — {m.description}</Text>
            <Text style={{color:m.status==='completed'?'#4ade80':m.status==='pending'?'#f3be0f':'#3298dc', fontSize:12, fontWeight:'bold'}}>{m.status.toUpperCase()}</Text>
          </View>
          <Text style={{color:'#8690A9', fontSize:13}}>{new Date(m.date).toLocaleDateString()} · Rs. {m.cost?.toLocaleString()}</Text>
        </View>
      )) : <Text style={{color: '#8690A9', textAlign: 'center', padding: 20}}>{loading ? 'Loading...' : 'No records found'}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
      {filteredTabs.length > 1 && (
        <View style={styles.tabBar}>
          {filteredTabs.map(t=>(
            <TouchableOpacity key={t.k} style={[styles.tabItem, tab===t.k && styles.tabItemActive]} onPress={()=>setTab(t.k)}>
              <Ionicons name={t.i} size={16} color={tab===t.k?'#0B0F19':'#8690A9'} />
              <Text style={[styles.tabLabel, tab===t.k && {color:'#0B0F19'}]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{padding:20}}>
        {tab==='home' && renderHome()}
        {tab==='users' && renderUsers()}
        {tab==='maintenance' && renderMaintenance()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0B0F19' },
  tabBar: { flexDirection:'row', backgroundColor:'#141926', borderBottomWidth:1, borderBottomColor:'#232940' },
  tabItem: { flex:1, alignItems:'center', paddingVertical:12, gap:2 },
  tabItemActive: { backgroundColor:'#FFC107' },
  tabLabel: { color:'#8690A9', fontSize:11, fontWeight:'600' },
  sectionTitle: { color:'#fff', fontSize:16, fontWeight:'bold', marginBottom:14, marginTop:8 },
  tripCard: { backgroundColor:'#141926', borderRadius:20, padding:20, borderWidth:1, borderColor:'#232940', marginBottom:20 },
  badge: { backgroundColor:'rgba(243,190,15,0.15)', paddingHorizontal:10, paddingVertical:4, borderRadius:10 },
  nextStop: { flexDirection:'row', alignItems:'center', backgroundColor:'#0B0F19', padding:14, borderRadius:12 },
  iconCircle: { width:36, height:36, borderRadius:18, backgroundColor:'rgba(243,190,15,0.1)', justifyContent:'center', alignItems:'center', marginRight:14 },
  sosBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#f14668', borderRadius:12, paddingVertical:14 },
  actionCardBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#FFC107', borderRadius:12, paddingVertical:14 },
  savedRoute: { flex:1, backgroundColor:'#141926', borderRadius:12, padding:14, alignItems:'center', borderWidth:1, borderColor:'#232940' },
  card: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  roleBadge: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
});
