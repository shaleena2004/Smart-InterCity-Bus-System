import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { API_BASE } from "../../services/api";

export default function AdminCreateScreen() {
  const router = useRouter();
  const { role, adminRole } = useLocalSearchParams();
  const isSuperAdmin = role === 'super-admin' || adminRole === 'super-admin';
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'super-admin',
    adminType: 'user-management',
    adminRole: 'staff',
    status: 'active',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    setMessage('');

    if (!newAdmin.name || !newAdmin.password) {
      setError('Please fill in name and password.');
      return;
    }
    if (['super-admin', 'staff-admin-access'].includes(newAdmin.role) && !newAdmin.username) {
      setError('Please enter a username for admin accounts.');
      return;
    }
    if (newAdmin.role === 'passenger' && !newAdmin.phone) {
      setError('Please enter a phone number for passenger accounts.');
      return;
    }
    if (newAdmin.role === 'staff-admin-access' && !newAdmin.adminType) {
      setError('Please select an access type for new staff admin users.');
      return;
    }
    if (newAdmin.role === 'staff-admin-access' && newAdmin.adminType === 'user-management' && !newAdmin.adminRole) {
      setError('Please select a role for user-management admin access.');
      return;
    }

    setSaving(true);
    try {
      const payloadRole = newAdmin.role === 'staff-admin-access' ? 'admin' : newAdmin.role;
      const payloadAdminType = newAdmin.role === 'staff-admin-access' ? newAdmin.adminType : undefined;
      const payloadAdminRole = newAdmin.role === 'staff-admin-access'
        ? (newAdmin.adminType === 'user-management' ? newAdmin.adminRole : 'staff')
        : (newAdmin.role === 'super-admin' ? 'super-admin' : undefined);

      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': role || adminRole },
        body: JSON.stringify({
          name: newAdmin.name,
          username: newAdmin.username || undefined,
          password: newAdmin.password,
          email: newAdmin.email,
          phone: newAdmin.phone || undefined,
          role: payloadRole,
          adminType: payloadAdminType,
          adminRole: payloadAdminRole,
          status: newAdmin.status,
          performerRole: role || adminRole,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('User account created successfully.');
        setNewAdmin({
          name: '',
          username: '',
          password: '',
          email: '',
          phone: '',
          role: 'super-admin',
          adminType: 'user-management',
          adminRole: 'staff',
          status: 'active',
          isActive: true,
        });
      } else {
        setError(data.message || 'Failed to create admin account.');
      }
    } catch (_error) {
      setError('Unable to connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create User</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Create New User Account</Text>
        <Text style={styles.pageSubtitle}>Only Super Admin can create or manage user accounts.</Text>
        <Text style={styles.label}>Role</Text>
        <View style={styles.selectBox}>
          {[
            { value: 'super-admin', label: 'super admin' },
            { value: 'staff-admin-access', label: 'staff admin access' },
            { value: 'passenger', label: 'passenger' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.selectOption, newAdmin.role === option.value && styles.selectOptionSelected]}
              onPress={() => setNewAdmin((prev) => ({ ...prev, role: option.value }))}
            >
              <Text style={[styles.selectOptionText, newAdmin.role === option.value && styles.selectOptionTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Status</Text>
        <View style={styles.selectBox}>
          {['active', 'inactive'].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.selectOption, newAdmin.status === option && styles.selectOptionSelected]}
              onPress={() => setNewAdmin((prev) => ({ ...prev, status: option, isActive: option === 'active' }))}
            >
              <Text style={[styles.selectOptionText, newAdmin.status === option && styles.selectOptionTextSelected]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        {!isSuperAdmin ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyTitle}>Access Denied</Text>
            <Text style={styles.emptyText}>Only Super Admin can create new admin users.</Text>
            <TouchableOpacity style={styles.backToDashboard} onPress={() => router.push({ pathname: '/admin', params: { role, adminRole } })}>
              <Text style={styles.backToDashboardText}>Back to dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={newAdmin.name} placeholder="Full name" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setNewAdmin((prev) => ({ ...prev, name: text }))} />

            {(['super-admin', 'staff-admin-access'].includes(newAdmin.role)) && (
              <>
                <Text style={styles.label}>Username</Text>
                <TextInput style={styles.input} autoCapitalize="none" value={newAdmin.username} placeholder="Username" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setNewAdmin((prev) => ({ ...prev, username: text }))} />
              </>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} secureTextEntry value={newAdmin.password} placeholder="Password" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setNewAdmin((prev) => ({ ...prev, password: text }))} />

            {(newAdmin.role === 'staff-admin-access') && (
              <>
                <Text style={styles.label}>Access Type</Text>
                <View style={styles.selectBox}>
                  {[
                    { value: 'user-management', label: 'user management admin' },
                    { value: 'finance-management', label: 'finance management admin' },
                    { value: 'bus-supplier-management', label: 'bus supplier manager admin' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.selectOption, newAdmin.adminType === option.value && styles.selectOptionSelected]}
                      onPress={() => setNewAdmin((prev) => ({ ...prev, adminType: option.value }))}
                    >
                      <Text style={[styles.selectOptionText, newAdmin.adminType === option.value && styles.selectOptionTextSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {newAdmin.adminType === 'user-management' && (
                  <>
                    <Text style={styles.label}>Admin Role</Text>
                    <View style={styles.selectBox}>
                      {['super-admin', 'admin', 'staff'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[styles.selectOption, newAdmin.adminRole === option && styles.selectOptionSelected]}
                          onPress={() => setNewAdmin((prev) => ({ ...prev, adminRole: option }))}
                        >
                          <Text style={[styles.selectOptionText, newAdmin.adminRole === option && styles.selectOptionTextSelected]}>{option.replace(/-/g, ' ')}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput style={styles.input} autoCapitalize="none" value={newAdmin.email} placeholder="name@example.com" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setNewAdmin((prev) => ({ ...prev, email: text }))} />

            <Text style={styles.label}>{newAdmin.role === 'passenger' ? 'Phone (required)' : 'Phone (optional)'}</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={newAdmin.phone} placeholder="+94 7X XXX XXXX" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setNewAdmin((prev) => ({ ...prev, phone: text }))} />

            <TouchableOpacity style={styles.actionButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.actionButtonText}>Create User</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 32, paddingBottom: 22 },
  backButton: { width: 32, alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  container: { paddingHorizontal: 22, paddingBottom: 30 },
  pageTitle: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  pageSubtitle: { color: Colors.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  errorText: { color: '#ff4444', marginBottom: 14 },
  successText: { color: '#7ED957', marginBottom: 14 },
  label: { color: Colors.textMuted, fontSize: 13, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1e1e1e', color: '#FFF', borderRadius: 14, padding: 14, fontSize: 15 },
  selectBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  selectOption: { backgroundColor: '#181818', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginRight: 10, marginBottom: 10 },
  selectOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectOptionText: { color: Colors.textMuted, fontSize: 13 },
  selectOptionTextSelected: { color: '#000', fontWeight: '700' },
  staticValue: { color: '#FFF', fontSize: 14, paddingVertical: 8 },
  actionButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  actionButtonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  emptyStateContainer: { marginTop: 40, padding: 20, backgroundColor: '#1e1e1e', borderRadius: 18, alignItems: 'center' },
  backToDashboard: { marginTop: 20, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 14 },
  backToDashboardText: { color: '#000', fontWeight: '700' },
});
