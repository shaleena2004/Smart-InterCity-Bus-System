import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocalSearchParams } from 'expo-router';

const SimpleDatePicker = ({ value, onChange, label }) => {
  const [show, setShow] = useState(false);
  const years = ['2024','2025','2026','2027','2028'];
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const days = Array.from({length: 31}, (_, i) => (i+1).toString().padStart(2, '0'));
  
  const [y, setY] = useState(value ? value.split('-')[0] : '2026');
  const [m, setM] = useState(value ? value.split('-')[1] : '05');
  const [d, setD] = useState(value ? value.split('-')[2] : '01');

  return (
    <View style={{marginBottom: 12}}>
      <TouchableOpacity style={styles.fInput} onPress={() => setShow(!show)}>
        <Text style={{color: value ? '#fff' : '#8690A9'}}>{value || label}</Text>
      </TouchableOpacity>
      {show && (
        <View style={{backgroundColor:'#141926', padding: 12, borderRadius: 12, borderWidth:1, borderColor:'#232940'}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
            {years.map(yr => (
              <TouchableOpacity key={yr} style={[styles.amenityChip, y===yr && styles.amenityActive]} onPress={()=>setY(yr)}><Text style={[styles.amenityText, y===yr && {color:'#0B0F19'}]}>{yr}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:8}}>
            {months.map(mo => (
              <TouchableOpacity key={mo} style={[styles.amenityChip, m===mo && styles.amenityActive]} onPress={()=>setM(mo)}><Text style={[styles.amenityText, m===mo && {color:'#0B0F19'}]}>{mo}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            {days.map(dy => (
              <TouchableOpacity key={dy} style={[styles.amenityChip, d===dy && styles.amenityActive]} onPress={()=>setD(dy)}><Text style={[styles.amenityText, d===dy && {color:'#0B0F19'}]}>{dy}</Text></TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.addBtn, {marginBottom:0}]} onPress={() => { onChange(`${y}-${m}-${d}`); setShow(false); }}><Text style={styles.addBtnText}>Set Date</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function SuppliersScreen() {
  const { tab: initialTab, busId, action } = useLocalSearchParams();
  const { userRole } = useAuth();
  const isStaff = userRole && userRole !== 'passenger' && userRole !== 'driver';
  const [tab, setTab] = useState(initialTab || 'dashboard');
  const [suppliers, setSuppliers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('supplier');
  const [selectedBus, setSelectedBus] = useState(null);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showMForm, setShowMForm] = useState(false);
  const [mForm, setMForm] = useState({ issue:'', description:'', priority:'Medium', category:'Engine', date:'' });
  const [showUpdateMaintenance, setShowUpdateMaintenance] = useState(false);
  const [form, setForm] = useState({ name:'', companyName:'', email:'', phone:'', status:'active', userId:'' });
  const [users, setUsers] = useState([]);
  const [busForm, setBusForm] = useState({ 
    busNumber:'', capacity:'', busType:'AC', supplierId:'', brand:'', model:'',
    wifi: false, ac: true, charging: false,
    operationalDays:[], insuranceCompany:'', insurancePolicy:'', insuranceExpiry:'', licenseExpiry:'', 
    engineHealth:'', fuelLevel:'', batteryStatus:'', coolantTemp:'', maintenanceMileage:'', maintenanceDate:'', maintenanceDetails:'', status:'active' 
  });

  const insuranceCompanies = ['Sri Lanka Insurance', 'Ceylinco General', 'Allianz Lanka', 'Janashakthi', 'LOLC General', 'HNB General', 'Fairfirst Insurance'];
  const busBrands = [
    { brand: 'Tata', models: ['LP 1512', 'Starbus', 'LPO 1618'] },
    { brand: 'Ashok Leyland', models: ['Viking', 'Cheetah', 'Falcon'] },
    { brand: 'Mercedes-Benz', models: ['Citaro', 'Tourismo', 'Sprinter'] },
    { brand: 'Mitsubishi', models: ['Fuso Rosa', 'Aero Queen'] },
    { brand: 'Isuzu', models: ['Journey', 'Erga'] },
    { brand: 'Hino', models: ['Selega', 'Liesse'] }
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, uRes] = await Promise.all([api.get('/supplier'), api.get('/bus'), api.get('/user')]);
      setSuppliers(sRes.data || []);
      setBuses(bRes.data || []);
      setUsers((uRes.data || []).filter(u => u.role === 'supplier'));
    } catch (e) {
      console.log('Fetch error:', e.message);
      // Fallback mock data
      setSuppliers([
        { _id:'1', name:'Sunil Transport', companyName:'Sunil & Sons', email:'sunil@mail.com', phone:'0771234567', status:'active' },
        { _id:'2', name:'Kamal Logistics', companyName:'KL Travels', email:'kamal@mail.com', phone:'0779876543', status:'active' },
        { _id:'3', name:'Perera Motors', companyName:'PM Bus Service', email:'perera@mail.com', phone:'0771112233', status:'inactive' },
      ]);
      setBuses([
        { _id:'1', busNumber:'NC-4521', capacity:54, status:'active', supplier:'Sunil Transport' },
        { _id:'2', busNumber:'NB-9988', capacity:48, status:'active', supplier:'Kamal Logistics' },
        { _id:'3', busNumber:'ND-1122', capacity:54, status:'maintenance', supplier:'Perera Motors' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading && busId && buses.length > 0) {
      const bus = buses.find(b => b._id === busId || b.plateNumber === busId);
      if (bus) {
        setSelectedBus(bus);
        if (action === 'maintenance') {
          setBusForm({
            ...busForm,
            brand: bus.brand || '',
            model: bus.model || '',
            engineHealth: bus.technicalStatus?.engineHealth?.toString() || '100',
            fuelLevel: bus.technicalStatus?.fuelLevel?.toString() || '100',
            batteryStatus: bus.technicalStatus?.batteryStatus || '12.6V',
            coolantTemp: bus.technicalStatus?.coolantTemp?.toString() || '90',
            operationalDays: bus.operationalDays || [],
            insuranceCompany: bus.compliance?.insuranceCompany || '',
            maintenanceMileage: bus.maintenanceMileage?.toString() || '',
            maintenanceDate: bus.maintenanceDate || '',
            maintenanceDetails: bus.technicalStatus?.statusDetails || '',
            insuranceExpiry: bus.compliance?.insuranceExpiry || '',
            licenseExpiry: bus.compliance?.licenseExpiry || ''
          });
          setShowUpdateMaintenance(true);
        }
      }
    }
  }, [loading, busId, buses, action]);

  const addSupplier = async () => {
    if (!form.name || !form.companyName) { Alert.alert('Error','Fill required fields'); return; }
    try { await api.post('/supplier', form); } catch(e) { /* offline fallback */ }
    setSuppliers([{ _id: Date.now().toString(), ...form }, ...suppliers]);
    setShowModal(false); setForm({ name:'', companyName:'', email:'', phone:'', status:'active', userId:'' });
    Alert.alert('Success','Supplier added');
  };

  const addBus = async () => {
    if (!busForm.busNumber || !busForm.brand || !busForm.model) { Alert.alert('Error','Fill required fields'); return; }
    try { 
      const payload = {
        ...busForm,
        plateNumber: busForm.busNumber,
        brand: busForm.brand,
        model: busForm.model,
        operationalDays: busForm.operationalDays,
        seatCount: Number(busForm.capacity) || 54,
        amenities: { wifi: busForm.wifi, ac: busForm.ac, charging: busForm.charging },
        compliance: { 
          insuranceCompany: busForm.insuranceCompany,
          insurancePolicy: busForm.insurancePolicy
        }
      };
      if (busForm.insuranceExpiry) payload.compliance.insuranceExpiry = busForm.insuranceExpiry;
      if (busForm.licenseExpiry) payload.compliance.licenseExpiry = busForm.licenseExpiry;
      await api.post('/bus', payload); 
    } catch(e) { console.log(e); }
    fetchAll(); setShowModal(false); 
    setBusForm({ busNumber:'', capacity:'', busType:'AC', supplierId:'', brand:'', model:'', wifi:false, ac:true, charging:false, operationalDays:[], insuranceCompany:'', insurancePolicy:'', insuranceExpiry:'', licenseExpiry:'', status:'active' });
    Alert.alert('Success','Bus added');
  };

  const deleteSupplier = async (id) => {
    try { await api.delete(`/supplier/${id}`); } catch(e) {}
    setSuppliers(suppliers.filter(s=>s._id !== id));
  };
  
  const deleteBus = async (id) => {
    try { await api.delete(`/bus/${id}`); } catch(e) {}
    setBuses(buses.filter(b=>b._id !== id));
  };

  const addMaintenanceLog = async () => {
    if (!mForm.issue || !mForm.description) { Alert.alert('Error', 'Please fill all fields'); return; }
    try {
      const payload = { 
        issue: mForm.issue, 
        description: mForm.description, 
        priority: mForm.priority, 
        category: mForm.category, 
        date: mForm.date || new Date().toISOString() 
      };
      
      const updatedLogs = [...(selectedBus.maintenanceLogs || []), payload];
      await api.put(`/bus/${selectedBus._id}`, { maintenanceLogs: updatedLogs });
      
      Alert.alert('Success', 'Maintenance issue reported');
      setShowMForm(false);
      setMForm({ issue:'', description:'', priority:'Medium', category:'Engine', date:'' });
      fetchAll();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to report issue');
    }
  };

  const activeSuppliers = suppliers.filter(s=>s.status==='active').length;
  const activeBuses = buses.filter(b=>b.status==='active').length;

  if (loading) return <View style={styles.loadCenter}><ActivityIndicator size="large" color="#FFC107" /><Text style={{color:'#FFC107',marginTop:10}}>Loading...</Text></View>;

  const renderDashboard = () => (
    <View>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{suppliers.length}</Text><Text style={styles.statLabel}>Suppliers</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{activeBuses}</Text><Text style={styles.statLabel}>Active Fleet</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{activeSuppliers}</Text><Text style={styles.statLabel}>Active</Text></View>
      </View>

      <Text style={styles.sectionTitle}>MANAGEMENT CONSOLE</Text>
      <View style={styles.grid}>
        {[
          { t:'Suppliers', i:'people', onPress:()=>setTab('suppliers') },
          { t:'Fleet', i:'bus', onPress:()=>setTab('fleet') },
          { t:'Performance', i:'analytics', onPress:()=>setTab('performance') },
          { t:'Complaints', i:'chatbubbles', onPress:()=>setTab('complaints') },
        ].map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.gridItem} onPress={item.onPress}>
            <Ionicons name={item.i} size={28} color="#f3be0f" />
            <Text style={styles.gridText}>{item.t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {suppliers[0] && (
        <View style={styles.topCard}>
          <Text style={styles.sectionTitle}>TOP SUPPLIER</Text>
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{suppliers[0].name?.charAt(0)}</Text></View>
            <View style={{marginLeft:14}}>
              <Text style={{color:'#fff', fontSize:18, fontWeight:'bold'}}>{suppliers[0].name}</Text>
              <Text style={{color:'#8690A9', fontSize:13}}>{suppliers[0].companyName}</Text>
              <Text style={{color:'#4ade80', fontSize:12, fontWeight:'bold', marginTop:4}}>● ACTIVE</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderSuppliers = () => (
    <View>
      {isStaff && (
        <TouchableOpacity style={styles.addBtn} onPress={()=>{setModalType('supplier'); setShowModal(true);}}>
          <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.addBtnText}>Add Supplier</Text>
        </TouchableOpacity>
      )}
      {suppliers.map(s => (
        <View key={s._id} style={styles.card}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
            <Text style={{color:'#fff', fontWeight:'bold', fontSize:15}}>{s.name}</Text>
            <View style={[styles.badge, {backgroundColor:(s.status==='active'?'#4ade80':'#f14668')+'20'}]}>
              <Text style={{color:s.status==='active'?'#4ade80':'#f14668', fontSize:11, fontWeight:'bold'}}>{s.status?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.subText}>{s.companyName} · {s.email}</Text>
          <Text style={styles.subText}>{s.phone}</Text>
          {isStaff && (
            <TouchableOpacity style={styles.delBtn} onPress={()=>deleteSupplier(s._id)}>
              <Ionicons name="trash" size={16} color="#f14668" /><Text style={{color:'#f14668', fontSize:12, marginLeft:4}}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderFleet = () => (
    <View>
      {isStaff && (
        <TouchableOpacity style={styles.addBtn} onPress={()=>{setModalType('bus'); setShowModal(true);}}>
          <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.addBtnText}>Add Bus</Text>
        </TouchableOpacity>
      )}
      {buses.map(b => (
        <View key={b._id} style={styles.card}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start'}}>
            <TouchableOpacity style={{flex:1}} onPress={() => setSelectedBus(b)}>
              <View style={{flexDirection:'row', gap:12, alignItems:'center'}}>
                <View style={styles.gradeBox}><Ionicons name="bus" size={24} color="#000" /></View>
                <View>
                  <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>{b.busNumber}</Text>
                  <Text style={styles.subText}>{b.brand} {b.model} • {b.supplierId?.companyName || b.supplierId?.name || b.supplier || 'Unassigned'}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={{flexDirection:'row', gap:8}}>
              <TouchableOpacity onPress={() => { 
                setSelectedBus(b); 
                setBusForm({
                  ...busForm,
                  brand: b.brand || '',
                  model: b.model || '',
                  engineHealth: b.technicalStatus?.engineHealth?.toString() || '100',
                  fuelLevel: b.technicalStatus?.fuelLevel?.toString() || '100',
                  batteryStatus: b.technicalStatus?.batteryStatus || '12.6V',
                  coolantTemp: b.technicalStatus?.coolantTemp?.toString() || '90',
                  operationalDays: b.operationalDays || [],
                  insuranceCompany: b.compliance?.insuranceCompany || '',
                  maintenanceMileage: b.maintenanceMileage?.toString() || '',
                  maintenanceDate: b.maintenanceDate || '',
                  maintenanceDetails: b.technicalStatus?.statusDetails || '',
                  insuranceExpiry: b.compliance?.insuranceExpiry || '',
                  licenseExpiry: b.compliance?.licenseExpiry || ''
                });
                setShowUpdateMaintenance(true); 
              }}>
                <Ionicons name="construct-outline" size={22} color="#FFC107" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteBus(b._id)}>
                <Ionicons name="trash-outline" size={22} color="#f14668" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPerformance = () => (
    <View>
      <Text style={styles.sectionTitle}>SUPPLIER PERFORMANCE</Text>
      {suppliers.map((s, i) => {
        const score = 95 - (i*10);
        const grade = score>=90?'A+':score>=80?'A':score>=70?'B':'C';
        return (
          <View key={s._id} style={styles.card}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <Text style={{color:'#fff', fontWeight:'bold'}}>{s.name}</Text>
              <View style={styles.gradeBox}><Text style={styles.gradeText}>{grade}</Text></View>
            </View>
            <View style={styles.perfBar}><View style={[styles.perfFill, {width:`${score}%`, backgroundColor:score>=80?'#4ade80':score>=60?'#f3be0f':'#f14668'}]} /></View>
            <Text style={{color:'#8690A9', fontSize:12, marginTop:4}}>On-time: {score}%</Text>
          </View>
        );
      })}
    </View>
  );

  const renderComplaints = () => (
    <View>
      <Text style={styles.sectionTitle}>COMPLAINTS & FEEDBACK</Text>
      {[
        { id:'1', title:'Bus AC not working', date:'2026-05-01', status:'open', bus:'NC-4521' },
        { id:'2', title:'Driver was rude', date:'2026-04-30', status:'resolved', bus:'NB-9988' },
        { id:'3', title:'Bus delayed by 1hr', date:'2026-04-29', status:'open', bus:'ND-1122' },
      ].map(c => (
        <View key={c.id} style={styles.card}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>{c.title}</Text>
            <Text style={{color:c.status==='open'?'#f14668':'#4ade80', fontSize:12, fontWeight:'bold'}}>{c.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.subText}>Bus: {c.bus} · {c.date}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
      <View style={styles.tabBar}>
        {[{k:'dashboard',l:'Home',i:'home'},{k:'suppliers',l:'Suppliers',i:'people'},{k:'fleet',l:'Fleet',i:'bus'},{k:'performance',l:'Perf.',i:'analytics'},{k:'complaints',l:'Feedback',i:'chatbubble'}].map(t=>(
          <TouchableOpacity key={t.k} style={[styles.tabItem, tab===t.k && styles.tabItemActive]} onPress={()=>setTab(t.k)}>
            <Ionicons name={t.i} size={16} color={tab===t.k?'#0B0F19':'#8690A9'} />
            <Text style={[styles.tabLabel, tab===t.k && {color:'#0B0F19'}]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{padding:20}}>
        {tab==='dashboard' && renderDashboard()}
        {tab==='suppliers' && renderSuppliers()}
        {tab==='fleet' && renderFleet()}
        {tab==='performance' && renderPerformance()}
        {tab==='complaints' && renderComplaints()}
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{color:'#fff',fontSize:20,fontWeight:'bold',marginBottom:16}}>{modalType==='supplier'?'Add Supplier':'Add Bus'}</Text>
            {modalType==='supplier' ? (
              <ScrollView style={{maxHeight: 400}} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>LINK USER ACCOUNT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                  <View style={{flexDirection:'row', gap:8}}>
                    <TouchableOpacity style={[styles.amenityChip, !form.userId && styles.amenityActive]} onPress={()=>setForm({...form, userId:''})}>
                      <Text style={[styles.amenityText, !form.userId && {color:'#0B0F19'}]}>None</Text>
                    </TouchableOpacity>
                    {users.map(u => (
                      <TouchableOpacity key={u._id} style={[styles.amenityChip, form.userId===u._id && styles.amenityActive]} onPress={()=>setForm({...form, userId:u._id, name: form.name || u.name, phone: form.phone || u.phone, email: form.email || u.email})}>
                        <Text style={[styles.amenityText, form.userId===u._id && {color:'#0B0F19'}]}>{u.name} ({u.phone})</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <TextInput style={styles.fInput} placeholder="Name" placeholderTextColor="#8690A9" value={form.name} onChangeText={v=>setForm({...form,name:v})} />
                <TextInput style={styles.fInput} placeholder="Company" placeholderTextColor="#8690A9" value={form.companyName} onChangeText={v=>setForm({...form,companyName:v})} />
                <TextInput style={styles.fInput} placeholder="Email" placeholderTextColor="#8690A9" value={form.email} onChangeText={v=>setForm({...form,email:v})} />
                <TextInput style={styles.fInput} placeholder="Phone" placeholderTextColor="#8690A9" value={form.phone} onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad" />
              </ScrollView>
            ) : (
              <ScrollView style={{maxHeight: 400}} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>SELECT SUPPLIER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                  <View style={{flexDirection:'row', gap:8}}>
                    {suppliers.map(s => (
                      <TouchableOpacity key={s._id} style={[styles.amenityChip, busForm.supplierId===s._id && styles.amenityActive]} onPress={()=>setBusForm({...busForm, supplierId:s._id})}>
                        <Text style={[styles.amenityText, busForm.supplierId===s._id && {color:'#0B0F19'}]}>{s.companyName || s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                
                <TextInput style={styles.fInput} placeholder="Bus Number (e.g. NC-4521)" placeholderTextColor="#8690A9" value={busForm.busNumber} onChangeText={v=>setBusForm({...busForm,busNumber:v})} />
                <TextInput style={styles.fInput} placeholder="Capacity (e.g. 54)" placeholderTextColor="#8690A9" value={busForm.capacity} onChangeText={v=>setBusForm({...busForm,capacity:v})} keyboardType="numeric" />
                
                <Text style={styles.inputLabel}>BRAND</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                  {busBrands.map(b => (
                    <TouchableOpacity 
                      key={b.brand} 
                      style={[styles.amenityChip, busForm.brand === b.brand && styles.amenityActive]} 
                      onPress={() => setBusForm({...busForm, brand: b.brand, model: ''})}
                    >
                      <Text style={[styles.amenityText, busForm.brand === b.brand && {color:'#000'}]}>{b.brand}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {busForm.brand ? (
                  <>
                    <Text style={styles.inputLabel}>MODEL</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                      {busBrands.find(b => b.brand === busForm.brand)?.models.map(m => (
                        <TouchableOpacity 
                          key={m} 
                          style={[styles.amenityChip, busForm.model === m && styles.amenityActive]} 
                          onPress={() => setBusForm({...busForm, model: m})}
                        >
                          <Text style={[styles.amenityText, busForm.model === m && {color:'#000'}]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <Text style={styles.inputLabel}>AMENITIES</Text>
                <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
                  <TouchableOpacity style={[styles.amenityChip, busForm.wifi && styles.amenityActive]} onPress={()=>setBusForm({...busForm,wifi:!busForm.wifi})}><Text style={[styles.amenityText, busForm.wifi && {color:'#0B0F19'}]}>WiFi</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.amenityChip, busForm.ac && styles.amenityActive]} onPress={()=>setBusForm({...busForm,ac:!busForm.ac})}><Text style={[styles.amenityText, busForm.ac && {color:'#0B0F19'}]}>AC</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.amenityChip, busForm.charging && styles.amenityActive]} onPress={()=>setBusForm({...busForm,charging:!busForm.charging})}><Text style={[styles.amenityText, busForm.charging && {color:'#0B0F19'}]}>Charging</Text></TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>INSURANCE COMPANY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                  {insuranceCompanies.map(c => (
                    <TouchableOpacity 
                      key={c} 
                      style={[styles.amenityChip, busForm.insuranceCompany === c && styles.amenityActive]} 
                      onPress={() => setBusForm({...busForm, insuranceCompany: c})}
                    >
                      <Text style={[styles.amenityText, busForm.insuranceCompany === c && {color:'#000'}]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>OPERATIONS & COMPLIANCE</Text>
                <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12}}>
                  {daysOfWeek.map(d => (
                    <TouchableOpacity key={d} style={[styles.amenityChip, busForm.operationalDays?.includes(d) && styles.amenityActive]} onPress={() => {
                      const newDays = busForm.operationalDays?.includes(d) ? busForm.operationalDays.filter(day => day !== d) : [...(busForm.operationalDays || []), d];
                      setBusForm({...busForm, operationalDays: newDays});
                    }}><Text style={[styles.amenityText, busForm.operationalDays?.includes(d) && {color:'#0B0F19'}]}>{d}</Text></TouchableOpacity>
                  ))}
                </View>

                <TextInput style={styles.fInput} placeholder="Insurance Policy No." placeholderTextColor="#8690A9" value={busForm.insurancePolicy} onChangeText={v=>setBusForm({...busForm,insurancePolicy:v})} />
                
                <Text style={styles.inputLabel}>INSURANCE EXPIRY</Text>
                <SimpleDatePicker value={busForm.insuranceExpiry} onChange={v=>setBusForm({...busForm,insuranceExpiry:v})} label="Select Insurance Expiry" />
                
                <Text style={styles.inputLabel}>LICENSE EXPIRY</Text>
                <SimpleDatePicker value={busForm.licenseExpiry} onChange={v=>setBusForm({...busForm,licenseExpiry:v})} label="Select License Expiry Date" />
              </ScrollView>
            )}
            <View style={{flexDirection:'row',gap:8}}>
              <TouchableOpacity style={[styles.addBtn,{flex:1}]} onPress={modalType==='supplier'?addSupplier:addBus}><Text style={styles.addBtnText}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn,{flex:1,backgroundColor:'#f14668'}]} onPress={()=>setShowModal(false)}><Text style={styles.addBtnText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selected Bus Details Modal */}
      <Modal visible={!!selectedBus && !showMaintenance && !showUpdateMaintenance} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(11, 15, 25, 0.95)', padding: 0 }]}>
          <View style={[styles.modalBox, { maxHeight: '100%', height: '100%', borderRadius: 0, padding: 0 }]}>
            
            {/* Header */}
            <View style={{flexDirection:'row', alignItems:'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#0B0F19'}}>
              <TouchableOpacity onPress={() => setSelectedBus(null)} style={{marginRight: 16}}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>Bus Details</Text>
            </View>

            {selectedBus && (
              <ScrollView showsVerticalScrollIndicator={false} style={{width:'100%', paddingHorizontal: 20}}>
                
                {/* Hero Image Section */}
                <View style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 20, backgroundColor: '#141926' }}>
                  <Image 
                    source={{ uri: 'file:///C:/Users/MSI SWORD/.gemini/antigravity/brain/5ca18274-85bc-45fb-98d6-7217aa1d2fd5/luxury_bus_hero_1777728747394.png' }} 
                    style={{ width: '100%', height: 220 }}
                    resizeMode="cover"
                  />
                   <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: '#FFC107', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>{selectedBus.busType === 'AC' ? 'LUXURY AC COACH' : 'EXPRESS NON-AC'}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{selectedBus.brand || selectedBus.model ? `${selectedBus.brand || ''} ${selectedBus.model || ''}`.trim() : 'BRAND & MODEL PENDING'}</Text>
                    <Text style={{ color: '#8690A9', fontSize: 14, marginTop: 4 }}>WP {selectedBus.busNumber} • {selectedBus.seatCount || 54} Seats</Text>
                  </View>
                </View>

                {/* Amenities Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 }}>
                  <View style={[styles.amenitySquare, { opacity: selectedBus.amenities?.wifi ? 1 : 0.3 }]}>
                    <Ionicons name="wifi" size={24} color="#FFC107" />
                    <Text style={styles.amenitySquareText}>Free WiFi</Text>
                  </View>
                  <View style={[styles.amenitySquare, { opacity: selectedBus.amenities?.charging ? 1 : 0.3 }]}>
                    <Ionicons name="flash" size={24} color="#FFC107" />
                    <Text style={styles.amenitySquareText}>Charging</Text>
                  </View>
                  <View style={[styles.amenitySquare, { opacity: selectedBus.amenities?.ac ? 1 : 0.3 }]}>
                    <Ionicons name="snow" size={24} color="#FFC107" />
                    <Text style={styles.amenitySquareText}>Full AC</Text>
                  </View>
                </View>

                {/* Seating Capacity Card */}
                <View style={styles.detailCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="body" size={24} color="#FFC107" style={{ marginRight: 15 }} />
                    <View>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Seating Capacity</Text>
                      <Text style={{ color: '#8690A9', fontSize: 12 }}>Spacious 2+2 layout</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#FFC107', fontSize: 18, fontWeight: 'bold' }}>{selectedBus.seatCount || 45} Seats</Text>
                </View>

                {/* Operational Days Section */}
                <View style={{ marginBottom: 25 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Ionicons name="calendar" size={20} color="#FFC107" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Operational Days</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {daysOfWeek.map(d => {
                      const isActive = selectedBus.operationalDays?.includes(d);
                      return (
                        <View key={d} style={[styles.dayBadge, !isActive && { backgroundColor: '#232940' }]}>
                          <Text style={[styles.dayBadgeText, !isActive && { color: '#8690A9' }]}>{d}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <Text style={{ color: '#8690A9', fontSize: 12, marginTop: 12 }}>Scheduled for active routes based on supplier availability.</Text>
                </View>

                {/* License & Insurance Section */}
                <View style={{ marginBottom: 30 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Ionicons name="shield-checkmark" size={20} color="#FFC107" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>License & Insurance</Text>
                  </View>
                  
                  {/* License Card */}
                  <View style={styles.complianceCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View>
                        <Text style={styles.compLabel}>LICENSE PLATE</Text>
                        <Text style={styles.compValueYellow}>WP {selectedBus.busNumber}</Text>
                        <Text style={[styles.compLabel, { marginTop: 15 }]}>EXPIRY DATE</Text>
                        <Text style={styles.compValueWhite}>{selectedBus.compliance?.licenseExpiry ? new Date(selectedBus.compliance.licenseExpiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Dec 15, 2025'}</Text>
                      </View>
                      <Ionicons name="card" size={32} color="#8690A9" opacity={0.5} />
                    </View>
                  </View>

                  {/* Insurance Card */}
                  <View style={[styles.complianceCard, { marginTop: 15 }]}>
                    <Text style={styles.compLabel}>INSURANCE POLICY</Text>
                    <View style={{ marginTop: 15, gap: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#8690A9', fontSize: 13 }}>Provider</Text>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{selectedBus.compliance?.insuranceCompany || 'Provider Not Set'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#8690A9', fontSize: 13 }}>Policy No.</Text>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{selectedBus.compliance?.insurancePolicy || 'N/A'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#8690A9', fontSize: 13 }}>Expiry</Text>
                        <Text style={{ color: '#FFC107', fontSize: 13, fontWeight: 'bold' }}>{selectedBus.compliance?.insuranceExpiry ? new Date(selectedBus.compliance.insuranceExpiry).toLocaleDateString() : 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Maintenance Button */}
                <TouchableOpacity 
                  style={[styles.addBtn, { marginTop: 10, marginBottom: 40 }]} 
                  onPress={() => setShowMaintenance(true)}
                >
                  <Ionicons name="construct" size={20} color="#000" />
                  <Text style={styles.addBtnText}>View Maintenance Details</Text>
                </TouchableOpacity>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Vehicle Maintenance Modal */}
      <Modal visible={showMaintenance} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: '#0B0F19', padding: 0 }]}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
              <TouchableOpacity onPress={() => setShowMaintenance(false)} style={{ marginRight: 16 }}>
                <Ionicons name="arrow-back" size={24} color="#FFC107" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Vehicle Maintenance</Text>
            </View>

            {selectedBus && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
                
                {/* Maintenance Alert */}
                <View style={{ backgroundColor: '#FFC107', borderRadius: 15, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
                  <Ionicons name="alert-circle" size={30} color="#000" style={{ marginRight: 15 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Maintenance Alert</Text>
                    <Text style={{ color: '#000', fontSize: 13 }}>Oil Change due in 3 days</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#000" />
                </View>

                {/* Bus Info Card */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25 }}>
                  <Image 
                    source={{ uri: 'file:///C:/Users/MSI SWORD/.gemini/antigravity/brain/5ca18274-85bc-45fb-98d6-7217aa1d2fd5/luxury_bus_hero_1777728747394.png' }} 
                    style={{ width: 80, height: 80, borderRadius: 15, marginRight: 15 }} 
                  />
                  <View>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Bus #{selectedBus.busNumber.split('-')[1] || '8824'}</Text>
                    <Text style={{ color: '#8690A9', fontSize: 14 }}>Mercedes-Benz Citaro • 2022</Text>
                    <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>● ACTIVE STATUS</Text>
                  </View>
                </View>

                {/* Maintenance Reminders */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Maintenance Reminders</Text>
                
                <View style={styles.reminderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>● HIGH PRIORITY</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 }}>Oil Change</Text>
                    <Text style={{ color: '#8690A9', fontSize: 12 }}>Engine performance optimization required.</Text>
                    <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginTop: 10 }}>Due in 500 km</Text>
                  </View>
                  <View style={styles.reminderIconBox}>
                    <Ionicons name="color-fill" size={30} color="#FFC107" />
                  </View>
                </View>

                <View style={[styles.reminderCard, { marginTop: 15, marginBottom: 25 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>● UPCOMING</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 }}>Tire Rotation</Text>
                    <Text style={{ color: '#8690A9', fontSize: 12 }}>Standard safety check & rotation.</Text>
                    <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginTop: 10 }}>Scheduled for Friday</Text>
                  </View>
                  <View style={styles.reminderIconBox}>
                    <Ionicons name="settings" size={30} color="#FFC107" />
                  </View>
                </View>

                {/* Technical Status Grid */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Technical Status</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 }}>
                  <View style={styles.techBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8690A9', fontSize: 11 }}>Engine Health</Text>
                      <Text style={{ color: selectedBus.technicalStatus?.engineHealth < 50 ? '#f14668' : '#4ade80', fontSize: 11, fontWeight: 'bold' }}>{selectedBus.technicalStatus?.engineHealth || 100}%</Text>
                    </View>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${selectedBus.technicalStatus?.engineHealth || 100}%`, backgroundColor: selectedBus.technicalStatus?.engineHealth < 50 ? '#f14668' : '#4ade80' }]} /></View>
                  </View>
                  <View style={styles.techBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#8690A9', fontSize: 11 }}>Fuel Level</Text>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{selectedBus.technicalStatus?.fuelLevel || 0}%</Text>
                    </View>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${selectedBus.technicalStatus?.fuelLevel || 0}%`, backgroundColor: '#FFC107' }]} /></View>
                  </View>
                  <View style={[styles.techBox, { marginTop: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="battery-charging" size={14} color="#4ade80" style={{ marginRight: 5 }} /><Text style={{ color: '#8690A9', fontSize: 11 }}>Battery Status</Text></View>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{selectedBus.technicalStatus?.batteryStatus || '12.6V'}</Text>
                    </View>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: '90%', backgroundColor: '#4ade80' }]} /></View>
                  </View>
                  <View style={[styles.techBox, { marginTop: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}><Ionicons name="thermometer" size={14} color="#f97316" style={{ marginRight: 5 }} /><Text style={{ color: '#8690A9', fontSize: 11 }}>Coolant Temp</Text></View>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{selectedBus.technicalStatus?.coolantTemp || 90}°C</Text>
                    </View>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(selectedBus.technicalStatus?.coolantTemp / 120) * 100 || 75}%`, backgroundColor: '#f97316' }]} /></View>
                  </View>
                </View>

                {/* Compliance & Safety */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Compliance & Safety</Text>
                <View style={styles.safetyCard}>
                  <View style={{ backgroundColor: '#4ade8020', padding: 10, borderRadius: 10, marginRight: 15 }}>
                    <Ionicons name="shield-checkmark" size={24} color="#4ade80" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Insurance Policy</Text>
                    <Text style={{ color: '#8690A9', fontSize: 12 }}>Valid until {selectedBus.compliance?.insuranceExpiry ? new Date(selectedBus.compliance.insuranceExpiry).toLocaleDateString() : 'Dec 2024'}</Text>
                  </View>
                  <View style={{ backgroundColor: '#4ade8020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#4ade80', fontSize: 10, fontWeight: 'bold' }}>ACTIVE</Text>
                  </View>
                </View>

                <View style={[styles.safetyCard, { marginTop: 15, marginBottom: 25 }]}>
                  <View style={{ backgroundColor: '#FFC10720', padding: 10, borderRadius: 10, marginRight: 15 }}>
                    <Ionicons name="card" size={24} color="#FFC107" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Vehicle License</Text>
                    <Text style={{ color: '#8690A9', fontSize: 12 }}>Expires on {selectedBus.compliance?.licenseExpiry ? new Date(selectedBus.compliance.licenseExpiry).toLocaleDateString() : 'N/A'}</Text>
                  </View>
                  <View style={{ backgroundColor: '#FFC10720', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: 'bold' }}>RENEW SOON</Text>
                  </View>
                </View>

                {/* Recent Activity Logs */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Recent Activity Logs</Text>
                {selectedBus.maintenanceLogs && selectedBus.maintenanceLogs.length > 0 ? (
                  selectedBus.maintenanceLogs.slice().reverse().map((log, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 20 }}>
                      <View style={{ alignItems: 'center', marginRight: 15 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: log.priority === 'High' ? '#f14668' : '#FFC107' }} />
                        <View style={{ width: 2, flex: 1, backgroundColor: '#232940', marginTop: 5 }} />
                      </View>
                      <View style={{ flex: 1, paddingBottom: 10 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{log.issue}</Text>
                        <Text style={{ color: '#8690A9', fontSize: 12, marginTop: 4 }}>{new Date(log.date).toLocaleDateString()} • {log.category}</Text>
                        <Text style={{ color: '#8690A9', fontSize: 11, marginTop: 2 }}>{log.description}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#8690A9' }}>No maintenance logs found.</Text>
                  </View>
                )}

                {/* Report Issue Button */}
                <TouchableOpacity 
                  style={{ backgroundColor: '#FFC107', borderRadius: 15, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 40 }}
                  onPress={() => setShowMForm(true)}
                >
                  <Ionicons name="warning" size={20} color="#000" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Report a New Issue</Text>
                </TouchableOpacity>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Maintenance Reporting Form Modal */}
      <Modal visible={showMForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 16}}>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>Report Maintenance Issue</Text>
              <TouchableOpacity onPress={() => setShowMForm(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{width:'100%'}}>
              <Text style={styles.inputLabel}>ISSUE TITLE</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. Unusual Engine Noise" 
                placeholderTextColor="#8690A9" 
                value={mForm.issue} 
                onChangeText={v => setMForm({...mForm, issue: v})} 
              />
              
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput 
                style={[styles.fInput, { height: 100, textAlignVertical: 'top' }]} 
                placeholder="Describe the problem in detail..." 
                placeholderTextColor="#8690A9" 
                multiline 
                value={mForm.description} 
                onChangeText={v => setMForm({...mForm, description: v})} 
              />

              <Text style={styles.inputLabel}>PRIORITY</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                {['Low', 'Medium', 'High'].map(p => (
                  <TouchableOpacity 
                    key={p} 
                    style={[styles.amenityChip, mForm.priority === p && { backgroundColor: p === 'High' ? '#f14668' : '#FFC107', borderColor: p === 'High' ? '#f14668' : '#FFC107' }]} 
                    onPress={() => setMForm({...mForm, priority: p})}
                  >
                    <Text style={[styles.amenityText, mForm.priority === p && { color: '#000' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                {['Engine', 'Brakes', 'Electrical', 'Tires', 'Body', 'Other'].map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.amenityChip, mForm.category === c && styles.amenityActive]} 
                    onPress={() => setMForm({...mForm, category: c})}
                  >
                    <Text style={[styles.amenityText, mForm.category === c && { color: '#000' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>DATE OF OBSERVATION</Text>
              <SimpleDatePicker 
                value={mForm.date} 
                onChange={v => setMForm({...mForm, date: v})} 
                label="Select Date" 
              />

              <TouchableOpacity style={[styles.addBtn, { marginTop: 20 }]} onPress={addMaintenanceLog}>
                <Text style={styles.addBtnText}>Submit Maintenance Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Maintenance Update Modal */}
      <Modal visible={showUpdateMaintenance} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '90%' }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 16}}>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>Update Maintenance</Text>
              <TouchableOpacity onPress={() => setShowUpdateMaintenance(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{width:'100%'}}>
              <Text style={styles.inputLabel}>BRAND</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                {busBrands.map(b => (
                  <TouchableOpacity 
                    key={b.brand} 
                    style={[styles.amenityChip, busForm.brand === b.brand && styles.amenityActive]} 
                    onPress={() => setBusForm({...busForm, brand: b.brand, model: ''})}
                  >
                    <Text style={[styles.amenityText, busForm.brand === b.brand && {color:'#000'}]}>{b.brand}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {busForm.brand ? (
                <>
                  <Text style={styles.inputLabel}>MODEL</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                    {busBrands.find(b => b.brand === busForm.brand)?.models.map(m => (
                      <TouchableOpacity 
                        key={m} 
                        style={[styles.amenityChip, busForm.model === m && styles.amenityActive]} 
                        onPress={() => setBusForm({...busForm, model: m})}
                      >
                        <Text style={[styles.amenityText, busForm.model === m && {color:'#000'}]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <Text style={styles.inputLabel}>INSURANCE COMPANY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row', gap:8, marginBottom:8}}>
                {insuranceCompanies.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.amenityChip, busForm.insuranceCompany === c && styles.amenityActive]} 
                    onPress={() => setBusForm({...busForm, insuranceCompany: c})}
                  >
                    <Text style={[styles.amenityText, busForm.insuranceCompany === c && {color:'#000'}]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>ENGINE HEALTH (%)</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. 85" 
                placeholderTextColor="#8690A9" 
                value={busForm.engineHealth} 
                onChangeText={v => setBusForm({...busForm, engineHealth: v})} 
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>FUEL LEVEL (%)</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. 60" 
                placeholderTextColor="#8690A9" 
                value={busForm.fuelLevel} 
                onChangeText={v => setBusForm({...busForm, fuelLevel: v})} 
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>BATTERY STATUS (V)</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. 12.6V" 
                placeholderTextColor="#8690A9" 
                value={busForm.batteryStatus} 
                onChangeText={v => setBusForm({...busForm, batteryStatus: v})} 
              />

              <Text style={styles.inputLabel}>COOLANT TEMP (°C)</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. 90" 
                placeholderTextColor="#8690A9" 
                value={busForm.coolantTemp} 
                onChangeText={v => setBusForm({...busForm, coolantTemp: v})} 
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>CURRENT MILEAGE (KM)</Text>
              <TextInput 
                style={styles.fInput} 
                placeholder="e.g. 12500" 
                placeholderTextColor="#8690A9" 
                value={busForm.maintenanceMileage} 
                onChangeText={v => setBusForm({...busForm, maintenanceMileage: v})} 
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>OPERATIONAL DAYS</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12}}>
                {daysOfWeek.map(d => (
                  <TouchableOpacity key={d} style={[styles.amenityChip, busForm.operationalDays?.includes(d) && styles.amenityActive]} onPress={() => {
                    const newDays = busForm.operationalDays?.includes(d) ? busForm.operationalDays.filter(day => day !== d) : [...(busForm.operationalDays || []), d];
                    setBusForm({...busForm, operationalDays: newDays});
                  }}><Text style={[styles.amenityText, busForm.operationalDays?.includes(d) && {color:'#0B0F19'}]}>{d}</Text></TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>LAST MAINTENANCE DATE</Text>
              <SimpleDatePicker 
                value={busForm.maintenanceDate} 
                onChange={v => setBusForm({...busForm, maintenanceDate: v})} 
                label="Select Date" 
              />

              <Text style={styles.inputLabel}>INSURANCE EXPIRY</Text>
              <SimpleDatePicker 
                value={busForm.insuranceExpiry} 
                onChange={v => setBusForm({...busForm, insuranceExpiry: v})} 
                label="Update Insurance Expiry" 
              />

              <Text style={styles.inputLabel}>LICENSE EXPIRY</Text>
              <SimpleDatePicker 
                value={busForm.licenseExpiry} 
                onChange={v => setBusForm({...busForm, licenseExpiry: v})} 
                label="Update License Expiry" 
              />

              <Text style={styles.inputLabel}>STATUS DETAILS</Text>
              <TextInput 
                style={[styles.fInput, { height: 80, textAlignVertical: 'top' }]} 
                placeholder="e.g. Oil filter changed, brakes inspected" 
                placeholderTextColor="#8690A9" 
                multiline
                value={busForm.maintenanceDetails} 
                onChangeText={v => setBusForm({...busForm, maintenanceDetails: v})} 
              />

              <TouchableOpacity 
                style={[styles.addBtn, { marginTop: 20 }]} 
                onPress={async () => {
                  try {
                    const payload = {
                      brand: busForm.brand,
                      model: busForm.model,
                      operationalDays: busForm.operationalDays,
                      technicalStatus: {
                        engineHealth: parseInt(busForm.engineHealth) || 100,
                        fuelLevel: parseInt(busForm.fuelLevel) || 100,
                        batteryStatus: busForm.batteryStatus || '12.6V',
                        coolantTemp: parseInt(busForm.coolantTemp) || 90,
                        statusDetails: busForm.maintenanceDetails
                      },
                      maintenanceMileage: busForm.maintenanceMileage ? parseInt(busForm.maintenanceMileage) : 0,
                      compliance: {
                        ...selectedBus.compliance,
                        insuranceCompany: busForm.insuranceCompany || selectedBus.compliance?.insuranceCompany,
                        insuranceExpiry: busForm.insuranceExpiry || selectedBus.compliance?.insuranceExpiry,
                        licenseExpiry: busForm.licenseExpiry || selectedBus.compliance?.licenseExpiry
                      }
                    };
                    if (busForm.maintenanceDate) payload.maintenanceDate = busForm.maintenanceDate;
                    const res = await api.put(`/bus/${selectedBus._id}`, payload);
                    Alert.alert('Success', 'Maintenance data updated');
                    setShowUpdateMaintenance(false);
                    setSelectedBus(res.data.bus); // Sync live data
                    setBusForm({...busForm, engineHealth:'', fuelLevel:'', batteryStatus:'', coolantTemp:'', maintenanceMileage:'', maintenanceDate:'', maintenanceDetails:'', insuranceExpiry:'', licenseExpiry:''});
                    fetchAll();
                  } catch (e) { Alert.alert('Error', 'Update failed: ' + (e.response?.data?.message || e.message)); }
                }}
              >
                <Text style={styles.addBtnText}>Save Maintenance Data</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0B0F19' },
  loadCenter: { flex:1, backgroundColor:'#0B0F19', justifyContent:'center', alignItems:'center' },
  tabBar: { flexDirection:'row', backgroundColor:'#141926', borderBottomWidth:1, borderBottomColor:'#232940' },
  tabItem: { flex:1, alignItems:'center', paddingVertical:12, gap:2 },
  tabItemActive: { backgroundColor:'#FFC107', borderRadius:0 },
  tabLabel: { color:'#8690A9', fontSize:10, fontWeight:'600' },
  sectionTitle: { color:'#fff', fontSize:14, fontWeight:'bold', letterSpacing:1, marginBottom:16 },
  statsRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:20 },
  stat: { flex:1, backgroundColor:'#141926', borderRadius:14, padding:16, alignItems:'center', marginHorizontal:4, borderWidth:1, borderColor:'#232940' },
  statNum: { color:'#fff', fontSize:22, fontWeight:'bold' },
  statLabel: { color:'#8690A9', fontSize:11, marginTop:4 },
  grid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:20 },
  gridItem: { width:'48%', backgroundColor:'#141926', borderRadius:14, padding:20, alignItems:'center', marginBottom:12, borderWidth:1, borderColor:'#232940' },
  gridText: { color:'#fff', marginTop:8, fontWeight:'bold', fontSize:13 },
  topCard: { backgroundColor:'#141926', borderRadius:14, padding:20, borderWidth:1, borderColor:'#232940' },
  avatar: { width:50, height:50, borderRadius:25, backgroundColor:'#232940', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#f3be0f' },
  avatarText: { color:'#f3be0f', fontSize:24, fontWeight:'bold' },
  card: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  subText: { color:'#8690A9', fontSize:13 },
  badge: { paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  addBtn: { backgroundColor:'#FFC107', borderRadius:12, paddingVertical:14, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, marginBottom:12 },
  addBtnText: { color:'#000000', fontWeight:'bold', fontSize:15 },
  delBtn: { flexDirection:'row', alignItems:'center', marginTop:10 },
  gradeBox: { backgroundColor:'#f3be0f', width:40, height:40, borderRadius:10, justifyContent:'center', alignItems:'center' },
  gradeText: { color:'#000', fontSize:18, fontWeight:'bold' },
  perfBar: { height:8, backgroundColor:'#232940', borderRadius:4 },
  perfFill: { height:8, borderRadius:4 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', padding:20 },
  modalBox: { backgroundColor:'#141926', borderRadius:20, padding:24, borderWidth:1, borderColor:'#232940', maxHeight:'80%' },
  fInput: { backgroundColor:'#1c2130', color:'#fff', borderRadius:12, paddingHorizontal:16, paddingVertical:14, fontSize:15, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  inputLabel: { color:'#8690A9', fontSize:10, fontWeight:'bold', letterSpacing:1, marginBottom:8, marginTop:8 },
  amenityChip: { paddingHorizontal:14, paddingVertical:8, borderRadius:16, backgroundColor:'#1c2130', borderWidth:1, borderColor:'#232940' },
  amenityActive: { backgroundColor:'#FFC107', borderColor:'#FFC107' },
  amenityText: { color:'#8690A9', fontSize:13, fontWeight:'600' },
  amenitySquare: { flex: 1, height: 100, backgroundColor: '#141926', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232940', marginHorizontal: 4 },
  amenitySquareText: { color: '#FFC107', fontSize: 12, marginTop: 10, fontWeight: '600' },
  detailCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141926', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#232940', marginBottom: 25 },
  dayBadge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center' },
  dayBadgeText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  complianceCard: { backgroundColor: '#141926', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#232940' },
  compLabel: { color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  compValueYellow: { color: '#FFC107', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  compValueWhite: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  reminderCard: { backgroundColor: '#141926', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#232940', flexDirection: 'row', alignItems: 'center' },
  reminderIconBox: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#FFC10720', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  techBox: { width: '48%', backgroundColor: '#141926', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#232940' },
  progressBar: { height: 6, backgroundColor: '#232940', borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, borderRadius: 3 },
  safetyCard: { backgroundColor: '#141926', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#232940', flexDirection: 'row', alignItems: 'center' },
});
