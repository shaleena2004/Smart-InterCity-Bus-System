import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDriverStats, updateUserProfile } from '../services/api';

export default function ProfileScreen() {
  const { userRole, setUserRole, userName, setUserName, userPhone, setUserPhone, userId, assignedVehicle } = useAuth();
  const router = useRouter();

  const [editModal, setEditModal] = React.useState(false);
  const [historyModal, setHistoryModal] = React.useState(false);
  const [tempName, setTempName] = React.useState(userName || '');
  const [tempPhone, setTempPhone] = React.useState(userPhone || '');
  const [driverStats, setDriverStats] = React.useState({ tripCount: 0, rating: 5.0, onTimePercentage: '100%', trips: [] });
  const [loadingStats, setLoadingStats] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (userRole === 'driver' && userId) {
        fetchDriverStats();
      }
    }, [userRole, userId])
  );

  const fetchDriverStats = async () => {
    console.log('>>> [FRONTEND] Profile fetching stats for userId:', userId);
    setLoadingStats(true);
    try {
      const res = await getDriverStats(userId);
      setDriverStats(res.data);
    } catch (err) {
      console.log('Failed to fetch driver stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: () => {
          setUserRole(null);
        }
      }
    ]);
  };

  const getRoleLabel = () => {
    const labels = {
      'passenger': 'PASSENGER',
      'driver': 'DRIVER',
      'staff': 'OPERATIONS STAFF',
      'finance': 'FINANCE DEPARTMENT',
      'supplier': 'SUPPLIER PORTAL',
      'admin': 'SYSTEM ADMINISTRATOR',
      'super-admin': 'SUPER ADMINISTRATOR',
      'manager': 'MANAGER',
    };
    return labels[userRole] || 'PASSENGER';
  };

  const getRoleColor = () => {
    const colors = {
      'passenger': '#FFC107',
      'driver': '#3298dc',
      'staff': '#4ade80',
      'finance': '#f3be0f',
      'supplier': '#e67e22',
      'admin': '#f14668',
      'super-admin': '#f14668',
    };
    return colors[userRole] || '#FFC107';
  };

  const getInitials = () => {
    if (!userName) return '?';
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Menu items change based on role
  const getMenuItems = () => {
    const common = [
      { icon: 'person', label: 'Edit Profile', action: () => { setTempName(userName); setTempPhone(userPhone); setEditModal(true); } },
      { icon: 'settings', label: 'Settings', action: () => router.push('/settings') },
    ];

    if (userRole === 'passenger') {
      return [
        ...common,
        { icon: 'card', label: 'Payment Methods', action: () => Alert.alert('Payments', 'Digital wallet integration coming soon!') },
        { icon: 'time', label: 'Travel History', action: () => router.push('/bookings') },
        { icon: 'pricetag', label: 'Promotions & Offers', action: () => Alert.alert('Offers', 'No active promotions for your region.') },
        { icon: 'shield-checkmark', label: 'Emergency Contacts', action: () => Alert.alert('Safety', 'Emergency feature is active.') },
        { icon: 'notifications', label: 'Notifications', action: () => Alert.alert('Notifications', 'You are all caught up!') },
      ];
    }
    if (userRole === 'driver') {
      return [
        ...common,
        { icon: 'bus', label: 'My Trips', action: () => setHistoryModal(true) },
        { icon: 'time', label: 'Duty History', action: () => Alert.alert('Duty', 'Duty logs are synced daily.') },
        { icon: 'notifications', label: 'Alerts', action: () => Alert.alert('Alerts', 'No active traffic alerts.') },
      ];
    }
    if (userRole === 'finance') {
      return [
        ...common,
        { icon: 'cash', label: 'Revenue Dashboard', action: () => router.push('/finance') },
        { icon: 'document-text', label: 'Financial Reports', action: () => router.push('/finance') },
        { icon: 'notifications', label: 'Audit Logs', action: () => Alert.alert('Audit', 'No pending audits.') },
      ];
    }
    if (userRole === 'supplier') {
      return [
        ...common,
        { icon: 'grid', label: 'Fleet Dashboard', action: () => router.push('/supplier_dashboard') },
        { icon: 'stats-chart', label: 'Performance', action: () => router.push('/supplier_dashboard') },
      ];
    }
    // Admin / Staff
    return [
      ...common,
      { icon: 'people', label: 'User Management', action: () => router.push('/users') },
      { icon: 'map', label: 'Route Management', action: () => router.push('/routes') },
      { icon: 'cash', label: 'Financial Overview', action: () => router.push('/finance') },
      { icon: 'business', label: 'Manage Suppliers', action: () => router.push('/suppliers') },
    ];
  };

  const saveProfile = async () => {
    try {
      await updateUserProfile(userId, { name: tempName, phone: tempPhone });
      setUserName(tempName);
      setUserPhone(tempPhone);
      setEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', 'Failed to save profile changes to database.');
    }
  };

  const roleColor = getRoleColor();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60, paddingTop: 40 }}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarCircle, { borderColor: roleColor }]}>
            <Text style={[styles.avatarInitials, { color: roleColor }]}>{getInitials()}</Text>
          </View>
          <View style={[styles.editBadge, { backgroundColor: roleColor }]}>
            <Ionicons name="pencil" size={14} color="#000" />
          </View>
        </View>
        <Text style={styles.nameText}>{userName || 'User'}</Text>
        <Text style={styles.phoneText}>{userPhone ? `+94 ${userPhone}` : 'No phone set'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{getRoleLabel()}</Text>
        </View>
      </View>

      {/* Stats Row (based on role) */}
      {(userRole === 'passenger' || userRole === 'driver') && (
        <View style={styles.statsRow}>
          {userRole === 'passenger' ? (
            <>
              <View style={styles.statBox}><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>Trips</Text></View>
              <View style={[styles.statBox, styles.statBoxMiddle]}><Text style={styles.statNum}>3</Text><Text style={styles.statLabel}>Saved Routes</Text></View>
              <View style={styles.statBox}><Text style={styles.statNum}>4.8</Text><Text style={styles.statLabel}>Rating</Text></View>
            </>
          ) : (
            <>
              <View style={styles.statBox}><Text style={styles.statNum}>{driverStats.tripCount}</Text><Text style={styles.statLabel}>Trips</Text></View>
              <View style={[styles.statBox, styles.statBoxMiddle]}><Text style={styles.statNum}>{driverStats.onTimePercentage}</Text><Text style={styles.statLabel}>On-time</Text></View>
              <View style={styles.statBox}><Text style={styles.statNum}>{driverStats.rating}</Text><Text style={styles.statLabel}>Rating</Text></View>
            </>
          )}
        </View>
      )}

      {/* Menu List */}
      <View style={styles.menuContainer}>
        {getMenuItems().map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
            <View style={[styles.menuIconBox, { backgroundColor: roleColor + '15' }]}>
              <Ionicons name={item.icon} size={18} color={roleColor} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#8690A9" />
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Book&Go v1.0.0</Text>
        <Text style={styles.appInfoText}>Smart InterCity Bus System</Text>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: roleColor }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={roleColor} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: roleColor }]}>LOGOUT</Text>
        </TouchableOpacity>
      </View>

      {/* Trip History Modal */}
      <Modal visible={historyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Trip History</Text>
              <TouchableOpacity onPress={() => setHistoryModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {driverStats.trips && driverStats.trips.length > 0 ? (
                driverStats.trips.map((trip, idx) => (
                  <View key={trip._id || idx} style={styles.tripHistoryItem}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                        {trip.routeId?.routeName ? `Route: ${trip.routeId.routeName}` : `Trip #${driverStats.trips.length - idx}`}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: trip.status === 'ON_TIME' ? '#4ade8020' : '#f1466820' }]}>
                        <Text style={{ color: trip.status === 'ON_TIME' ? '#4ade80' : '#f14668', fontSize: 10, fontWeight: 'bold' }}>{trip.status}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#8690A9', fontSize: 13 }}>
                      {trip.routeId?.startLocation && trip.routeId?.endLocation ? `${trip.routeId.startLocation} → ${trip.routeId.endLocation} | ` : ''}
                      {new Date(trip.date).toLocaleDateString()} at {new Date(trip.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#404659', textAlign: 'center', marginVertical: 40 }}>No trip records found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your Name"
              placeholderTextColor="#8690A9"
            />

            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.input}
              value={tempPhone}
              onChangeText={setTempPhone}
              placeholder="e.g. 771234567"
              placeholderTextColor="#8690A9"
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: roleColor }]} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141926' },
  avatarInitials: { fontSize: 32, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0B0F19' },
  nameText: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  phoneText: { color: '#8690A9', fontSize: 14, marginBottom: 10 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 24, backgroundColor: '#141926', borderRadius: 16, borderWidth: 1, borderColor: '#232940', overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#232940' },
  statNum: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#8690A9', fontSize: 11 },

  menuContainer: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A1D24' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuLabel: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },

  appInfo: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
  appInfoText: { color: '#404659', fontSize: 12 },

  logoutContainer: { paddingHorizontal: 20, marginTop: 16 },
  logoutBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  logoutText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141926', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: '#232940' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#0B0F19', borderRadius: 12, padding: 16, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: '#232940' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#8690A9', fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  tripHistoryItem: { backgroundColor: '#0B0F19', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#232940' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
