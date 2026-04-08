import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Colors } from '../constants/Colors';
import { API_BASE } from "../services/api";

const VALID_PHONE_RE = /^\+?[0-9\s\-]{7,20}$/;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { role, adminRole } = useLocalSearchParams();
  const actorRole = role || adminRole || '';
  const driverPhone = useLocalSearchParams().phone || '';
  const canEdit = true;
  const isReadOnly = false;

  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/emergency-contacts`, {
        headers: { 'x-user-role': actorRole, 'x-user-phone': driverPhone },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load emergency contacts');
      }
      setContacts(data.contacts || []);
    } catch (err) {
      console.warn('Fetch emergency contacts failed:', err);
      setError('Unable to load emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setName('');
    setPhone('');
    setEmail('');
    setBloodGroup('');
    setError('');
    setMessage('');
  };

  const selectContact = (contact) => {
    setSelectedId(contact._id);
    setName(contact.name || '');
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setBloodGroup(contact.bloodGroup || '');
    setError('');
    setMessage('');
  };

  const validateContact = () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      setMessage('');
      return false;
    }
    if (!VALID_PHONE_RE.test(phone.trim())) {
      setError('Please enter a valid phone number.');
      setMessage('');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (isReadOnly) {
      setError('Only Admin and Super Admin can manage emergency contacts.');
      setMessage('');
      return;
    }
    if (!validateContact()) return;

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bloodGroup: bloodGroup || '',
    };
    const endpoint = selectedId ? `${API_BASE}/emergency-contacts/${selectedId}` : `${API_BASE}/emergency-contacts`;
    const method = selectedId ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-role': actorRole, 'x-user-phone': driverPhone },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save emergency contact');
      }
      setMessage(data.message || 'Emergency contact saved successfully.');
      resetForm();
      fetchContacts();
    } catch (err) {
      console.warn('Emergency save failed:', err);
      setError(err.message || 'Unable to save emergency contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (isReadOnly) {
      setError('Only Admin and Super Admin can delete emergency contacts.');
      setMessage('');
      return;
    }
    const targetId = typeof contactId === 'string' ? contactId : selectedId;
    if (!targetId) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/emergency-contacts/${targetId}`, {
        method: 'DELETE',
        headers: { 'x-user-role': actorRole, 'x-user-phone': driverPhone },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete emergency contact');
      }
      setMessage(data.message || 'Emergency contact deleted.');
      if (selectedId === targetId) resetForm();
      fetchContacts();
    } catch (err) {
      console.warn('Emergency delete failed:', err);
      setError(err.message || 'Unable to delete emergency contact.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (isReadOnly) {
      setError('Only Admin and Super Admin can clear emergency contacts.');
      return;
    }
    
    const confirmClear = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to clear all emergency contacts?')
      : true; // Expo Alert is async but let's just proceed for now or use simplified logic

    if (!confirmClear) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/emergency-contacts-clear`, {
        method: 'DELETE',
        headers: { 'x-user-role': actorRole, 'x-user-phone': driverPhone },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to clear contacts');
      }
      setMessage('All emergency contacts cleared successfully.');
      resetForm();
      fetchContacts();
    } catch (err) {
      console.warn('Clear all contacts failed:', err);
      setError(err.message || 'Unable to clear contacts.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
        >
          <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contact Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          {loading ? (
            <Text style={styles.infoText}>Loading emergency contacts…</Text>
          ) : contacts.length > 0 ? (
            <View style={styles.contactList}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Saved Contacts ({contacts.length}/2)</Text>
                <TouchableOpacity onPress={handleClearAll} disabled={saving}>
                  <Text style={styles.clearAllLink}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {contacts.map((contact) => (
                <View key={contact._id} style={styles.contactRow}>
                  <TouchableOpacity style={styles.contactInfo} onPress={() => selectContact(contact)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.bloodGroup ? (
                        <View style={styles.bloodBadge}>
                          <Text style={styles.bloodBadgeText}>{contact.bloodGroup}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.contactMeta}>{contact.phone}</Text>
                    {contact.email ? <Text style={styles.contactMeta}>{contact.email}</Text> : null}
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={[styles.callButton, { backgroundColor: '#333' }]} onPress={() => selectContact(contact)}>
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.callButton, { backgroundColor: '#333' }]} onPress={() => handleDelete(contact._id)}>
                      <Ionicons name="trash" size={18} color="#ff4444" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${contact.phone}`)}>
                      <Ionicons name="call" size={18} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {(contacts.length < 2 || selectedId) && <View style={styles.divider} />}
            </View>
          ) : null}

          <Text style={styles.subtitle}>Manage emergency contacts used by SOS alerts and alert forwarding.</Text>

          <Text style={styles.roleText}>All users can add, edit, and save emergency contact details here.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          {!loading && contacts.length >= 2 && !selectedId && (
            <View style={styles.limitBanner}>
              <Ionicons name="information-circle" size={18} color={Colors.primary} />
              <Text style={styles.limitText}>Maximum of 2 emergency contacts reached.</Text>
            </View>
          )}

          {(contacts.length < 2 || selectedId) && (
            <>
              <Text style={styles.sectionTitle}>{selectedId ? 'Edit Contact' : 'Add New Contact'}</Text>
              <Input label="Name" value={name} onChangeText={setName} placeholder="Contact name" editable={!isReadOnly} />
              <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+94 7X XXX XXXX" keyboardType="phone-pad" editable={!isReadOnly} />
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="Optional email" keyboardType="email-address" editable={!isReadOnly} />

              <Text style={styles.dropdownLabel}>{actorRole?.toLowerCase() === 'passenger' ? "PASSENGER'S" : "DRIVER'S"} BLOOD GROUP</Text>
              <Text style={styles.formNote}>Note: {actorRole?.toLowerCase() === 'passenger' ? "Passenger's" : "Driver's"} blood group so emergency responders can know the blood group of {actorRole?.toLowerCase() === 'passenger' ? "passenger" : "driver"}.</Text>
              <View style={styles.bloodGroupGrid}>
                {BLOOD_GROUPS.map(bg => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodPill, bloodGroup === bg && styles.bloodPillActive]}
                    onPress={() => setBloodGroup(bloodGroup === bg ? '' : bg)}
                  >
                    <Text style={[styles.bloodPillText, bloodGroup === bg && styles.bloodPillTextActive]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Button title={selectedId ? 'Update Contact' : 'Save Contact'} onPress={handleSave} loading={saving} disabled={saving} style={styles.saveButton} />
                <Button title="Clear" type="secondary" onPress={resetForm} disabled={saving} style={styles.clearButton} />
              </View>

              {selectedId ? (
                <Button title="Delete Contact" type="danger" onPress={handleDelete} disabled={saving} />
              ) : null}
            </>
          )}
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  avoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  clearAllLink: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 15,
    fontWeight: '600',
  },
  contactList: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 16,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  callButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 12,
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
  },
  clearButton: {
    flex: 1,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '600',
  },
  successText: {
    color: Colors.success,
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '600',
  },
  infoText: {
    color: Colors.textMuted,
    marginBottom: 16,
  },
  roleText: {
    color: Colors.textMuted,
    marginBottom: 16,
    fontSize: 13,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  limitText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  dropdownLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 4,
  },
  formNote: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  bloodPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  bloodPillActive: {
    backgroundColor: '#D7263D',
    borderColor: '#D7263D',
  },
  bloodPillText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  bloodPillTextActive: {
    color: '#FFF',
  },
  bloodBadge: {
    backgroundColor: 'rgba(215, 38, 61, 0.15)',
    borderWidth: 1,
    borderColor: '#D7263D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  bloodBadgeText: {
    color: '#D7263D',
    fontSize: 11,
    fontWeight: '800',
  },
});
