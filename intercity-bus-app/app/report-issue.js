import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from "../services/api";

const VEHICLE_ID = 'bus-8824';

export default function ReportIssueScreen() {
  const router = useRouter();
  const [issueType, setIssueType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [submitStatus, setSubmitStatus] = useState('normal');

  const handleSubmit = async () => {
    if (!issueType || !description) {
      Alert.alert('Validation Error', 'Please fill in the issue type and description before submitting.');
      return;
    }

    try {
      setSubmitStatus('loading');
      const response = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: VEHICLE_ID,
          type: issueType,
          location,
          description,
          priority,
          assignedTo,
          reporter: 'Mobile staff',
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to report issue');
      }

      setSubmitStatus('success');
      
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/home');
        }
      }, 1500);

    } catch (error) {
      setSubmitStatus('normal');
      Alert.alert('Submission failed', error.message || 'Please try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningCard}>
           <Ionicons name="warning" size={32} color={Colors.primary} style={{ marginBottom: 10 }} />
           <Text style={styles.warningText}>
             Please provide accurate details about the vehicle issue or unexpected incident. This will be sent immediately to the maintenance team.
           </Text>
        </View>

        <View style={styles.formContent}>
           <Input
             label="ISSUE TYPE"
             placeholder="e.g., Engine Failure, Tire Puncture..."
             value={issueType}
             onChangeText={setIssueType}
           />
           <Input
             label="LOCATION / INTERCHANGE"
             placeholder="Where did this happen?"
             style={{ marginTop: 10 }}
             value={location}
             onChangeText={setLocation}
           />
           <Input
             label="DETAILED DESCRIPTION"
             placeholder="Describe the problem..."
             multiline
             numberOfLines={4}
             style={{ height: 100, textAlignVertical: 'top', marginTop: 10 }}
             value={description}
             onChangeText={setDescription}
           />
           <Input
             label="PRIORITY"
             placeholder="high / medium / low"
             style={{ marginTop: 10 }}
             value={priority}
             onChangeText={setPriority}
           />
           <Input
             label="ASSIGNED TO"
             placeholder="Technician or staff name"
             style={{ marginTop: 10 }}
             value={assignedTo}
             onChangeText={setAssignedTo}
           />
           <Button 
             title={submitStatus === 'success' ? 'Report submitted successfully' : 'Submit Incident'} 
             onPress={handleSubmit} 
             style={[styles.submitBtn, submitStatus === 'success' && { backgroundColor: Colors.success, borderColor: Colors.success }]} 
             textStyle={submitStatus === 'success' ? { color: '#FFF' } : undefined}
             loading={submitStatus === 'loading'}
             disabled={submitStatus !== 'normal'} 
           />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5, marginRight: 15 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', paddingRight: 34 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  warningCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  warningText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  formContent: { flex: 1 },
  submitBtn: { marginTop: 40 },
});
