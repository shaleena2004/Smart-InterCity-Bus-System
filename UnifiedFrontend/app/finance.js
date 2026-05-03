import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRevenue, getSalaries, getCommissions, addRevenue, addSalary, addCommission, deleteRevenue, deleteSalary, deleteCommission, getRevenueReport, getBookings, getSuppliers } from '../services/api';

function fmt(n) {
  if (n >= 1000000) return `Rs. ${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `Rs. ${(n/1000).toFixed(1)}K`;
  return `Rs. ${n.toLocaleString()}`;
}

export default function FinanceDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('revenue');
  const [form, setForm] = useState({ source:'', amount:'', description:'', name:'', role:'', busCompany:'', rate:'' });
  const [reportData, setReportData] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('monthly');

  useEffect(() => { fetchFinanceData(); }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, cRes, bRes, supRes] = await Promise.all([
        getRevenue(), getSalaries(), getCommissions(), getBookings(), getSuppliers()
      ]);
      setRevenues((rRes.data || []).map(r => ({ ...r, amount: r.ticketSales || r.amount || 0 })));
      setSalaries(sRes.data || []);
      setCommissions(cRes.data || []);
      setBookings(bRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (e) {
      console.log('Finance fetch error:', e.message);
      // Fallback mock data
      setRevenues([
        { _id:'1', source:'Route 101 Tickets', amount:450000, description:'April revenue', date:'2026-04-30' },
        { _id:'2', source:'Route 202 Tickets', amount:380000, description:'April revenue', date:'2026-04-30' },
        { _id:'3', source:'Express Service', amount:520000, description:'Premium routes', date:'2026-04-28' },
      ]);
      setSalaries([
        { _id:'1', staffName:'Mr. Sunil Perera', role:'Driver', amount:85000, date:'2026-04-30' },
        { _id:'2', staffName:'Kamal Silva', role:'Conductor', amount:65000, date:'2026-04-30' },
        { _id:'3', staffName:'Nimal Fernando', role:'Manager', amount:120000, date:'2026-04-30' },
      ]);
      setCommissions([
        { _id:'1', busCompany:'Sunil & Sons (NC-4521)', amount:54000, date:'2026-04-30' },
        { _id:'2', busCompany:'KL Travels (NB-9988)', amount:38000, date:'2026-04-30' },
      ]);
    }
    setLoading(false);
  };

  const COMMISSION_RATE = 15; // 15% Platform Fee, 85% Supplier Payout

  // Group booking fares by Route for dynamic Revenue
  const routeFares = {};
  // Group booking fares by Bus for dynamic Commission
  const busFares = {};
  
  bookings.forEach(b => {
    if (b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'Pending') {
      const fare = Number(b.fare) || 0;
      const route = b.busRoute || 'Unknown Route';
      const bus = b.busNumber || 'Unknown Bus';
      routeFares[route] = (routeFares[route] || 0) + fare;
      busFares[bus] = (busFares[bus] || 0) + fare;
    }
  });

  const dynamicRevenuesList = Object.keys(routeFares).map((route, i) => ({
    _id: `dyn-rev-${i}`,
    source: `Live Sales: ${route}`,
    description: 'Auto-calculated from Bookings',
    amount: routeFares[route],
    date: new Date().toISOString().split('T')[0]
  }));

  const dynamicCommissionsList = Object.keys(busFares).map((bus, i) => ({
    _id: `dyn-comm-${i}`,
    busCompany: `Fleet ${bus}`,
    description: `Auto-Payout (${100 - COMMISSION_RATE}% of Sales)`,
    amount: busFares[bus] * ((100 - COMMISSION_RATE) / 100),
    date: new Date().toISOString().split('T')[0]
  }));

  const manualRevenues = revenues.filter(r => !(r.source && r.source.startsWith('Booking:')));
  const displayRevenues = [...dynamicRevenuesList, ...manualRevenues];
  const displayCommissions = [...dynamicCommissionsList, ...commissions];

  const totalRevenue = displayRevenues.reduce((s,r) => s+(r.amount||r.ticketSales||0), 0);
  const totalSalaries = salaries.reduce((s,r) => s+(r.amount||0), 0);
  const totalCommissions = displayCommissions.reduce((s,r) => s+(r.amount||0), 0);
  const netProfit = totalRevenue - totalSalaries - totalCommissions;

  const ticketsSold = bookings.reduce((sum, b) => {
    if (b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'Pending') {
      return sum + (b.seatNumber ? b.seatNumber.split(',').length : 1);
    }
    return sum;
  }, 0);
  const activeBookings = bookings.length;

  const addItem = async () => {
    const amt = parseFloat(form.amount) || 0;
    if (!amt) { Alert.alert('Error','Enter valid amount'); return; }

    try {
      if (modalType === 'revenue') {
        const res = await addRevenue({ ticketSales: amt, source: form.source||'Revenue', description: form.description });
        setRevenues([{...res.data, amount: res.data.ticketSales}, ...revenues]);
      } else if (modalType === 'salary') {
        const res = await addSalary({ staffName: form.name||'Staff', role: form.role||'Employee', amount: amt });
        setSalaries([res.data, ...salaries]);
      } else {
        const res = await addCommission({ busCompany: form.busCompany||'N/A', amount: amt, description: `${form.rate||10}% commission` });
        setCommissions([res.data, ...commissions]);
      }
      setShowModal(false);
      setForm({ source:'', amount:'', description:'', name:'', role:'', busCompany:'', rate:'' });
      Alert.alert('Success',`${modalType} added`);
    } catch(e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (type, id) => {
    Alert.alert('Delete', `Delete this ${type}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (type==='revenue') await deleteRevenue(id);
          else if (type==='salary') await deleteSalary(id);
          else await deleteCommission(id);
        } catch(e) { console.log('Delete error:', e.message); }
        if (type==='revenue') setRevenues(revenues.filter(r=>r._id!==id));
        else if (type==='salary') setSalaries(salaries.filter(s=>s._id!==id));
        else setCommissions(commissions.filter(c=>c._id!==id));
      }}
    ]);
  };

  const fetchReport = async (period) => {
    setReportPeriod(period);
    try {
      const res = await getRevenueReport(period);
      setReportData(res.data);
    } catch(e) {
      // Fallback
      setReportData({ totalRevenue, totalSalaries, totalCommissions, netProfit: totalRevenue - totalSalaries - totalCommissions, period });
    }
  };

  if (loading) return <View style={styles.loadCenter}><ActivityIndicator size="large" color="#FFC107" /><Text style={{color:'#FFC107',marginTop:10}}>Loading Financial Data...</Text></View>;

  const renderDashboard = () => (
    <View>
      <View style={styles.statsGrid}>
        {[
          { label:'Total Revenue', value:totalRevenue, icon:'wallet', color:'#FFC107' },
          { label:'Net Profit', value:netProfit, icon:'trending-up', color: netProfit >= 0 ? '#4ade80' : '#f14668' },
          { label:'Tickets Sold', value:ticketsSold, isNumber: true, icon:'ticket', color:'#a78bfa' },
          { label:'Total Bookings', value:activeBookings, isNumber: true, icon:'list', color:'#34d399' },
          { label:'Salaries', value:totalSalaries, icon:'people', color:'#3298dc' },
          { label:'Commissions', value:totalCommissions, icon:'bus', color:'#f3be0f' },
        ].map((s,i) => (
          <View key={i} style={[styles.statCard, { width: '48%' }]}>
            <View style={[styles.iconBox, {backgroundColor:s.color+'20'}]}><Ionicons name={s.icon} size={22} color={s.color} /></View>
            <Text style={styles.statAmount}>{s.isNumber ? s.value : fmt(s.value)}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {[
          { label:'Add Revenue', icon:'add-circle-outline', onPress:()=>{setModalType('revenue');setShowModal(true);} },
          { label:'Add Salary', icon:'person-add-outline', onPress:()=>{setModalType('salary');setShowModal(true);} },
          { label:'Commission', icon:'bus-outline', onPress:()=>{setModalType('commission');setShowModal(true);} },
          { label:'Reports', icon:'bar-chart-outline', onPress:()=>{setTab('reports'); fetchReport('monthly');} },
        ].map((a,i) => (
          <TouchableOpacity key={i} style={styles.actionBtn} onPress={a.onPress}>
            <Ionicons name={a.icon} size={20} color="#FFC107" />
            <Text style={styles.actionText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Financial Summary</Text>
      <View style={styles.listContainer}>
        {[
          { label:'Revenue', sub:`${displayRevenues.length} records`, value:totalRevenue, icon:'wallet', color:'#FFC107' },
          { label:'Salaries', sub:`${salaries.length} staff`, value:totalSalaries, icon:'people', color:'#3298dc' },
          { label:'Commissions', sub:`${displayCommissions.length} entries`, value:totalCommissions, icon:'bus', color:'#f3be0f' },
          { label:'Net Profit', sub:'Revenue - Expenses', value:netProfit, highlight:true, icon:'trending-up', color:'#4ade80' },
        ].map((item,i) => (
          <View key={i} style={[styles.listItem, item.highlight && {backgroundColor:'rgba(74,222,128,0.08)', borderRadius: 12, paddingHorizontal: 12}]}>
            <View style={{flexDirection:'row', alignItems:'center', flex:1}}>
              <Ionicons name={item.icon} size={18} color={item.color} style={{marginRight:12}} />
              <View>
                <Text style={[styles.listTitle, item.highlight && {color:'#4ade80'}]}>{item.label}</Text>
                <Text style={styles.listSub}>{item.sub}</Text>
              </View>
            </View>
            <Text style={[styles.listAmount, item.highlight && {color:'#4ade80'}]}>{fmt(item.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderList = (type, data, fields) => (
    <View>
      <TouchableOpacity style={styles.addRowBtn} onPress={()=>{setModalType(type);setShowModal(true);}}>
        <Ionicons name="add-circle" size={20} color="#fff" /><Text style={{color:'#000',fontWeight:'bold',marginLeft:8}}>Add {type}</Text>
      </TouchableOpacity>
      {data.length === 0 ? (
        <View style={{padding:40, alignItems:'center'}}>
          <Ionicons name="document-text-outline" size={48} color="#232940" />
          <Text style={{color:'#8690A9', marginTop:12}}>No {type} records yet</Text>
        </View>
      ) : data.map(item => (
        <View key={item._id} style={styles.card}>
          {fields.map((f,i) => {
            let val = item[f] || '';
            if (f === 'date' && val) val = new Date(val).toLocaleDateString();
            return <Text key={i} style={i===0?{color:'#fff',fontWeight:'bold',fontSize:15,marginBottom:4}:styles.cardSub}>{val}</Text>;
          })}
          <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:8, alignItems:'center'}}>
            <Text style={{color:'#FFC107',fontWeight:'bold',fontSize:16}}>Rs. {(item.amount||item.ticketSales||0).toLocaleString()}</Text>
            {!item._id.startsWith('dyn-') && (
              <TouchableOpacity onPress={()=>handleDelete(type,item._id)} style={{padding:4}}>
                <Ionicons name="trash" size={18} color="#f14668" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderReports = () => {
    const rd = reportData || { totalRevenue, totalSalaries, totalCommissions, netProfit };
    return (
      <View>
        <Text style={styles.sectionTitle}>Financial Reports</Text>
        
        {/* Period Selector */}
        <View style={{flexDirection:'row', gap:8, marginBottom:20}}>
          {['daily','weekly','monthly'].map(p => (
            <TouchableOpacity key={p} style={[styles.periodChip, reportPeriod===p && styles.periodChipActive]} onPress={()=>fetchReport(p)}>
              <Text style={[styles.periodText, reportPeriod===p && {color:'#0B0F19', fontWeight:'bold'}]}>{p.charAt(0).toUpperCase()+p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {[
          { label:'Total Revenue', icon:'trending-up', value:fmt(rd.totalRevenue || totalRevenue), color:'#FFC107' },
          { label:'Salary Disbursement', icon:'people', value:fmt(rd.totalSalaries || totalSalaries), color:'#3298dc' },
          { label:'Commission Paid', icon:'bus', value:fmt(rd.totalCommissions || totalCommissions), color:'#f3be0f' },
          { label:'Net Profit/Loss', icon:'analytics', value:fmt(rd.netProfit || netProfit), highlight:true, color:'#4ade80' },
        ].map((r,i) => (
          <View key={i} style={[styles.card, r.highlight && {borderColor:'#4ade80'}]}>
            <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
              <View style={[styles.iconBox, {backgroundColor:(r.color)+'20'}]}>
                <Ionicons name={r.icon} size={22} color={r.highlight?'#4ade80':r.color} />
              </View>
              <View style={{flex:1}}><Text style={{color:'#fff',fontWeight:'bold'}}>{r.label}</Text></View>
              <Text style={{color:r.highlight?'#4ade80':r.color,fontWeight:'bold',fontSize:16}}>{r.value}</Text>
            </View>
          </View>
        ))}

        {/* Revenue Breakdown */}
        <Text style={[styles.sectionTitle, {marginTop:8}]}>Revenue Breakdown</Text>
        {displayRevenues.slice(0,5).map((r,i) => (
          <View key={r._id || i} style={styles.breakdownRow}>
            <View style={{flex:1}}>
              <Text style={{color:'#fff', fontSize:14}}>{r.source}</Text>
              <Text style={{color:'#8690A9', fontSize:12}}>{r.description}</Text>
            </View>
            <Text style={{color:'#FFC107', fontWeight:'bold'}}>Rs. {(r.amount||r.ticketSales||0).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:40}}>
      <View style={styles.tabBar}>
        {[{k:'dashboard',l:'Overview',i:'grid'},{k:'revenue',l:'Revenue',i:'wallet'},{k:'salary',l:'Salaries',i:'people'},{k:'commission',l:'Commission',i:'bus'},{k:'reports',l:'Reports',i:'analytics'}].map(t=>(
          <TouchableOpacity key={t.k} style={[styles.tabItem, tab===t.k && styles.tabItemActive]} onPress={()=>{setTab(t.k); if(t.k==='reports') fetchReport(reportPeriod);}}>
            <Ionicons name={t.i} size={14} color={tab===t.k?'#0B0F19':'#8690A9'} />
            <Text style={[styles.tabLabel, tab===t.k && {color:'#0B0F19'}]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{padding:20}}>
        {tab==='dashboard' && renderDashboard()}
        {tab==='revenue' && renderList('revenue', displayRevenues, ['source','description','date'])}
        {tab==='salary' && renderList('salary', salaries, ['staffName','role','date'])}
        {tab==='commission' && renderList('commission', displayCommissions, ['busCompany','description','date'])}
        {tab==='reports' && renderReports()}
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <Text style={{color:'#fff',fontSize:20,fontWeight:'bold'}}>Add {modalType.charAt(0).toUpperCase()+modalType.slice(1)}</Text>
              <TouchableOpacity onPress={()=>setShowModal(false)}><Ionicons name="close" size={24} color="#8690A9" /></TouchableOpacity>
            </View>
            {modalType==='revenue' && <><TextInput style={styles.fInput} placeholder="Source (e.g. Route 101 Tickets)" placeholderTextColor="#8690A9" value={form.source} onChangeText={v=>setForm({...form,source:v})} /><TextInput style={styles.fInput} placeholder="Description" placeholderTextColor="#8690A9" value={form.description} onChangeText={v=>setForm({...form,description:v})} /></>}
            {modalType==='salary' && <><TextInput style={styles.fInput} placeholder="Staff Name" placeholderTextColor="#8690A9" value={form.name} onChangeText={v=>setForm({...form,name:v})} /><TextInput style={styles.fInput} placeholder="Role (Driver, Conductor, etc.)" placeholderTextColor="#8690A9" value={form.role} onChangeText={v=>setForm({...form,role:v})} /></>}
            {modalType==='commission' && (
              <>
                <Text style={{color:'#8690A9', marginBottom:8, fontSize:13}}>Select Bus Company</Text>
                <ScrollView style={{maxHeight: 120, marginBottom: 12, borderWidth:1, borderColor:'#232940', borderRadius:12}}>
                  {suppliers.map(s => (
                    <TouchableOpacity 
                      key={s._id} 
                      style={{padding: 12, borderBottomWidth:1, borderBottomColor:'#232940', backgroundColor: form.busCompany === (s.companyName || s.name) ? 'rgba(255,193,7,0.2)' : 'transparent'}}
                      onPress={() => setForm({...form, busCompany: (s.companyName || s.name)})}
                    >
                      <Text style={{color: form.busCompany === (s.companyName || s.name) ? '#FFC107' : '#fff'}}>{s.companyName || s.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {suppliers.length === 0 && <Text style={{color:'#8690A9', padding:12}}>No suppliers found.</Text>}
                </ScrollView>
                <TextInput style={styles.fInput} placeholder="Rate %" placeholderTextColor="#8690A9" value={form.rate} onChangeText={v=>setForm({...form,rate:v})} keyboardType="numeric" />
              </>
            )}
            <TextInput style={styles.fInput} placeholder="Amount (Rs.)" placeholderTextColor="#8690A9" value={form.amount} onChangeText={v=>setForm({...form,amount:v})} keyboardType="numeric" />
            <View style={{flexDirection:'row',gap:8}}>
              <TouchableOpacity style={[styles.addRowBtn,{flex:1}]} onPress={addItem}><Ionicons name="checkmark-circle" size={18} color="#000" /><Text style={{color:'#000',fontWeight:'bold',marginLeft:6}}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.addRowBtn,{flex:1,backgroundColor:'#f14668'}]} onPress={()=>setShowModal(false)}><Text style={{color:'#fff',fontWeight:'bold'}}>Cancel</Text></TouchableOpacity>
            </View>
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
  tabItemActive: { backgroundColor:'#FFC107' },
  tabLabel: { color:'#8690A9', fontSize:9, fontWeight:'600' },
  sectionTitle: { color:'#fff', fontSize:16, fontWeight:'bold', marginBottom:14, marginTop:8 },
  statsGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:20 },
  statCard: { width:'48%', backgroundColor:'#141926', borderRadius:16, padding:16, marginBottom:12, borderWidth:1, borderColor:'#232940' },
  iconBox: { width:40, height:40, borderRadius:12, justifyContent:'center', alignItems:'center', marginBottom:10 },
  statAmount: { color:'#fff', fontSize:18, fontWeight:'bold', marginBottom:4 },
  statLabel: { color:'#8690A9', fontSize:12 },
  actionGrid: { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:12 },
  actionBtn: { width:'48%', flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,193,7,0.08)', paddingVertical:14, borderRadius:12, borderWidth:1, borderColor:'rgba(255,193,7,0.2)', marginBottom:10, gap:6 },
  actionText: { color:'#FFC107', fontWeight:'600' },
  listContainer: { backgroundColor:'#141926', borderRadius:16, padding:16, borderWidth:1, borderColor:'#232940' },
  listItem: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#232940' },
  listTitle: { color:'#fff', fontSize:15, fontWeight:'500' },
  listSub: { color:'#8690A9', fontSize:12, marginTop:2 },
  listAmount: { color:'#fff', fontSize:15, fontWeight:'bold' },
  card: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  cardSub: { color:'#8690A9', fontSize:13 },
  addRowBtn: { backgroundColor:'#FFC107', borderRadius:12, paddingVertical:14, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, marginBottom:12 },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', padding:20 },
  modalBox: { backgroundColor:'#141926', borderRadius:20, padding:24, borderWidth:1, borderColor:'#232940' },
  fInput: { backgroundColor:'#1c2130', color:'#fff', borderRadius:12, paddingHorizontal:16, paddingVertical:14, fontSize:15, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  periodChip: { flex:1, paddingVertical:10, backgroundColor:'#141926', borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#232940' },
  periodChipActive: { backgroundColor:'#FFC107', borderColor:'#FFC107' },
  periodText: { color:'#8690A9', fontSize:13 },
  breakdownRow: { flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#1c2130' },
});
