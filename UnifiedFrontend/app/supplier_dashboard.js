import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

export default function SupplierDashboard() {
  const { userPhone, userName, userId } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // home, performance, payments, incidents, complaints, reports
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [incidentsList, setIncidentsList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [commissionsList, setCommissionsList] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showMForm, setShowMForm] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [mForm, setMForm] = useState({ issue:'', description:'', priority:'Medium', category:'Engine', date:'' });
  const [showModal, setShowModal] = useState(false);
  const [showUpdateMaintenance, setShowUpdateMaintenance] = useState(false);
  const [tempReminder, setTempReminder] = useState({ task: '', dueDate: null, dueMileage: '', priority: 'Medium' });
  const [busForm, setBusForm] = useState({ 
    busNumber:'', seatCount:'', busType:'AC', supplierId:'', brand:'', model:'',
    wifi: false, ac: true, charging: false,
    operationalDays:[], insuranceCompany:'', insurancePolicy:'', insuranceExpiry:'', licenseExpiry:'', 
    engineHealth:'', fuelLevel:'', batteryStatus:'', coolantTemp:'', maintenanceMileage:'', maintenanceDate:'', maintenanceDetails:'', status:'active',
    reminders: []
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

  useEffect(() => {
    fetchData();
  }, [userPhone, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const suppRes = await api.get('/supplier');
      const allSuppliers = suppRes.data;
      const mySupplier = allSuppliers.find(s => s.userId === userId || s.phone === userPhone) || allSuppliers[0];
      
      if (mySupplier) {
        setSupplier(mySupplier);
        
        try {
          const perfRes = await api.get(`/performance/${mySupplier._id}`);
          setPerfData(perfRes.data);
        } catch (e) { console.log('Perf Error'); }
        
        try {
          const incRes = await api.get('/performance/list-all');
          setIncidentsList(incRes.data.filter(i => i.supplierId?._id === mySupplier._id || i.supplierId === mySupplier._id));
        } catch (e) { console.log('Inc Error'); }

        try {
          const cmpRes = await api.get('/performance/complaints');
          setComplaintsList(cmpRes.data.filter(c => c.supplierId?._id === mySupplier._id || c.supplierId === mySupplier._id));
        } catch (e) { console.log('Cmp Error'); }

        try {
          const commRes = await api.get('/commission');
          setCommissionsList(commRes.data.filter(c => c.busCompany === mySupplier.companyName || c.busCompany === mySupplier.name));
        } catch (e) { console.log('Comm Error'); }

        try {
          const busRes = await api.get('/bus');
          const myBuses = busRes.data.filter(b => {
            const bSuppId = b.supplierId?._id || b.supplierId;
            return bSuppId?.toString() === mySupplier._id?.toString();
          });
          setBuses(myBuses);
          
          // Refresh selected bus if it's currently open
          if (selectedBus) {
            const updated = myBuses.find(b => b._id === selectedBus._id);
            if (updated) setSelectedBus(updated);
          }
        } catch (e) { console.log('Bus Error'); }
      }
    } catch (e) {
      console.log('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  const addMaintenanceLog = async () => {
    if (!mForm.issue) { Alert.alert('Error', 'Please enter an issue title'); return; }
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
      fetchData();
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to report issue');
    }
  };

  const saveBus = async () => {
    if (!busForm.busNumber || !busForm.brand || !busForm.model) { Alert.alert('Error','Fill required fields'); return; }
    if (!supplier?._id) { Alert.alert('Error', 'Supplier account not found. Please contact support.'); return; }

    try { 
      // Prepare base payload
      const payload = {
        busNumber: busForm.busNumber,
        plateNumber: busForm.busNumber,
        brand: busForm.brand,
        model: busForm.model,
        busType: ['AC', 'Non-AC'].includes(busForm.busType) ? busForm.busType : 'AC',
        seatCount: Number(busForm.seatCount) || 54,
        operationalDays: busForm.operationalDays || [],
        status: busForm.status || 'active',
        amenities: { 
          wifi: !!busForm.wifi, 
          ac: !!busForm.ac, 
          charging: !!busForm.charging 
        },
        compliance: { 
          insuranceCompany: busForm.insuranceCompany,
          insurancePolicy: busForm.insurancePolicy
        },
        technicalStatus: {
          engineHealth: Number(busForm.engineHealth) || 100,
          fuelLevel: Number(busForm.fuelLevel) || 100,
          batteryStatus: busForm.batteryStatus || '12.6V',
          coolantTemp: Number(busForm.coolantTemp) || 90,
          statusDetails: busForm.maintenanceDetails || ''
        },
        reminders: [
          ...(busForm.reminders || []).map(r => ({
            ...r,
            dueDate: r.dueDate || undefined,
            dueMileage: Number(r.dueMileage) || undefined
          })),
          ...(tempReminder.task ? [{
            ...tempReminder,
            dueDate: tempReminder.dueDate || undefined,
            dueMileage: Number(tempReminder.dueMileage) || undefined
          }] : [])
        ],
        supplierId: supplier._id
      };

      // Add optional dates/numbers only if they have values
      if (busForm.insuranceExpiry) payload.compliance.insuranceExpiry = busForm.insuranceExpiry;
      if (busForm.licenseExpiry) payload.compliance.licenseExpiry = busForm.licenseExpiry;
      if (busForm.maintenanceDate) payload.maintenanceDate = busForm.maintenanceDate;
      if (busForm.maintenanceMileage) payload.maintenanceMileage = Number(busForm.maintenanceMileage) || 0;
      
      console.log('Sending Payload:', JSON.stringify(payload, null, 2));

      if (selectedBus && showUpdateMaintenance) {
        const res = await api.put(`/bus/${selectedBus._id}`, payload);
        Alert.alert('Success', 'Bus updated successfully');
        if (res.data.bus) setSelectedBus(res.data.bus);
      } else {
        const res = await api.post('/bus', payload);
        Alert.alert('Success', 'Bus added successfully');
      }
      
      setShowModal(false);
      setShowUpdateMaintenance(false);
      fetchData();
      setBusForm({ 
        busNumber:'', seatCount:'', busType:'AC', supplierId:'', brand:'', model:'',
        wifi: false, ac: true, charging: false,
        operationalDays:[], insuranceCompany:'', insurancePolicy:'', insuranceExpiry:'', licenseExpiry:'', 
        engineHealth:'', fuelLevel:'', batteryStatus:'', coolantTemp:'', maintenanceMileage:'', maintenanceDate:'', maintenanceDetails:'', status:'active',
        reminders: []
      });
    } catch (e) { 
      console.log('Save Bus Error:', e.response?.data || e.message);
      const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message;
      Alert.alert('Error', 'Failed to save bus: ' + errorMsg); 
    }
  };

  const deleteBus = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/bus/${id}`); fetchData(); } 
        catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const renderHeader = (title) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setCurrentView('home')} style={{ marginRight: 16 }}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderHome = () => {
    const sName = supplier?.companyName || supplier?.name || userName || 'Golden Arrow Transports';
    const sId = supplier?._id ? `Supplier ID: ${supplier._id.substring(supplier._id.length - 6).toUpperCase()}` : 'Supplier ID: 98274-GA';
    const score = perfData?.score ?? 100;
    const grade = perfData?.grade || 'A+';
    const gradeSub = grade.includes('A') ? 'EXCELLENT' : grade.includes('B') ? 'GOOD' : 'FAIR';
    const onTime = perfData?.trips?.onTimePercentage ?? 100;

    return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarBox}>
          <Ionicons name="bus" size={32} color="#0B0F19" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.companyName}>{sName}</Text>
          <Text style={styles.supplierId}>{sId}</Text>
        </View>
      </View>

      {/* Operational Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusLabel}>OPERATIONAL STATUS</Text>
            <Text style={styles.statusTitle}>Performance Score: {score}</Text>
          </View>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>Grade {grade}</Text>
            <Text style={styles.gradeSub}>{gradeSub}</Text>
          </View>
        </View>
        
        <View style={styles.statusFooter}>
          <View style={styles.progressSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={16} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={styles.progressText}>{onTime}% On-time dispatch</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${onTime}%` }]} />
            </View>
          </View>
          <TouchableOpacity style={styles.detailsBtn} onPress={() => setCurrentView('performance')}>
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Navigation */}
      <Text style={styles.sectionTitle}>Quick Navigation</Text>
      <View style={styles.gridContainer}>
        {[
          { id: 'fleet', title: 'Fleet', icon: 'bus', badge: buses.length || null },
          { id: 'performance', title: 'Performance', icon: 'trending-up' },
          { id: 'payments', title: 'Payments', icon: 'wallet' },
          { id: 'complaints', title: 'Complaints', icon: 'chatbubbles', badge: complaintsList.length || null },
        ].map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.gridItem} 
            onPress={() => setCurrentView(item.id)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={24} color="#FFC107" />
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.gridItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Monthly Reports */}
      <TouchableOpacity style={styles.reportsCard} onPress={() => setCurrentView('reports')}>
        <View style={styles.reportsIcon}>
          <Ionicons name="document-text" size={24} color="#FFC107" />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.reportsTitle}>Monthly Reports</Text>
          <Text style={styles.reportsSub}>Download latest analytical data</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#8690A9" />
      </TouchableOpacity>

      {/* Fleet Section Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
        <Text style={styles.sectionTitle}>YOUR FLEET</Text>
        <TouchableOpacity onPress={fetchData} style={{ padding: 5 }}>
          <Ionicons name="refresh" size={20} color="#FFC107" />
        </TouchableOpacity>
      </View>

      {/* Grid of Buses (Home View) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 25 }}>
        {buses.map(b => (
          <TouchableOpacity key={b._id} style={styles.busSquare} onPress={() => setSelectedBus(b)}>
            <Ionicons name="bus" size={24} color="#FFC107" />
            <Text style={styles.busSquareNum}>{b.busNumber}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Activity Header */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity><Text style={styles.viewAll}>VIEW ALL</Text></TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(40, 167, 69, 0.1)' }]}>
            <Ionicons name="cash" size={20} color="#28a745" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.activityTitle}>Payment Processed</Text>
            <Text style={styles.activitySub}>Invoice #INV-2023-012</Text>
          </View>
          <Text style={styles.activityTime}>2h ago</Text>
        </View>

        <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Ionicons name="warning" size={20} color="#FFC107" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.activityTitle}>Vehicle Inspection Due</Text>
            <Text style={styles.activitySub}>Bus Plate: GA-8829</Text>
          </View>
          <Text style={styles.activityTime}>1d ago</Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
    );
  };

  const renderPerformance = () => {
    const sName = supplier?.companyName || supplier?.name || userName || 'Elite Bus Solutions';
    const sId = supplier?._id ? `#${supplier._id.substring(supplier._id.length - 5).toUpperCase()}` : '#44921';
    const grade = perfData?.grade || 'A+';
    const onTime = perfData?.trips?.onTimePercentage ?? 98;
    const totalTrips = perfData?.trips?.total ?? 1240;
    const totalIncidents = perfData?.incidents?.total ?? 2;
    const totalComplaints = perfData?.feedbacks?.total ?? 5;

    return (
    <View style={styles.container}>
      {renderHeader('Supplier Performance')}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View style={styles.perfAvatar}>
            <Ionicons name="bus-outline" size={40} color="#8690A9" />
            <View style={styles.perfGradeBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#000" style={{marginRight: 4}}/>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Grade {grade}</Text>
            </View>
          </View>
          <Text style={styles.perfTitle}>{sName}</Text>
          <Text style={styles.perfSubTitle}>GLOBAL LOGISTICS PARTNER</Text>
          <Text style={styles.perfUpdateText}>Updated: Today • ID: {sId}</Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30, letterSpacing: 1 }]}>KEY PERFORMANCE INDICATORS</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="time" size={16} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={styles.kpiLabel}>ON-TIME RATE</Text>
            </View>
            <Text style={styles.kpiValue}>{onTime}%</Text>
            <Text style={styles.kpiTrendPos}>↗ Baseline</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="git-merge" size={16} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={styles.kpiLabel}>TOTAL TRIPS</Text>
            </View>
            <Text style={styles.kpiValue}>{totalTrips}</Text>
            <Text style={styles.kpiTrendPos}>↗ Active</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="warning" size={16} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={styles.kpiLabel}>INCIDENTS</Text>
            </View>
            <Text style={styles.kpiValue}>{totalIncidents}</Text>
            <Text style={totalIncidents === 0 ? styles.kpiTrendPos : styles.kpiTrendNeg}>{totalIncidents === 0 ? '✓ Zero Incidents' : 'Requires Review'}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="chatbubbles" size={16} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={styles.kpiLabel}>COMPLAINTS</Text>
            </View>
            <Text style={styles.kpiValue}>{totalComplaints}</Text>
            <Text style={totalComplaints === 0 ? styles.kpiTrendPos : styles.kpiTrendNeg}>{totalComplaints === 0 ? '✓ Excellent' : 'Action needed'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
    );
  };

  const renderPayments = () => {
    const totalCommission = commissionsList.reduce((sum, c) => sum + (c.amount || 0), 0);
    const deductions = totalCommission > 0 ? (totalCommission * 0.1) : 0; // Simulated 10% deduction
    const netPayment = totalCommission - deductions;

    return (
    <View style={styles.container}>
      {renderHeader('Payment Settlement')}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.kpiLabel}>SETTLEMENT OVERVIEW</Text>
        <Text style={[styles.headerTitle, { marginBottom: 20 }]}>Supplier Statement</Text>
        
        <View style={styles.statementCard}>
          <View style={styles.graphPlaceholder}>
            {/* Simple bar graph representation */}
            {[40, 60, 30, 80, 50, 90, 70, 60, 40, 50, 80, 60, 90].map((h, i) => (
              <View key={i} style={{ width: 8, height: `${h}%`, backgroundColor: '#FFC107', borderRadius: 4, opacity: 0.8 }} />
            ))}
            <View style={styles.activeStatementBadge}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#000' }}>ACTIVE STATEMENT</Text>
            </View>
          </View>

          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#8690A9' }}>Status</Text>
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={12} color="#FFC107" style={{ marginRight: 4 }} />
                <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: 'bold' }}>PENDING</Text>
              </View>
            </View>

            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>Current Settlement Cycle</Text>
            <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 20 }}>Processing payment for current month</Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pie-chart" size={16} color="#FFC107" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff' }}>Commission Percentage</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>10%</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cash" size={16} color="#FFC107" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff' }}>Total Commission Amount</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>${totalCommission.toFixed(2)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trending-down" size={16} color="#f14668" style={{ marginRight: 10 }} />
              <Text style={{ color: '#fff' }}>Deductions (Simulated)</Text>
            </View>
            <Text style={{ color: '#f14668', fontWeight: 'bold' }}>-${deductions.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Net Payment</Text>
              <Text style={{ color: '#8690A9', fontSize: 12, marginTop: 4 }}>Total payout to your account</Text>
            </View>
            <Text style={{ color: '#FFC107', fontSize: 24, fontWeight: 'bold' }}>${netPayment.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30, letterSpacing: 1 }]}>RECENT COMMISSIONS</Text>
        {commissionsList.length === 0 ? (
          <Text style={{ color: '#8690A9', textAlign: 'center', marginTop: 10 }}>No recent commissions found.</Text>
        ) : commissionsList.map((comm, idx) => (
          <View key={idx} style={[styles.breakdownCard, { marginBottom: 10, padding: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{comm.description || 'Commission Payment'}</Text>
                <Text style={{ color: '#8690A9', fontSize: 12, marginTop: 4 }}>{new Date(comm.date).toLocaleDateString()}</Text>
              </View>
              <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>+${comm.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: '#FFC107', marginTop: 20, paddingVertical: 15 }]}>
          <Ionicons name="document-text" size={18} color="#000" style={{ marginRight: 8 }} />
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Download Statement (PDF)</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    );
  };

  const renderIncidents = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incidents</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={styles.iconBtn}><Ionicons name="search" size={20} color="#fff" /></View>
          <View style={styles.iconBtn}><Ionicons name="add" size={20} color="#fff" /></View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {['All', 'Open', 'Resolved', 'Critical'].map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tab, i === 0 && styles.tabActive]}>
            <Text style={[styles.tabText, i === 0 && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {incidentsList.length === 0 ? (
          <Text style={{color:'#8690A9', textAlign:'center', marginTop:40}}>No incidents reported.</Text>
        ) : incidentsList.map((inc, index) => (
          <View key={index} style={styles.incidentCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={styles.incidentId}>INC-{inc._id ? inc._id.substring(inc._id.length-5).toUpperCase() : '00000'}</Text>
                <Text style={styles.incidentTitle}>{inc.description || 'Reported Incident'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="bus" size={12} color="#8690A9" style={{ marginRight: 4 }} />
                  <Text style={styles.incidentBus}>Bus ID: {inc.busId?.busNumber || inc.busId || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#f1466815' }]}>
                <Ionicons name="alert-circle" size={12} color="#f14668" style={{ marginRight: 4 }} />
                <Text style={{ color: '#f14668', fontSize: 12, fontWeight: 'bold' }}>Open</Text>
              </View>
            </View>
            
            <View style={styles.incidentImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#232940" />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
              <Text style={styles.incidentDate}>{new Date(inc.date || new Date()).toLocaleDateString()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13, marginRight: 4 }}>View Details</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFC107" />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderComplaints = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaints</Text>
        <Ionicons name="search" size={24} color="#fff" />
      </View>

      <View style={styles.complaintTabs}>
        <View style={styles.cTabActive}><Text style={styles.cTabTextActive}>All Complaints</Text></View>
        <View style={styles.cTab}><Text style={styles.cTabText}>Pending</Text></View>
        <View style={styles.cTab}><Text style={styles.cTabText}>Resolved</Text></View>
        <View style={styles.cTab}><Text style={styles.cTabText}>In Progress</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {complaintsList.length === 0 ? (
          <Text style={{color:'#8690A9', textAlign:'center', marginTop:40}}>No complaints recorded.</Text>
        ) : complaintsList.map((cmp, index) => {
          const isPos = cmp.rating === 'POSITIVE';
          const color = isPos ? '#28a745' : '#f14668';
          const icon = isPos ? 'thumbs-up' : 'thumbs-down';
          return (
          <View key={index} style={styles.complaintCard}>
            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.complaintIconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[styles.incidentId, { color }]}>CMP-{cmp._id ? cmp._id.substring(cmp._id.length-5).toUpperCase() : '00000'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={{ color: color, fontSize: 10, fontWeight: 'bold' }}>{cmp.rating || 'FEEDBACK'}</Text>
                  </View>
                </View>
                <Text style={styles.incidentTitle}>{isPos ? 'Positive Feedback' : 'Issue Reported'}</Text>
                <Text style={styles.complaintDesc}>{cmp.comment}</Text>
                
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                  <View style={styles.tagBadge}>
                    <Ionicons name="bus" size={10} color="#8690A9" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>{cmp.busId?.busNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.tagBadge}>
                    <Ionicons name="calendar" size={10} color="#8690A9" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>{new Date(cmp.date || new Date()).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )})}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderReports = () => {
    let avgRating = 5.0;
    if (complaintsList.length > 0) {
      const pos = complaintsList.filter(c => c.rating === 'POSITIVE').length;
      avgRating = Math.max(1, ((pos / complaintsList.length) * 5)).toFixed(1);
    }
    const reportsReady = 4; // Currently 4 report types available

    return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('home')} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Reports</Text>
        <Ionicons name="filter" size={24} color="#FFC107" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
          <View style={[styles.reportMetricCard, { backgroundColor: '#FFC107' }]}>
            <Ionicons name="trending-up" size={20} color="#000" style={{ marginBottom: 15 }} />
            <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>AVG. RATING</Text>
            <Text style={{ color: '#000', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{avgRating}</Text>
          </View>
          <View style={styles.reportMetricCard}>
            <Ionicons name="time" size={20} color="#FFC107" style={{ marginBottom: 15 }} />
            <Text style={{ color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>REPORTS READY</Text>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>{reportsReady}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SAFETY & OPERATIONS</Text>
        <View style={styles.reportListCard}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Ionicons name="warning" size={20} color="#FFC107" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Incident Summary Report</Text>
            <Text style={{ color: '#8690A9', fontSize: 13, marginTop: 2 }}>Safety and service violations l...</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#FFC107" />
        </View>

        <View style={styles.reportListCard}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Ionicons name="bus" size={20} color="#FFC107" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Bus Status Report</Text>
            <Text style={{ color: '#8690A9', fontSize: 13, marginTop: 2 }}>Maintenance and fleet availa...</Text>
          </View>
          <Ionicons name="eye" size={20} color="#FFC107" />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>FINANCIAL PERFORMANCE</Text>
        <View style={styles.reportListCard}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Ionicons name="cash" size={20} color="#FFC107" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Monthly Revenue Report</Text>
            <Text style={{ color: '#8690A9', fontSize: 13, marginTop: 2 }}>Earnings, fees, and payouts</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#FFC107" />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>SUPPLIER INSIGHTS</Text>
        <View style={styles.reportListCard}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(255, 193, 7, 0.1)' }]}>
            <Ionicons name="bar-chart" size={20} color="#FFC107" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Performance Summary</Text>
            <Text style={{ color: '#8690A9', fontSize: 13, marginTop: 2 }}>KPI tracking and driver ratings</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#FFC107" />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading Dashboard...</Text>
      </View>
    );
  }

  const renderFleet = () => (
    <View style={styles.container}>
      <View style={[styles.header, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setCurrentView('home')} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Fleet Management</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={{ padding: 5 }}>
          <Ionicons name="refresh" size={22} color="#FFC107" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.addBtn} onPress={()=>{
          setSelectedBus(null);
          setBusForm({ busNumber:'', seatCount:'', supplier:'', busType:'Standard', brand:'', model:'', engineHealth:'100', fuelLevel:'100', batteryStatus:'12.6V', coolantTemp:'90', operationalDays:[], insuranceCompany:'', maintenanceMileage:'', maintenanceDate:'', maintenanceDetails:'', insuranceExpiry:'', licenseExpiry:'' });
          setShowModal(true);
        }}>
          <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.addBtnText}>Add Bus</Text>
        </TouchableOpacity>
        {buses.length === 0 ? (
          <Text style={{color:'#8690A9', textAlign:'center', marginTop:20}}>No buses found in your fleet.</Text>
        ) : buses.map(b => (
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
                    busNumber: b.busNumber || '',
                    seatCount: b.seatCount?.toString() || '',
                    busType: b.busType || 'Standard',
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
                    licenseExpiry: b.compliance?.licenseExpiry || '',
                    reminders: b.reminders || []
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
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'performance': return renderPerformance();
      case 'payments': return renderPayments();
      case 'incidents': return renderIncidents();
      case 'complaints': return renderComplaints();
      case 'reports': return renderReports();
      case 'fleet': return renderFleet();
      default: return renderHome();
    }
  };

  return (
    <>
      {renderContent()}

      {/* Selected Bus Details Modal */}
      <Modal visible={!!selectedBus && !showMForm && !showUpdateMaintenance && !showMaintenance} transparent animationType="slide">
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

                {/* Maintenance Reminders */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Maintenance Reminders</Text>
                
                {selectedBus.reminders && selectedBus.reminders.length > 0 ? (
                  selectedBus.reminders.map((rem, idx) => (
                    <View key={idx} style={[styles.reminderCard, { marginBottom: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: rem.priority === 'High' ? '#f14668' : '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>● {rem.priority?.toUpperCase() || 'MEDIUM'} PRIORITY</Text>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 }}>{rem.task}</Text>
                        <Text style={{ color: '#8690A9', fontSize: 12 }}>{rem.description || 'Maintenance task required.'}</Text>
                        <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginTop: 10 }}>
                          {rem.dueDate ? `Due: ${new Date(rem.dueDate).toLocaleDateString()}` : ''}
                          {rem.dueMileage ? ` • ${rem.dueMileage} km` : ''}
                        </Text>
                      </View>
                      <View style={styles.reminderIconBox}>
                        <Ionicons name={rem.task?.toLowerCase().includes('oil') ? "color-fill" : "settings"} size={30} color="#FFC107" />
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={[styles.reminderCard, { justifyContent: 'center' }]}>
                    <Text style={{ color: '#8690A9' }}>No active maintenance reminders.</Text>
                  </View>
                )}

                {/* Technical Status Grid */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 25 }}>Technical Status</Text>
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

                {/* Recent Activity Logs */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 25 }}>Recent Activity Logs</Text>
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

                {/* Maintenance Actions Row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#FFC107', borderRadius: 15, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                    onPress={() => {
                      setBusForm({
                        ...busForm,
                        busNumber: selectedBus.busNumber || '',
                        seatCount: selectedBus.seatCount?.toString() || '',
                        busType: selectedBus.busType || 'AC',
                        brand: selectedBus.brand || '',
                        model: selectedBus.model || '',
                        engineHealth: selectedBus.technicalStatus?.engineHealth?.toString() || '100',
                        fuelLevel: selectedBus.technicalStatus?.fuelLevel?.toString() || '100',
                        batteryStatus: selectedBus.technicalStatus?.batteryStatus || '12.6V',
                        coolantTemp: selectedBus.technicalStatus?.coolantTemp?.toString() || '90',
                        operationalDays: selectedBus.operationalDays || [],
                        insuranceCompany: selectedBus.compliance?.insuranceCompany || '',
                        maintenanceMileage: selectedBus.maintenanceMileage?.toString() || '',
                        maintenanceDate: selectedBus.maintenanceDate || '',
                        maintenanceDetails: selectedBus.technicalStatus?.statusDetails || '',
                        insuranceExpiry: selectedBus.compliance?.insuranceExpiry || '',
                        licenseExpiry: selectedBus.compliance?.licenseExpiry || '',
                        reminders: selectedBus.reminders || []
                      });
                      setShowUpdateMaintenance(true);
                    }}
                  >
                    <Ionicons name="construct" size={20} color="#000" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>Update Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: '#141926', borderRadius: 15, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#232940' }}
                    onPress={() => setShowMForm(true)}
                  >
                    <Ionicons name="warning" size={20} color="#f14668" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Report Issue</Text>
                  </TouchableOpacity>
                </View>

                {/* View Detailed Maintenance Button */}
                <TouchableOpacity 
                  style={{ backgroundColor: '#232940', borderRadius: 15, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 40, borderWidth: 1, borderColor: '#FFC10750' }}
                  onPress={() => setShowMaintenance(true)}
                >
                  <Ionicons name="eye" size={20} color="#FFC107" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 16 }}>View Maintenance Details</Text>
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

      {/* Add New Bus Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 16}}>
              <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>Add New Bus</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput 
                style={styles.fInput} 
                placeholder="Bus Number (e.g. NC-4521)" 
                placeholderTextColor="#8690A9" 
                value={busForm.busNumber} 
                onChangeText={v=>setBusForm({...busForm,busNumber:v})} 
              />
              
              <TextInput 
                style={styles.fInput} 
                placeholder="Capacity (e.g. 54)" 
                placeholderTextColor="#8690A9" 
                value={busForm.seatCount} 
                onChangeText={v=>setBusForm({...busForm,seatCount:v})} 
                keyboardType="numeric" 
              />
              
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

              <TextInput 
                style={styles.fInput} 
                placeholder="Insurance Policy No." 
                placeholderTextColor="#8690A9" 
                value={busForm.insurancePolicy} 
                onChangeText={v=>setBusForm({...busForm,insurancePolicy:v})} 
              />
              
              <Text style={styles.inputLabel}>INSURANCE EXPIRY</Text>
              <SimpleDatePicker value={busForm.insuranceExpiry} onChange={v=>setBusForm({...busForm,insuranceExpiry:v})} label="Select Insurance Expiry" />
              
              <Text style={styles.inputLabel}>LICENSE EXPIRY</Text>
              <SimpleDatePicker value={busForm.licenseExpiry} onChange={v=>setBusForm({...busForm,licenseExpiry:v})} label="Select License Expiry Date" />
              
              <View style={{flexDirection:'row', gap:8, marginTop: 10}}>
                <TouchableOpacity style={[styles.addBtn, {flex: 1}]} onPress={saveBus}>
                  <Text style={styles.addBtnText}>Save Bus</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addBtn, {flex: 1, backgroundColor: '#f14668'}]} onPress={() => { setShowModal(false); }}>
                  <Text style={styles.addBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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

              {/* Reminders Section */}
              <View style={{ marginTop: 25, borderTopWidth: 1, borderTopColor: '#232940', paddingTop: 20 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Add Maintenance Reminder</Text>
                
                <TextInput 
                  style={styles.fInput} 
                  placeholder="Task (e.g. Oil Change, Tire Rotation)" 
                  placeholderTextColor="#8690A9" 
                  value={tempReminder.task} 
                  onChangeText={v => setTempReminder({...tempReminder, task: v})} 
                />
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>DUE MILEAGE (KM)</Text>
                    <TextInput 
                      style={styles.fInput} 
                      placeholder="e.g. 15000" 
                      placeholderTextColor="#8690A9" 
                      value={tempReminder.dueMileage} 
                      onChangeText={v => setTempReminder({...tempReminder, dueMileage: v})} 
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>DUE DATE</Text>
                    <SimpleDatePicker 
                      value={tempReminder.dueDate} 
                      onChange={v => setTempReminder({...tempReminder, dueDate: v})} 
                      label="Select Date" 
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>PRIORITY</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                  {['Low', 'Medium', 'High'].map(p => (
                    <TouchableOpacity 
                      key={p} 
                      style={[styles.amenityChip, tempReminder.priority === p && { backgroundColor: p === 'High' ? '#f14668' : '#FFC107', borderColor: p === 'High' ? '#f14668' : '#FFC107' }]} 
                      onPress={() => setTempReminder({...tempReminder, priority: p})}
                    >
                      <Text style={[styles.amenityText, tempReminder.priority === p && { color: '#000' }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.addBtn, { backgroundColor: '#1C2130', borderWidth: 1, borderColor: '#FFC107' }]} 
                  onPress={() => {
                    if (!tempReminder.task) { Alert.alert('Error', 'Please enter a task name'); return; }
                    setBusForm({ ...busForm, reminders: [...(busForm.reminders || []), tempReminder] });
                    setTempReminder({ task: '', dueDate: null, dueMileage: '', priority: 'Medium' });
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFC107" />
                  <Text style={[styles.addBtnText, { color: '#FFC107' }]}>Add Reminder to List</Text>
                </TouchableOpacity>

                {/* List of pending reminders in form */}
                {busForm.reminders && busForm.reminders.length > 0 && (
                  <View style={{ marginTop: 15 }}>
                    <Text style={styles.inputLabel}>PENDING REMINDERS</Text>
                    {busForm.reminders.map((r, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C2130', padding: 12, borderRadius: 10, marginBottom: 8 }}>
                        <View>
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{r.task}</Text>
                          <Text style={{ color: '#8690A9', fontSize: 11 }}>{r.priority} Priority • {r.dueMileage ? `${r.dueMileage} km` : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setBusForm({ ...busForm, reminders: busForm.reminders.filter((_, idx) => idx !== i) })}>
                          <Ionicons name="trash" size={18} color="#f14668" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.addBtn, { marginTop: 30 }]} 
                onPress={saveBus}
              >
                <Text style={styles.addBtnText}>Save Maintenance Data</Text>
              </TouchableOpacity>
            </ScrollView>
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
                    <Text style={{ color: '#000', fontSize: 13 }}>Standard Service due soon</Text>
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
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Bus {selectedBus.busNumber}</Text>
                    <Text style={{ color: '#8690A9', fontSize: 14 }}>{selectedBus.brand} {selectedBus.model}</Text>
                    <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>● ACTIVE STATUS</Text>
                  </View>
                </View>

                {/* Maintenance Reminders */}
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Maintenance Reminders</Text>
                
                {selectedBus.reminders && selectedBus.reminders.length > 0 ? (
                  selectedBus.reminders.map((rem, idx) => (
                    <View key={idx} style={[styles.reminderCard, { marginBottom: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: rem.priority === 'High' ? '#f14668' : '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>● {rem.priority?.toUpperCase() || 'MEDIUM'} PRIORITY</Text>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 }}>{rem.task}</Text>
                        <Text style={{ color: '#8690A9', fontSize: 12 }}>{rem.description || 'Maintenance task required.'}</Text>
                        <Text style={{ color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginTop: 10 }}>
                          {rem.dueDate ? `Due: ${new Date(rem.dueDate).toLocaleDateString()}` : ''}
                          {rem.dueMileage ? ` • ${rem.dueMileage} km` : ''}
                        </Text>
                      </View>
                      <View style={styles.reminderIconBox}>
                        <Ionicons name={rem.task?.toLowerCase().includes('oil') ? "color-fill" : "settings"} size={30} color="#FFC107" />
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={[styles.reminderCard, { justifyContent: 'center' }]}>
                    <Text style={{ color: '#8690A9' }}>No active maintenance reminders.</Text>
                  </View>
                )}

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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 50, marginBottom: 30 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1 },
  
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#6B5B2E', justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2, borderColor: '#FFC107' },
  companyName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  supplierId: { color: '#8690A9', fontSize: 13, marginTop: 4 },

  statusCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, marginBottom: 30 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  statusLabel: { color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gradeBadge: { backgroundColor: '#1A3320', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  gradeText: { color: '#28a745', fontSize: 16, fontWeight: 'bold' },
  gradeSub: { color: '#28a745', fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  statusFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressSection: { flex: 1, marginRight: 20 },
  progressText: { color: '#fff', fontSize: 13 },
  progressBarBg: { height: 6, backgroundColor: '#232940', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFC107' },
  detailsBtn: { backgroundColor: '#FFC107', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridItem: { width: '48%', backgroundColor: '#141926', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1C2130', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridItemText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#f14668', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  reportsCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  reportsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C2130', justifyContent: 'center', alignItems: 'center' },
  reportsTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  reportsSub: { color: '#8690A9', fontSize: 12, marginTop: 4 },

  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  viewAll: { color: '#FFC107', fontSize: 12, fontWeight: 'bold' },
  activityList: { backgroundColor: '#141926', borderRadius: 16, paddingHorizontal: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#232940' },
  activityIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  activityTitle: { color: '#fff', fontSize: 14, fontWeight: '500' },
  activitySub: { color: '#8690A9', fontSize: 12, marginTop: 4 },
  activityTime: { color: '#8690A9', fontSize: 12 },

  perfAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#141926', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFC107', marginBottom: 15 },
  perfGradeBadge: { position: 'absolute', bottom: -10, backgroundColor: '#FFC107', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  perfTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  perfSubTitle: { color: '#FFC107', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  perfUpdateText: { color: '#8690A9', fontSize: 12, marginTop: 10 },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  kpiCard: { width: '48%', backgroundColor: '#141926', borderRadius: 16, padding: 16, marginBottom: 15 },
  kpiLabel: { color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  kpiValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  kpiTrendPos: { color: '#28a745', fontSize: 11, fontWeight: 'bold' },
  kpiTrendNeg: { color: '#f14668', fontSize: 11, fontWeight: 'bold' },

  statementCard: { backgroundColor: '#141926', borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  graphPlaceholder: { height: 150, backgroundColor: '#0B0F19', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 40 },
  activeStatementBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#FFC107', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFC107', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  breakdownCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#232940', marginVertical: 5 },

  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#141926', justifyContent: 'center', alignItems: 'center' },
  tabsScroll: { flexGrow: 0, marginBottom: 20 },
  tabsContainer: { gap: 10 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#141926' },
  tabActive: { backgroundColor: '#FFC107' },
  tabText: { color: '#8690A9', fontWeight: 'bold' },
  tabTextActive: { color: '#000' },
  
  incidentCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, marginBottom: 20 },
  incidentId: { color: '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  incidentTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  incidentBus: { color: '#8690A9', fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  incidentImagePlaceholder: { height: 140, backgroundColor: '#0B0F19', borderRadius: 12, marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  incidentDate: { color: '#8690A9', fontSize: 12 },

  complaintTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#232940', marginBottom: 20 },
  cTab: { paddingBottom: 15, marginRight: 25 },
  cTabActive: { paddingBottom: 15, marginRight: 25, borderBottomWidth: 2, borderBottomColor: '#FFC107' },
  cTabText: { color: '#8690A9', fontSize: 14, fontWeight: '500' },
  cTabTextActive: { color: '#FFC107', fontSize: 14, fontWeight: 'bold' },
  
  complaintCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, marginBottom: 15 },
  complaintIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1C2130', justifyContent: 'center', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  complaintDesc: { color: '#8690A9', fontSize: 13, lineHeight: 20, marginTop: 8 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B0F19', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  tagText: { color: '#8690A9', fontSize: 11 },
  
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', elevation: 5 },

  reportMetricCard: { flex: 1, backgroundColor: '#141926', borderRadius: 16, padding: 20 },
  reportListCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },

  card: { backgroundColor:'#141926', borderRadius:14, padding:16, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  subText: { color:'#8690A9', fontSize:13 },
  statusTag: { paddingHorizontal:8, paddingVertical:3, borderRadius:8, alignSelf: 'flex-start' },
  gradeBox: { backgroundColor:'#f3be0f', width:40, height:40, borderRadius:10, justifyContent:'center', alignItems:'center' },
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', padding:20 },
  modalBox: { backgroundColor:'#141926', borderRadius:20, padding:24, borderWidth:1, borderColor:'#232940', maxHeight:'80%' },
  fInput: { backgroundColor:'#1c2130', color:'#fff', borderRadius:12, paddingHorizontal:16, paddingVertical:14, fontSize:15, borderWidth:1, borderColor:'#232940', marginBottom:12 },
  inputLabel: { color:'#8690A9', fontSize:10, fontWeight:'bold', letterSpacing:1, marginBottom:8, marginTop:8 },
  amenityChip: { paddingHorizontal:14, paddingVertical:8, borderRadius:16, backgroundColor:'#1c2130', borderWidth:1, borderColor:'#232940' },
  amenityActive: { backgroundColor:'#FFC107', borderColor:'#FFC107' },
  amenityText: { color:'#8690A9', fontSize:13, fontWeight:'600' },
  amenitySquare: { flex: 1, height: 100, backgroundColor: '#141926', borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#232940', marginHorizontal: 4 },
  amenitySquareText: { color: '#FFC107', fontSize: 12, marginTop: 10, fontWeight: '600' },
  techBox: { width: '48%', backgroundColor: '#141926', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#232940' },
  progressBar: { height: 6, backgroundColor: '#232940', borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, borderRadius: 3 },
  safetyCard: { backgroundColor: '#141926', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#232940', flexDirection: 'row', alignItems: 'center' },
  addBtn: { backgroundColor:'#FFC107', borderRadius:12, paddingVertical:14, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8, marginBottom:12 },
  addBtnText: { color:'#000000', fontWeight:'bold', fontSize:15 },
  reminderCard: { backgroundColor: '#141926', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#232940', flexDirection: 'row', alignItems: 'center' },
  reminderIconBox: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#FFC10720', justifyContent: 'center', alignItems: 'center', marginLeft: 15 }
});
