import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { AlertBanner } from '../components/ui/AlertBanner';
import { API_BASE } from '../services/api';

export default function IncidentsScreen() {
  const router = useRouter();
  const { role, adminRole } = useLocalSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Incident Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null); // if null, mode is creating
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Create Form State
  const [formVehicle, setFormVehicle] = useState('');
  const [formType, setFormType] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/incidents`, {
        headers: { 'x-user-role': role || adminRole },
      });
      if (!response.ok) throw new Error('Unable to fetch incidents');
      const data = await response.json();
      setIncidents(data.incidents || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE}/users?role=all`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (response.ok) {
        setStaffList((data.users || []).filter(u => u.role === 'staff' || u.role === 'manager' || u.role === 'admin'));
      }
    } catch (err) {
      console.warn("Could not fetch staff");
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchStaff();
  }, []);

  const handleCreate = async () => {
    if (!formVehicle || !formType || !formDescription) {
      Alert.alert('Validation', 'Vehicle ID, Topic, and Description are required.');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({
          vehicleId: formVehicle,
          type: formType,
          location: formLocation,
          description: formDescription,
          priority: formPriority,
          reporter: role || adminRole,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create incident');
      }
      setModalVisible(false);
      resetForm();
      fetchIncidents();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (incidentId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({ incidentStatus: newStatus, actorRole: role || adminRole }),
      });
      if (!response.ok) throw new Error('Status update failed');
      const data = await response.json();
      setActiveIncident(data.incident);
      fetchIncidents();
    } catch (err) {
      Alert.alert('Error', 'Unable to update status');
    }
  };

  const assignStaff = async (incidentId, userId) => {
    try {
      const response = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({ assignedTo: userId, actorRole: role || adminRole }),
      });
      if (!response.ok) throw new Error('Assignment failed');
      const data = await response.json();
      setActiveIncident(data.incident);
      fetchIncidents();
    } catch (err) {
      Alert.alert('Error', 'Unable to assign staff');
    }
  };

  const addComment = async () => {
    if (!commentText.trim() || !activeIncident) return;
    setCommenting(true);
    try {
      const response = await fetch(`${API_BASE}/incidents/${activeIncident._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({ comment: commentText, actor: 'Current User', actorRole: role || adminRole }),
      });
      if (!response.ok) throw new Error('Unable to post comment');
      const data = await response.json();
      setActiveIncident(data.incident);
      setCommentText('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const resetForm = () => {
    setFormVehicle('');
    setFormType('');
    setFormLocation('');
    setFormDescription('');
    setFormPriority('medium');
    setActiveIncident(null);
  };

  const openIncident = (inc) => {
    setActiveIncident(inc);
    setModalVisible(true);
  };

  const renderStatus = (status) => {
    const map = {
      pending: { label: 'PENDING', color: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' },
      under_review: { label: 'UNDER REVIEW', color: Colors.primary, bg: 'rgba(255, 193, 7, 0.1)' },
      resolved: { label: 'RESOLVED', color: Colors.success, bg: 'rgba(76, 175, 80, 0.1)' },
    };
    return map[status] || { label: status?.toUpperCase() || 'UNKNOWN', color: Colors.textMuted, bg: '#2a2a2a' };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Management</Text>
        <TouchableOpacity onPress={fetchIncidents} style={styles.refreshBtn}>
          <Ionicons name="reload" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all', 'pending', 'acknowledged', 'resolved'].map(status => (
          <TouchableOpacity 
             key={status} 
             style={[styles.filterPill, statusFilter === status && styles.filterPillActive]}
             onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>{status.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={incidents.filter(inc => {
          if (statusFilter === 'all') return true;
          if (statusFilter === 'pending') return inc.incidentStatus === 'reported';
          if (statusFilter === 'acknowledged') return inc.incidentStatus === 'assigned' || inc.incidentStatus === 'under_review';
          if (statusFilter === 'resolved') return inc.incidentStatus === 'resolved';
          return true;
        })}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
        refreshing={loading}
        onRefresh={fetchIncidents}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<AlertBanner type="error" message={error} onRetry={fetchIncidents} />}
        ListEmptyComponent={() => (
           <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="checkmark-done" size={32} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>No {statusFilter !== 'all' ? statusFilter : ''} incidents found</Text>
            <Text style={styles.emptyText}>All vehicles are operating normally.</Text>
          </View>
        )}
        renderItem={({ item: incident }) => {
          const isAcknowledged = incident.incidentStatus === 'assigned' || incident.incidentStatus === 'under_review';
          const isResolved = incident.incidentStatus === 'resolved';

          if (isResolved) {
            return (
              <View style={[styles.incidentCard, { height: 'auto', padding: 20, opacity: 0.9, borderColor: '#2E7D32' }]}>
                <View style={styles.incidentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#4CAF50', fontSize: 13, fontWeight: '800' }]}>INCIDENT RESOLVED</Text>
                    <Text style={[styles.incidentTitle, { fontSize: 16, marginTop: 4 }]}>{incident.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#4CAF50', height: 22, paddingHorizontal: 10 }]}> 
                    <Text style={[styles.statusText, { color: '#000', fontSize: 9 }]}>RESOLVED</Text>
                  </View>
                </View>
                
                <Text style={[styles.incidentDetail, { marginBottom: 15 }]}>{incident.description}</Text>
                
                <View style={{ backgroundColor: 'rgba(76, 175, 80, 0.05)', padding: 12, borderRadius: 10, marginTop: 5, marginBottom: 15 }}>
                  <View style={styles.metaRow}>
                     <Text style={styles.metaLabel}>SENDER: <Text style={styles.metaText}>{incident.reporter?.length > 10 ? 'Driver' : incident.reporter || 'Driver'}</Text></Text>
                     <Text style={styles.metaLabel}>PHONE: <Text style={styles.metaText}>{incident.reporter || 'N/A'}</Text></Text>
                  </View>
                  <Text style={styles.metaLabel}>RESOLVED AT: <Text style={styles.metaText}>{new Date(incident.updatedAt).toLocaleString()}</Text></Text>
                </View>

                <TouchableOpacity 
                   style={[styles.smallButton, { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' }]} 
                   onPress={() => openIncident(incident)}
                >
                  <Text style={{ color: '#888', fontWeight: '700', fontSize: 12 }}>View Audit Logs & Comments</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View style={[styles.incidentCard, { height: 'auto', padding: 20 }]}>
              <View style={styles.incidentHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#ff4444', fontSize: 13, fontWeight: '800' }]}>INCIDENT REPORTED</Text>
                  <Text style={[styles.incidentTitle, { fontSize: 16, marginTop: 4 }]}>{incident.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: isAcknowledged ? '#FFD700' : '#D7263D', height: 22, paddingHorizontal: 10 }]}> 
                  <Text style={[styles.statusText, { color: isAcknowledged ? '#000' : '#FFF', fontSize: 9 }]}>
                    {isAcknowledged ? 'ACKNOWLEDGED' : 'PENDING'}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.incidentDetail, { marginBottom: 15 }]}>{incident.description}</Text>
              
              <View style={styles.senderGrayBox}>
                <View style={styles.metaRow}>
                   <Text style={styles.metaLabel}>SENDER: <Text style={styles.metaText}>{incident.reporter?.length > 10 ? 'Driver' : incident.reporter || 'Driver'}</Text></Text>
                   <Text style={styles.metaLabel}>PHONE: <Text style={styles.metaText}>{incident.reporter || '0771319366'}</Text></Text>
                </View>
                <Text style={styles.metaLabel}>VEHICLE: <Text style={styles.metaText}>{incident.vehicleId} (Mercedes-Benz Citaro)</Text></Text>
              </View>

              <View style={styles.actionRow}>
                {isAcknowledged ? (
                  <TouchableOpacity 
                     style={[styles.smallButton, styles.primaryButton]} 
                     onPress={() => openIncident(incident)}
                  >
                    <Text style={styles.primaryButtonText}>View Details</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                     style={[styles.smallButton, styles.primaryButton]} 
                     onPress={() => updateStatus(incident._id, 'assigned')}
                  >
                    <Text style={styles.primaryButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                   style={[styles.smallButton, styles.secondaryButton]} 
                   onPress={() => updateStatus(incident._id, 'resolved')}
                >
                  <Text style={styles.secondaryButtonText}>Resolve</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />



      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{activeIncident ? `Incident #${activeIncident._id.slice(-5).toUpperCase()}` : 'Report Incident'}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            {activeIncident ? (
              <View style={styles.incidentDetailView}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailTitle}>{activeIncident.type}</Text>
                  <Text style={styles.detailDesc}>{activeIncident.description}</Text>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}><Text style={styles.infoLabel}>Vehicle ID</Text><Text style={styles.infoVal}>{activeIncident.vehicleId}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoVal}>{activeIncident.location || 'Unknown'}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.infoLabel}>Priority</Text><Text style={[styles.infoVal, {textTransform:'capitalize'}]}>{activeIncident.priority}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.infoLabel}>Reporter</Text><Text style={[styles.infoVal, {textTransform:'capitalize'}]}>{activeIncident.reporter}</Text></View>
                  </View>
                </View>

                {/* Workflow Actions */}
                <Text style={styles.sectionHeading}>Workflow & Assignment</Text>
                <View style={styles.workflowCard}>
                  <Text style={styles.workflowLabel}>Current Status: <Text style={{color: renderStatus(activeIncident.incidentStatus).color, fontWeight:'bold'}}>{renderStatus(activeIncident.incidentStatus).label}</Text></Text>
                  
                  <View style={styles.workflowActionRow}>
                    {activeIncident.incidentStatus === 'pending' && <TouchableOpacity style={styles.workflowBtn} onPress={() => updateStatus(activeIncident._id, 'under_review')}><Text style={styles.workflowBtnText}>Mark Under Review</Text></TouchableOpacity>}
                    {activeIncident.incidentStatus === 'under_review' && <TouchableOpacity style={[styles.workflowBtn, {backgroundColor: Colors.success}]} onPress={() => updateStatus(activeIncident._id, 'resolved')}><Text style={styles.workflowBtnTextDark}>Resolve Issue</Text></TouchableOpacity>}
                  </View>

                  <Text style={[styles.workflowLabel, { marginTop: 15 }]}>Assigned To: <Text style={{color:'#FFF'}}>{activeIncident.assignedTo?.name || 'Unassigned'}</Text></Text>
                  <View style={styles.assignGrid}>
                    {staffList.map(staff => (
                      <TouchableOpacity key={staff._id} style={[styles.assignPill, activeIncident.assignedTo?._id === staff._id && styles.assignPillActive]} onPress={() => assignStaff(activeIncident._id, staff._id)}>
                        <Text style={[styles.assignPillText, activeIncident.assignedTo?._id === staff._id && styles.assignPillTextActive]}>{staff.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Comments */}
                <Text style={styles.sectionHeading}>Discussion & Notes</Text>
                <View style={styles.commentsContainer}>
                  {activeIncident.comments?.length > 0 ? (
                    activeIncident.comments.map((c, i) => (
                      <View key={i} style={styles.commentBubble}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentActor}>{c.actor} <Text style={styles.commentRole}>({c.actorRole})</Text></Text>
                          <Text style={styles.commentTime}>{new Date(c.date).toLocaleDateString()} {new Date(c.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
                        </View>
                        <Text style={styles.commentBody}>{c.comment}</Text>
                      </View>
                    ))
                  ) : <Text style={styles.emptyText}>No comments yet.</Text>}
                </View>

                <View style={styles.commentInputRow}>
                  <TextInput style={styles.commentInput} placeholder="Add a note or comment..." placeholderTextColor={Colors.textMuted} value={commentText} onChangeText={setCommentText} />
                  <TouchableOpacity style={styles.commentSend} onPress={addComment} disabled={commenting || !commentText.trim()}>
                    {commenting ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="send" size={18} color="#000" />}
                  </TouchableOpacity>
                </View>

              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.formLabel}>Vehicle ID</Text>
                <TextInput style={styles.input} placeholder="e.g. bus-8844" placeholderTextColor={Colors.textMuted} value={formVehicle} onChangeText={setFormVehicle} autoCapitalize="none" />
                
                <Text style={styles.formLabel}>Incident Topic</Text>
                <TextInput style={styles.input} placeholder="e.g. Broken AC, Engine Overheat" placeholderTextColor={Colors.textMuted} value={formType} onChangeText={setFormType} />
                
                <Text style={styles.formLabel}>Location (Optional)</Text>
                <TextInput style={styles.input} placeholder="e.g. Route 4, Main Depot" placeholderTextColor={Colors.textMuted} value={formLocation} onChangeText={setFormLocation} />
                
                <Text style={styles.formLabel}>Detailed Description</Text>
                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Provide details about the incident..." placeholderTextColor={Colors.textMuted} multiline value={formDescription} onChangeText={setFormDescription} />
                
                <Text style={styles.formLabel}>Priority Level</Text>
                <View style={styles.priorityGrid}>
                  {['low', 'medium', 'high'].map(lvl => (
                    <TouchableOpacity key={lvl} style={[styles.priorityPill, formPriority === lvl && styles.priorityPillActive, formPriority === lvl && lvl === 'high' && {backgroundColor: '#ff4444', borderColor: '#ff4444'}]} onPress={() => setFormPriority(lvl)}>
                      <Text style={[styles.priorityPillText, formPriority === lvl && styles.priorityPillTextActive]}>{lvl.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={creating}>
                  {creating ? <ActivityIndicator color="#000" /> : <Text style={styles.submitBtnText}>Submit Incident</Text>}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', flex: 1 },
  refreshBtn: { padding: 5, backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  container: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyStateContainer: { marginTop: 80, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: '80%' },
  incidentCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#333' },
  incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  incidentIdBox: { backgroundColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#333' },
  incidentIdText: { color: Colors.textMuted, fontSize: 11, fontWeight: 'bold' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  incidentTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  incidentDetail: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 15 },
  metaDivider: { height: 1, backgroundColor: '#333', marginBottom: 12 },
  metaGrid: { flexDirection: 'row', alignItems: 'center' },
  metaCol: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  metaColRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  metaValue: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  
  // Modal Styles
  modalSafeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalCloseBtn: { paddingVertical: 5, width: 60 },
  modalCloseText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalBody: { flex: 1 },
  formContainer: { padding: 20 },
  formLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#1e1e1e', color: '#FFF', borderRadius: 12, padding: 15, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  priorityPill: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', marginHorizontal: 5 },
  priorityPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priorityPillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  priorityPillTextActive: { color: '#000' },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  incidentDetailView: { padding: 20, paddingBottom: 60 },
  detailCard: { backgroundColor: Colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  detailTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  detailDesc: { color: '#CCCCCC', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#161616', borderRadius: 12, padding: 15 },
  infoItem: { width: '50%', marginBottom: 15 },
  infoLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  infoVal: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  sectionHeading: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 15, marginTop: 10 },
  workflowCard: { backgroundColor: Colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  workflowLabel: { color: Colors.textMuted, fontSize: 13, marginBottom: 10 },
  workflowActionRow: { flexDirection: 'row', flexWrap: 'wrap' },
  workflowBtn: { backgroundColor: '#1a1a1a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#444', marginRight: 10, marginBottom: 10 },
  workflowBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  workflowBtnTextDark: { color: '#000', fontSize: 13, fontWeight: '700' },
  assignGrid: { flexDirection: 'row', flexWrap: 'wrap' },
assignPill: { backgroundColor: '#1a1a1a', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#333', marginRight: 8, marginBottom: 8 },
  assignPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  assignPillText: { color: Colors.textMuted, fontSize: 12 },
  assignPillTextActive: { color: '#000', fontWeight: '600' },
  
  // SOS Style Design
  senderGrayBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 5,
    marginBottom: 15
  },
  metaRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  metaLabel: { 
    color: '#888', 
    fontSize: 10, 
    fontWeight: '700' 
  },
  metaText: { 
    color: '#DDD', 
    fontWeight: 'normal' 
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  smallButton: { 
    flex: 1, 
    height: 40, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  primaryButton: { 
    backgroundColor: Colors.primary, 
    marginRight: 8 
  },
  secondaryButton: { 
    borderWidth: 1, 
    borderColor: Colors.primary 
  },
  disabledButton: { 
    backgroundColor: '#333', 
    marginRight: 8 
  },
  primaryButtonText: { 
    color: '#000', 
    fontWeight: '700', 
    fontSize: 12 
  },
  secondaryButtonText: { 
    color: Colors.primary, 
    fontWeight: '700', 
    fontSize: 12 
  },
  cardTitle: { 
    fontWeight: '900', 
    letterSpacing: 0.5 
  },
  
  // Filter Styles
  filterRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginBottom: 15, 
    marginTop: 5 
  },
  filterPill: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#1a1a1a', 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  filterPillActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary 
  },
  filterText: { 
    color: '#888', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  filterTextActive: { 
    color: '#000' 
  },
  
  commentsContainer: { marginBottom: 15 },
  commentBubble: { backgroundColor: '#1e1e1e', padding: 15, borderRadius: 16, borderBottomLeftRadius: 4, marginBottom: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentActor: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  commentRole: { color: Colors.primary, fontWeight: 'normal', fontSize: 12 },
  commentTime: { color: Colors.textMuted, fontSize: 11 },
  commentBody: { color: '#CCC', fontSize: 14, lineHeight: 20 },
  
  commentInputRow: { flexDirection: 'row', alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: '#1e1e1e', color: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 46, fontSize: 14, borderWidth: 1, borderColor: '#333' },
  commentSend: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
