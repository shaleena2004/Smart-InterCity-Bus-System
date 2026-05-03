import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIncidents, updateIncidentStatus, updateIncident, deleteIncident } from '../services/api';

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editSeverity, setEditSeverity] = useState('');

  useEffect(() => {
    fetchIncidents(false);
    const intervalId = setInterval(() => {
      fetchIncidents(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchIncidents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Incident",
      "Are you sure you want to delete this incident report?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteIncident(id);
              setIncidents(prev => prev.filter(inc => inc._id !== id));
            } catch (err) {
              Alert.alert("Error", "Failed to delete incident");
            }
          }
        }
      ]
    );
  };

  const handleEdit = (incident) => {
    setSelectedIncident(incident);
    setEditDescription(incident.description);
    setEditSeverity(incident.severity);
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    try {
      await updateIncident(selectedIncident._id, {
        description: editDescription,
        severity: editSeverity
      });
      setEditModalVisible(false);
      fetchIncidents(true);
      Alert.alert("Success", "Incident updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update incident");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#f14668';
      case 'high': return '#ff3860';
      case 'medium': return '#ffdd57';
      default: return '#4ade80';
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incident Log</Text>
        <Text style={styles.headerSub}>{incidents.length} total reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {incidents.map((incident) => (
          <View key={incident._id} style={styles.incidentCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) + '20' }]}>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(incident.severity) }]} />
                <Text style={[styles.severityText, { color: getSeverityColor(incident.severity) }]}>
                  {incident.severity?.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>{new Date(incident.date).toLocaleDateString()}</Text>
            </View>

            <Text style={styles.typeText}>{incident.type?.toUpperCase()}</Text>
            <Text style={styles.descriptionText}>{incident.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="bus" size={14} color="#8690A9" />
                <Text style={styles.metaText}>{incident.busId?.plateNumber || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color="#8690A9" />
                <Text style={styles.metaText}>{incident.userId?.name || 'Unknown'}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(incident)}>
                <Ionicons name="create-outline" size={18} color="#FFC107" />
                <Text style={[styles.actionBtnText, { color: '#FFC107' }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(incident._id)}>
                <Ionicons name="trash-outline" size={18} color="#f14668" />
                <Text style={[styles.actionBtnText, { color: '#f14668' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Incident Report</Text>
            
            <Text style={styles.inputLabel}>Severity</Text>
            <View style={styles.severityRow}>
              {['low', 'medium', 'high', 'critical'].map((s) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.severityOption, editSeverity === s && { backgroundColor: getSeverityColor(s), borderColor: getSeverityColor(s) }]}
                  onPress={() => setEditSeverity(s)}
                >
                  <Text style={[styles.severityOptionText, editSeverity === s && { color: '#fff' }]}>{s.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              multiline
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Describe the incident..."
              placeholderTextColor="#8690A9"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  loadingContainer: { flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#232940' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#8690A9', fontSize: 14, marginTop: 4 },
  scrollContent: { padding: 15 },
  incidentCard: { backgroundColor: '#141926', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#232940' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  severityText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { color: '#8690A9', fontSize: 12 },
  typeText: { color: '#FFC107', fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  descriptionText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 15 },
  metaRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#8690A9', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#232940', paddingTop: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141926', borderRadius: 20, padding: 25, width: '100%', borderWidth: 1, borderColor: '#232940' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { color: '#8690A9', fontSize: 14, marginBottom: 10, marginTop: 10 },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  severityOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#232940' },
  severityOptionText: { color: '#8690A9', fontSize: 11, fontWeight: 'bold' },
  textInput: { backgroundColor: '#0B0F19', borderRadius: 12, padding: 15, color: '#fff', minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#232940' },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#8690A9', fontWeight: 'bold' },
  saveBtn: { flex: 2, backgroundColor: '#FFC107', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: 'bold' },
});
