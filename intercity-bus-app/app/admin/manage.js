import React, { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator, Alert, FlatList, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { API_BASE } from "../../services/api";
import { AlertBanner } from "../../components/ui/AlertBanner";

export default function AdminManageScreen() {
  const router = useRouter();
  const { role, adminType, adminRole } = useLocalSearchParams();
  console.log('AdminManageScreen params:', { role, adminType, adminRole });
  const isSuperAdmin = role === 'super-admin' || adminRole === 'super-admin';
  const isManager = role === 'manager' || adminRole === 'manager';
  const canDelete = isSuperAdmin;
  const canEdit = isSuperAdmin || isManager || (role === 'admin' && adminType === 'user-management');
  const canViewList = canEdit || role === 'staff' || adminRole === 'staff';
  const isViewOnly = !canEdit && (role === 'staff' || adminRole === 'staff');

  const [activeTab, setActiveTab] = useState('passengers'); // 'passengers', 'drivers', or 'admins'
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminData, setAdminData] = useState({ name: '', username: '', password: '', email: '', phone: '', role: 'admin', adminType: 'user-management', adminRole: 'admin', isActive: true });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [performer, setPerformer] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('user_session');
        if (sessionStr) {
          setPerformer(JSON.parse(sessionStr));
        }
      } catch (err) {
        console.error('Session retrieval failed:', err);
      }
    };
    fetchSession();
  }, []);

  const loadAdmins = useCallback(async ({ search = searchText, role: filterRole = roleFilter, status = activeFilter } = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (status !== 'all') params.append('status', status);
      const response = await fetch(`${API_BASE}/users?${params.toString()}`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.users || []);
      } else {
        setError(data.message || 'Unable to load users.');
      }
    } catch (_error) {
      setError('Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  }, [searchText, roleFilter, activeFilter, adminRole, role]);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/audit`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [role, adminRole]);

  useEffect(() => {
    if (!canViewList) {
      setLoading(false);
      return;
    }

    let targetRole = 'all';
    if (activeTab === 'passengers') targetRole = 'passenger';
    else if (activeTab === 'drivers') targetRole = 'driver';
    else if (activeTab === 'admins') targetRole = 'admin';

    setRoleFilter(targetRole);
    loadAdmins({ role: targetRole });
  }, [activeTab, canViewList, loadAdmins]);

  const handleEdit = (admin) => {
    setEditingAdminId(admin._id);
    setError('');
    setSuccess('');
    setAdminData({
      name: admin.name || '',
      username: admin.username || '',
      password: '',
      email: admin.email || '',
      phone: admin.phone || '',
      role: admin.role || 'admin',
      adminType: admin.adminType || 'user-management',
      adminRole: admin.adminRole || 'admin',
      isActive: typeof admin.isActive === 'boolean' ? admin.isActive : true,
    });
  };

  const handleCancelEdit = () => {
    setEditingAdminId(null);
    setError('');
    setSuccess('');
    setAdminData({ name: '', username: '', password: '', email: '', phone: '', role: 'admin', adminType: 'user-management', adminRole: 'admin', isActive: true });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!adminData.name || !adminData.username) {
      setError('Please fill in both the Full Name and Username.');
      return;
    }
    if (!editingAdminId && !adminData.password) {
      setError('Please enter a password for new user accounts.');
      return;
    }
    if (adminData.role === 'admin' && !adminData.adminType) {
      setError('Please choose an access type for admin users.');
      return;
    }

    if (isViewOnly) {
      setError('View-only users cannot modify accounts.');
      return;
    }

    setSaving(true);
    try {
      if (!canEdit) {
        setError('Only authorized administrators can edit users.');
        setSaving(false);
        return;
      }
      const method = editingAdminId ? 'PUT' : 'POST';
      const url = editingAdminId ? `${API_BASE}/users/${editingAdminId}` : `${API_BASE}/users`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': performer?._id || performer?.id,
          'x-user-phone': performer?.phone,
          'x-user-name': performer?.username || performer?.name,
        },
        body: JSON.stringify({
          name: adminData.name,
          username: adminData.username || undefined,
          password: adminData.password || undefined,
          email: adminData.email,
          phone: adminData.phone || undefined,
          role: adminData.role,
          adminType: adminData.role === 'admin' ? adminData.adminType : undefined,
          adminRole: adminData.role === 'admin' ? adminData.adminRole : undefined,
          isActive: adminData.isActive,
          status: adminData.isActive ? 'active' : 'inactive',
          performerRole: role || adminRole,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(editingAdminId ? 'User account updated.' : 'User account created.');
        handleCancelEdit();
        loadAdmins();
      } else {
        setError(data.message || 'Unable to save user.');
      }
    } catch (_error) {
      setError('Unable to connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiveStatus = async (admin) => {
    const newStatus = !admin.isActive;
    const actionText = newStatus ? 'Activate' : 'Deactivate';

    const confirmed = await new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const ok = window.confirm(`${actionText} access for ${admin.name}?`);
        resolve(ok);
        return;
      }

      Alert.alert(
        `${actionText} User`,
        `${actionText} access for ${admin.name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: actionText, style: newStatus ? 'default' : 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/users/${admin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': performer?._id || performer?.id,
          'x-user-phone': performer?.phone,
          'x-user-name': performer?.username || performer?.name,
        },
        body: JSON.stringify({
          isActive: newStatus,
          status: newStatus ? 'active' : 'inactive',
          performerRole: role || adminRole,
        }),
      });
      console.log('Status toggle response:', response.status);
      const data = await response.json();
      console.log('Status toggle data:', data);
      if (response.ok) {
        setSuccess(`User account ${newStatus ? 'activated' : 'deactivated'}.`);
        loadAdmins({ status: 'all' });
      } else {
        setError(data.message || 'Unable to update status.');
      }
    } catch (_error) {
      setError('Unable to connect to backend server.');
    } finally {
      setSaving(false);
    }
  };

  const EmptyState = ({ title, message }) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="people-outline" size={32} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (!canViewList) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Management</Text>
          <View style={{ width: 32 }} />
        </View>
        <EmptyState title="Access Denied" message="Only administrators or staff can access this dashboard." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'passengers' && styles.activeTab]}
          onPress={() => setActiveTab('passengers')}
        >
          <Text style={[styles.tabText, activeTab === 'passengers' && styles.activeTabText]}>Passengers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'drivers' && styles.activeTab]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text style={[styles.tabText, activeTab === 'drivers' && styles.activeTabText]}>Drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'admins' && styles.activeTab]}
          onPress={() => setActiveTab('admins')}
        >
          <Text style={[styles.tabText, activeTab === 'admins' && styles.activeTabText]}>Admin accounts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AlertBanner type="error" message={error} onRetry={error.includes('connect to backend') ? () => loadAdmins() : undefined} />
        <AlertBanner type="success" message={success} />

        <>
          <View style={styles.filterCard}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={20} color={Colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, phone, email..."
                placeholderTextColor={Colors.textMuted}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={() => loadAdmins()}
              />
            </View>
          </View>

          {isViewOnly ? <AlertBanner type="warning" message="You have read-only access to the organizational directory." /> : null}

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : admins.length === 0 ? (
            <EmptyState title="No users found" message="We couldn't find any users matching those filters." />
          ) : (
            <FlatList
              data={admins}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item: admin }) => (
                <View style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{admin.name ? admin.name.charAt(0).toUpperCase() : '?'}</Text>
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={styles.userName}>{admin.name}</Text>
                      <Text style={styles.userContact}>{admin.username || admin.phone || admin.email || 'No contact info'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: admin.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 68, 68, 0.1)' }]}>
                      <Text style={[styles.statusBadgeText, { color: admin.isActive ? '#4CAF50' : '#ff4444' }]}>{admin.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaRow}>
                      <Ionicons name="shield-checkmark" size={14} color={Colors.textMuted} />
                      <Text style={styles.metaLabel}>Role:</Text>
                      <Text style={styles.metaValue}>{admin.role?.toUpperCase()}</Text>
                    </View>
                    {(admin.role === 'admin' || admin.role === 'staff' || admin.role === 'manager') && (
                      <View style={styles.metaRow}>
                        <Ionicons name="briefcase" size={14} color={Colors.textMuted} />
                        <Text style={styles.metaLabel}>Access:</Text>
                        <Text style={styles.metaValue}>{admin.adminType?.replace(/-/g, ' ') || 'None'}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    {canEdit && !isViewOnly ? (
                      <TouchableOpacity
                        style={[styles.statusToggleBtn, { backgroundColor: admin.isActive ? 'rgba(255, 68, 68, 0.1)' : 'rgba(76, 175, 80, 0.1)' }]}
                        onPress={() => handleToggleActiveStatus(admin)}
                      >
                        <Ionicons
                          name={admin.isActive ? "close-circle-outline" : "checkmark-circle-outline"}
                          size={18}
                          color={admin.isActive ? "#ff4444" : "#4CAF50"}
                        />
                        <Text style={[styles.statusToggleText, { color: admin.isActive ? "#ff4444" : "#4CAF50" }]}>
                          {admin.isActive ? 'Deactivate account' : 'Activate account'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}

          {editingAdminId || (activeTab === 'admins' && !editingAdminId && canEdit && !isViewOnly) ? (
            <View style={styles.editSection}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-add" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitleText}>{editingAdminId ? 'Edit Profile' : 'New Registration'}</Text>
              </View>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} value={adminData.name} placeholder="e.g. John Doe" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setAdminData((prev) => ({ ...prev, name: text }))} />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput style={styles.input} value={adminData.username} placeholder="e.g. admin_john" autoCapitalize="none" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setAdminData((prev) => ({ ...prev, username: text }))} />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={styles.input} value={adminData.email} placeholder="e.g. john@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} onChangeText={(text) => setAdminData((prev) => ({ ...prev, email: text }))} />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.input} secureTextEntry value={adminData.password} placeholder={editingAdminId ? "New Password (Optional)" : "Setup Secure Password"} placeholderTextColor={Colors.textMuted} onChangeText={(text) => setAdminData((prev) => ({ ...prev, password: text }))} />

              {!editingAdminId && activeTab === 'admins' ? null : (
                <>
                  <Text style={styles.inputLabel}>Assign System Role</Text>
                  <View style={styles.selectGrid}>
                    {['passenger', 'driver', 'staff', 'manager', 'admin', 'super-admin'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[styles.selectOption, adminData.role === option && styles.selectOptionSelected]}
                        onPress={() => setAdminData((prev) => ({ ...prev, role: option }))}
                      >
                        <Text style={[styles.selectOptionText, adminData.role === option && styles.selectOptionTextSelected]}>{option.replace(/-/g, ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {(adminData.role === 'admin' || adminData.role === 'manager' || adminData.role === 'staff' || (!editingAdminId && activeTab === 'admins')) && (
                <>
                  <Text style={styles.inputLabel}>Department Access</Text>
                  <View style={styles.selectGrid}>
                    {['User Management', 'Finance', 'Third party bus supplier Management'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[styles.selectOption, adminData.adminType === option && styles.selectOptionSelected]}
                        onPress={() => setAdminData((prev) => ({ ...prev, adminType: option, role: 'admin' }))}
                      >
                        <Text style={[styles.selectOptionText, adminData.adminType === option && styles.selectOptionTextSelected]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>{editingAdminId ? 'Save Profile Updates' : 'Create Account'}</Text>}
              </TouchableOpacity>
              {editingAdminId ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                  <Text style={styles.cancelBtnText}>Discard Changes</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  backButton: { width: 40 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: Colors.primary },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  filterCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  statusToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  statusToggleText: { fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  searchInput: { flex: 1, color: '#FFF', height: 46, fontSize: 14 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  filterChip: { backgroundColor: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  activeFilterChip: { backgroundColor: 'rgba(255, 193, 7, 0.1)', borderColor: Colors.primary },
  filterChipText: { color: Colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
  activeFilterChipText: { color: Colors.primary, fontWeight: '600' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 193, 7, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: '80%' },
  userCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  userName: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  userContact: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  metaGrid: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  metaLabel: { color: Colors.textMuted, fontSize: 12, marginLeft: 6, width: 60 },
  metaValue: { color: '#FFF', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  cardBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, marginRight: 10 },
  cardBtnText: { fontSize: 12, fontWeight: '700' },
  cardBtnDelete: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255, 68, 68, 0.1)' },
  editSection: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#333' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitleText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginLeft: 10 },
  input: { backgroundColor: '#1e1e1e', color: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, marginBottom: 15 },
  inputLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 5 },
  selectGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  selectOption: { backgroundColor: '#1a1a1a', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginRight: 10, marginBottom: 10 },
  selectOptionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  selectOptionText: { color: Colors.textMuted, fontSize: 13, textTransform: 'capitalize' },
  selectOptionTextSelected: { color: '#000', fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  cancelBtn: { height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  logCard: { flexDirection: 'row', marginBottom: 20 },
  logDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.textMuted, marginTop: 5, marginRight: 15 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logAction: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  logTime: { color: Colors.textMuted, fontSize: 11 },
  logLine: { color: '#CCC', fontSize: 13, lineHeight: 20 },
  logHighlight: { color: Colors.primary, fontWeight: '600' },
  logDetail: { color: Colors.textMuted, fontSize: 12, marginTop: 5, fontStyle: 'italic' }
});
