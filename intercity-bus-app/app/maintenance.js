import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { AlertBanner } from '../components/ui/AlertBanner';
import { API_BASE } from '../services/api';

export default function FleetMaintenanceScreen() {
  const router = useRouter();
  const { role, adminRole } = useLocalSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Summary Stats
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [maintenanceDue, setMaintenanceDue] = useState(0);
  const [highRisk, setHighRisk] = useState(0);

  // Detail & Log Modal
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [formType, setFormType] = useState('oil');
  const [formCost, setFormCost] = useState('');
  const [formTech, setFormTech] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/vehicles`, { headers: { 'x-user-role': role || adminRole } });
      if (!response.ok) throw new Error('Failed to fetch fleet data');
      const data = await response.json();
      const fleet = data.vehicles || [];
      setVehicles(fleet);
      
      setTotalVehicles(fleet.length);
      setMaintenanceDue(fleet.filter(v => v.maintenanceStatus === 'under_maintenance' || v.maintenanceStatus === 'not_ready').length);
      setHighRisk(fleet.filter(v => v.riskLevel === 'high').length);
    } catch (err) {
      setError(err.message || 'Unable to load fleet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFleet(); }, [role, adminRole]);

  const analyzeRisk = async (vehicleId) => {
    try {
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/analyze-risk`, {
        method: 'POST',
        headers: { 'x-user-role': role || adminRole }
      });
      if (res.ok) fetchFleet();
    } catch (err) { console.error('Risk error', err); }
  };

  const loadVehicleDetails = async (vehicleId) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/vehicles/${vehicleId}`, { headers: { 'x-user-role': role || adminRole } });
      if (res.ok) {
        const data = await res.json();
        setVehicleDetails(data.vehicle);
      }
    } catch (err) { } finally { setLoading(false); }
  };

  const openVehicle = (vehicle) => {
    setActiveVehicle(vehicle);
    setVehicleDetails(null);
    setModalVisible(true);
    analyzeRisk(vehicle.vehicleId);
    loadVehicleDetails(vehicle.vehicleId);
  };

  const addServiceLog = async () => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({
          vehicleId: activeVehicle.vehicleId,
          title: `Service: ${formType}`,
          description: formDesc,
          type: formType,
          cost: Number(formCost),
          technician: formTech,
          date: new Date(),
          status: 'completed',
        })
      });
      if (!res.ok) throw new Error('Failed to log service');
      Alert.alert('Success', 'Service record stored successfully.', [{text: 'OK'}]);
      setFormCost('');
      setFormTech('');
      setFormDesc('');
      loadVehicleDetails(activeVehicle.vehicleId);
      fetchFleet();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderStatus = (status) => {
    const map = {
      'ready': { label: 'READY', color: Colors.success, bg: 'rgba(76, 175, 80, 0.1)' },
      'not_ready': { label: 'NOT READY', color: '#ff4444', bg: 'rgba(255, 68, 68, 0.1)' },
      'under_maintenance': { label: 'UNDER MAINTENANCE', color: Colors.warning, bg: 'rgba(255, 152, 0, 0.1)' },
    };
    return map[status] || map['not_ready'];
  };

  const renderRisk = (level, score) => {
    let color = Colors.success;
    if (level === 'medium') color = Colors.warning;
    if (level === 'high') color = '#ff4444';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="shield" size={12} color={color} style={{ marginRight: 4 }} />
        <Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{level} RISK ({score})</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fleet Maintenance</Text>
        <TouchableOpacity onPress={fetchFleet} style={{ padding: 5 }}>
          <Ionicons name="reload" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFleet} tintColor={Colors.primary} />}
      >
        <AlertBanner type="error" message={error} onRetry={() => fetchFleet()} />

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalVehicles}</Text>
            <Text style={styles.summaryLabel}>Total Fleet</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{maintenanceDue}</Text>
            <Text style={styles.summaryLabel}>Off Road</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: highRisk > 0 ? '#ff4444' : '#333' }]}>
            <Text style={[styles.summaryValue, { color: highRisk > 0 ? '#ff4444' : '#FFF' }]}>{highRisk}</Text>
            <Text style={styles.summaryLabel}>High Risk</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vehicles Overview</Text>

        {vehicles.length === 0 && !loading ? (
           <View style={styles.emptyStateContainer}>
            <Ionicons name="bus-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No vehicles registered</Text>
          </View>
        ) : (
          vehicles.map((vehicle) => {
            const status = renderStatus(vehicle.maintenanceStatus);
            return (
              <TouchableOpacity key={vehicle._id} style={styles.vehicleCard} onPress={() => openVehicle(vehicle)}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.busNumber}>{vehicle.busNumber || vehicle.vehicleId}</Text>
                    <Text style={styles.busModel}>{vehicle.model || 'Bus'} • Mileage: {vehicle.currentMileage || 0} km</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg, marginBottom: 6 }]}> 
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {renderRisk(vehicle.riskLevel, vehicle.riskScore)}
                  </View>
                </View>

                {vehicle.riskLevel === 'high' && vehicle.suggestedAction && vehicle.suggestedAction !== 'None' && (
                  <View style={styles.actionBanner}>
                    <Ionicons name="warning-outline" size={14} color="#000" />
                    <Text style={styles.actionBannerText}>SUGGESTED ACTION: {vehicle.suggestedAction}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Modal View for detailed Vehicle Operations */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{activeVehicle?.busNumber || activeVehicle?.vehicleId}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            {vehicleDetails ? (
              <>
                <View style={styles.detailGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.dLabel}>Status</Text>
                    <Text style={[styles.dValue, { color: renderStatus(vehicleDetails.maintenanceStatus).color }]}>{renderStatus(vehicleDetails.maintenanceStatus).label}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.dLabel}>Risk Profile</Text>
                    {renderRisk(vehicleDetails.riskLevel, vehicleDetails.riskScore)}
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.dLabel}>Current Mileage</Text>
                    <Text style={styles.dValue}>{vehicleDetails.currentMileage} km</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.dLabel}>Next Service</Text>
                    <Text style={styles.dValue}>{vehicleDetails.nextServiceKm} km</Text>
                  </View>
                </View>

                {vehicleDetails.riskLevel === 'high' && vehicleDetails.suggestedAction !== 'None' && (
                  <View style={[styles.actionBanner, { marginBottom: 20 }]}>
                    <Ionicons name="warning" size={16} color="#000" />
                    <Text style={[styles.actionBannerText, { fontSize: 13 }]}>  AI RECOMMENDS: {vehicleDetails.suggestedAction}</Text>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Log Service Record</Text>
                <View style={styles.formContainer}>
                  <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                    <TouchableOpacity style={[styles.typeBtn, formType === 'oil' && styles.typeBtnActive]} onPress={() => setFormType('oil')}><Text style={[styles.typeBtnText, formType === 'oil' && styles.typeBtnTextActive]}>Oil/Fluids</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.typeBtn, formType === 'tire' && styles.typeBtnActive]} onPress={() => setFormType('tire')}><Text style={[styles.typeBtnText, formType === 'tire' && styles.typeBtnTextActive]}>Tires</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.typeBtn, formType === 'engine' && styles.typeBtnActive]} onPress={() => setFormType('engine')}><Text style={[styles.typeBtnText, formType === 'engine' && styles.typeBtnTextActive]}>Engine</Text></TouchableOpacity>
                  </View>
                  <TextInput style={styles.input} placeholder="Technician Name" placeholderTextColor={Colors.textMuted} value={formTech} onChangeText={setFormTech} />
                  <TextInput style={styles.input} placeholder="Total Cost ($)" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={formCost} onChangeText={setFormCost} />
                  <TextInput style={[styles.input, { height: 80 }]} placeholder="Service notes..." multiline placeholderTextColor={Colors.textMuted} value={formDesc} onChangeText={setFormDesc} />
                  <TouchableOpacity style={styles.submitBtn} onPress={addServiceLog}><Text style={styles.submitBtnText}>Submit Record</Text></TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Maintenance History</Text>
                {vehicleDetails.tasks && vehicleDetails.tasks.length > 0 ? (
                  vehicleDetails.tasks.sort((a,b) => new Date(b.date || b.completedAt) - new Date(a.date || a.completedAt)).map((task, i) => (
                    <View key={i} style={styles.historyCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{task.title}</Text>
                        <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{new Date(task.date || task.completedAt || task.dueDate).toLocaleDateString()}</Text>
                      </View>
                      <Text style={{ color: '#CCC', fontSize: 13, marginBottom: 8 }}>{task.description}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: 'bold' }}>Tech: {task.technician || 'Unknown'}</Text>
                        <Text style={{ color: Colors.success, fontSize: 12, fontWeight: 'bold' }}>Cost: ${task.cost || '0'}</Text>
                      </View>
                    </View>
                  ))
                ) : <Text style={styles.emptyText}>No service history on record.</Text>}
                
                <View style={{ height: 80 }} />
              </>
            ) : <ActivityIndicator color={Colors.primary} style={{ marginTop: 50 }} />}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  summaryCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 15, marginHorizontal: 4, borderWidth: 1, borderColor: '#333', alignItems: 'center' },
  summaryValue: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 2 },
  summaryLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase' },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 15, marginTop: 10 },
  
  vehicleCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleDetails: { flex: 1 },
  busNumber: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  busModel: { color: Colors.textMuted, fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionBanner: { backgroundColor: Colors.warning, borderRadius: 8, padding: 8, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBannerText: { color: '#000', fontSize: 11, fontWeight: 'bold', marginLeft: 6 },
  
  emptyStateContainer: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { color: Colors.textMuted, fontSize: 16, marginTop: 10 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontStyle: 'italic', marginTop: 10 },

  modalSafeArea: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalCloseBtn: { paddingVertical: 5, width: 60 },
  modalCloseText: { color: Colors.primary, fontSize: 16, fontWeight: 'bold' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  detailBox: { width: '48%', backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 15 },
  dLabel: { color: Colors.textMuted, fontSize: 11, textTransform: 'uppercase', marginBottom: 5 },
  dValue: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  formContainer: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 16, marginBottom: 25 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#333' },
  typeBtnActive: { borderBottomColor: Colors.primary },
  typeBtnText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.primary },
  input: { backgroundColor: '#121212', color: '#FFF', borderRadius: 10, padding: 12, marginTop: 10, fontSize: 14, borderWidth: 1, borderColor: '#333' },
  submitBtn: { backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  submitBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },

  historyCard: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#333' }
});
