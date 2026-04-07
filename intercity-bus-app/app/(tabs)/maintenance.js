import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { API_BASE } from '../../services/api';

export default function DriverMaintenanceScreen() {
  const { role, phone } = useLocalSearchParams();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [successTaskId, setSuccessTaskId] = useState(null);

  // Modal Add Maintenance
  const [mtModalVisible, setMtModalVisible] = useState(false);
  const [mtTitle, setMtTitle] = useState('');
  const [mtType, setMtType] = useState('oil');
  const [mtDesc, setMtDesc] = useState('');
  const [mtPriority, setMtPriority] = useState('medium');
  const [mtDueInKm, setMtDueInKm] = useState('');
  const [mtSubmitting, setMtSubmitting] = useState(false);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/driver/dashboard`, {
        headers: { 'x-user-role': role || 'driver' }
      });
      if (!res.ok) throw new Error('Unable to retrieve maintenance data');
      const data = await res.json();
      setVehicle(data.vehicle);
    } catch (err) {
      setError(err.message || 'Error pulling maintenance tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const handleAddMaintenance = async () => {
    if (!mtTitle || !mtType) {
      if (Platform.OS === 'web') window.alert("Please provide at least a title and category.");
      else Alert.alert("Error", "Please provide at least a title and category.");
      return;
    }

    setMtSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/driver/maintenance/${vehicle.vehicleId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || 'driver' },
        body: JSON.stringify({
          title: mtTitle,
          type: mtType,
          description: mtDesc,
          priority: mtPriority,
          dueInKm: mtDueInKm ? parseInt(mtDueInKm) : undefined,
          status: 'pending'
        }),
      });
      if (!res.ok) throw new Error('Task creation failed');
      
      setMtModalVisible(false);
      setMtTitle('');
      setMtType('oil');
      setMtDesc('');
      setMtPriority('medium');
      setMtDueInKm('');
      fetchMaintenance();
      if (Platform.OS === 'web') window.alert('Success: Maintenance task added.');
      else Alert.alert('Success', 'Maintenance task added.');
    } catch (err) {
      if (Platform.OS === 'web') window.alert('Error: ' + err.message);
      else Alert.alert('Error', err.message);
    } finally {
      setMtSubmitting(false);
    }
  };

  const executeCompleteMaintenance = async (taskId) => {
     try {
        setCompletingTaskId(taskId);
        const res = await fetch(`${API_BASE}/driver/maintenance/${vehicle.vehicleId}/${taskId}/complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-role': role || 'driver' }
        });
        if (!res.ok) throw new Error('Update failed');
        
        setCompletingTaskId(null);
        setSuccessTaskId(taskId);
        
        setTimeout(() => {
          setSuccessTaskId(null);
          fetchMaintenance();
          if (Platform.OS === 'web') window.alert('Success: Task completed.');
          else Alert.alert('Success', 'Task completed.');
        }, 1500);

     } catch (err) {
        setCompletingTaskId(null);
        if (Platform.OS === 'web') window.alert('Error: ' + err.message);
        else Alert.alert('Error', err.message);
     }
  };

  const handleCompleteMaintenance = (taskId) => {
    const message = "Log this maintenance task as completed?";
    if (Platform.OS === 'web') {
      if (window.confirm(message)) executeCompleteMaintenance(taskId);
    } else {
      Alert.alert("Complete Maintenance", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => executeCompleteMaintenance(taskId) }
      ]);
    }
  };

  const taskStatusBadge = (status, taskId) => {
    const isSuccess = successTaskId === taskId;
    const effectiveStatus = isSuccess ? 'completed' : status;
    const map = {
      pending: { label: 'PENDING', color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' },
      upcoming: { label: 'UPCOMING', color: Colors.primary, bg: 'rgba(255, 215, 0, 0.1)' },
      pending_verification: { label: 'VERIFICATION', color: '#03A9F4', bg: 'rgba(3, 169, 244, 0.1)' },
      completed: { label: 'COMPLETED', color: Colors.success, bg: 'rgba(76, 175, 80, 0.1)' }
    };
    const mapped = map[effectiveStatus] || map.pending;
    return (
      <View style={[styles.taskBadge, { backgroundColor: mapped.bg }]}>
         <Text style={{ color: mapped.color, fontSize: 10, fontWeight: 'bold' }}>{mapped.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vehicle Maintenance</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setMtModalVisible(true)}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMaintenance} tintColor={Colors.primary}/>}
      >
        <AlertBanner type="error" message={error} onRetry={fetchMaintenance} />
        
        {loading && !vehicle ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 50 }} /> : null}

        {vehicle ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="bus" size={24} color={Colors.primary} />
                <Text style={styles.summaryBus}>{vehicle.busNumber || vehicle.vehicleId}</Text>
              </View>
              <Text style={styles.summaryMileage}>Current Mileage: {vehicle.currentMileage} km</Text>
            </View>

            <Text style={styles.sectionHeading}>Maintenance Reminders</Text>
            
            {(!vehicle.tasks || vehicle.tasks.filter(t => t.status === 'pending' || successTaskId === t._id).length === 0) ? (
               <View style={styles.emptyContainer}>
                 <Ionicons name="construct-outline" size={48} color={Colors.textMuted} />
                 <Text style={styles.emptyText}>No active maintenance tasks.</Text>
               </View>
            ) : (
               vehicle.tasks.filter(t => t.status === 'pending' || successTaskId === t._id).map((task) => (
                 <View key={task._id} style={styles.taskCard}>
                   <View style={styles.taskHeader}>
                     <View style={{ flex: 1 }}>
                       <Text style={styles.taskTitle}>{task.title || task.type}</Text>
                       <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
                     </View>
                     {taskStatusBadge(task.status, task._id)}
                   </View>
                   
                   <View style={styles.taskFooter}>
                      <View>
                        <View style={styles.infoRow}>
                          <Ionicons name="speedometer-outline" size={14} color={Colors.textMuted} />
                          <Text style={styles.infoText}>{task.dueInKm ? `Due in ${task.dueInKm} km` : 'Service interval'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                          <Text style={styles.infoText}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        style={[styles.completeBtn, successTaskId === task._id && { backgroundColor: Colors.success }]} 
                        onPress={() => handleCompleteMaintenance(task._id)}
                        disabled={completingTaskId === task._id || successTaskId === task._id}
                      >
                        {completingTaskId === task._id ? (
                          <ActivityIndicator color="#000" size="small" />
                        ) : (
                          <Ionicons name={successTaskId === task._id ? "checkmark" : "checkmark-circle-outline"} size={20} color={successTaskId === task._id ? "#FFF" : "#000"} />
                        )}
                      </TouchableOpacity>
                   </View>
                 </View>
               ))
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Add Maintenance Modal */}
      <Modal visible={mtModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMtModalVisible(false)}><Text style={styles.closeBtn}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Maintenance</Text>
            <View style={{ width: 50 }}/>
          </View>
          <ScrollView padding={20}>
             <Text style={styles.label}>Task Title</Text>
             <TextInput style={styles.input} placeholder="e.g. Filter change" placeholderTextColor={Colors.textMuted} value={mtTitle} onChangeText={setMtTitle}/>
             
             <Text style={styles.label}>Category</Text>
             <View style={styles.priorityRow}>
               {['oil', 'tire', 'brake', 'other'].map(t => (
                 <TouchableOpacity key={t} style={[styles.pPill, mtType === t && styles.pPillActive]} onPress={() => setMtType(t)}>
                   <Text style={[styles.pPillText, mtType === t && {color:'#000'}]}>{t.toUpperCase()}</Text>
                 </TouchableOpacity>
               ))}
             </View>

             <Text style={styles.label}>Priority</Text>
             <View style={styles.priorityRow}>
               {['low', 'medium', 'high'].map(p => (
                 <TouchableOpacity key={p} style={[styles.pPill, mtPriority === p && styles.pPillActive]} onPress={() => setMtPriority(p)}>
                   <Text style={[styles.pPillText, mtPriority === p && {color:'#000'}]}>{p.toUpperCase()}</Text>
                 </TouchableOpacity>
               ))}
             </View>

             <Text style={styles.label}>Due in KM (Optional)</Text>
             <TextInput style={styles.input} placeholder="e.g. 5000" keyboardType="numeric" placeholderTextColor={Colors.textMuted} value={mtDueInKm} onChangeText={setMtDueInKm}/>

             <Text style={styles.label}>Description</Text>
             <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Details..." placeholderTextColor={Colors.textMuted} multiline value={mtDesc} onChangeText={setMtDesc}/>
             
             <TouchableOpacity style={styles.submitBtn} onPress={handleAddMaintenance} disabled={mtSubmitting}>
                {mtSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.submitText}>Save Task</Text>}
             </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  addBtn: { padding: 5 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginVertical: 20, borderWidth: 1, borderColor: '#333' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryBus: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  summaryMileage: { color: Colors.textMuted, fontSize: 13 },
  sectionHeading: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  taskCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  taskTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  taskDesc: { color: Colors.textMuted, fontSize: 13 },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { color: Colors.textMuted, fontSize: 12, marginLeft: 6 },
  completeBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: Colors.textMuted, fontSize: 14, marginTop: 15 },
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
});
