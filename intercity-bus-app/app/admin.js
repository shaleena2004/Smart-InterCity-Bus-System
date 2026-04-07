import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, FlatList, TouchableOpacity, Alert, TextInput, Linking, BackHandler, Modal, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { API_BASE } from "../services/api";
import { io } from 'socket.io-client';

export default function AdminScreen() {
  const router = useRouter();
  const { role: paramRole, adminType: paramAdminType, adminRole: paramAdminRole } = useLocalSearchParams();
  const [role, setRole] = useState(paramRole);
  const [adminType, setAdminType] = useState(paramAdminType);
  const [adminRole, setAdminRole] = useState(paramAdminRole);

  useEffect(() => {
    const loadSession = async () => {
      const sessionStr = await AsyncStorage.getItem('user_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (!role && session.role) setRole(session.role);
        if (!adminType && session.adminType) setAdminType(session.adminType);
        if (!adminRole && (session.adminRole || session.role)) setAdminRole(session.adminRole || session.role);
      }
    };
    loadSession();
  }, []);

  const isSuperAdmin = role === 'super-admin' || adminRole === 'super-admin';
  const isUserAdmin = isSuperAdmin || adminType === 'user-management' || role === 'admin';
  const isFinanceStaff = adminType === 'finance-management';
  const isBusSupplier = adminType === 'bus-supplier-management';

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to close Book&Go?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() }
        ]);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      router.replace('/role');
    } catch (e) {
      console.error(e);
    }
  };

  const canCreateDelete = isUserAdmin;
  const canManageUsers = isUserAdmin;
  const canViewFleet = isUserAdmin || isBusSupplier;
  const canViewFinance = isUserAdmin || isFinanceStaff;
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingResolved, setLoadingResolved] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [busSearch, setBusSearch] = useState('');
  const [busStatusFilter, setBusStatusFilter] = useState('all');
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [stats, setStats] = useState({ passengers: 0, drivers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [alertPopupVisible, setAlertPopupVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('users');
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [mtFilter, setMtFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [riskAnalysisVisible, setRiskAnalysisVisible] = useState(false);
  const [analyzingRisk, setAnalyzingRisk] = useState(false);
  const [showAllMaintenanceLogs, setShowAllMaintenanceLogs] = useState(false);
  const [selectedAnalysisBus, setSelectedAnalysisBus] = useState('ALL');
  const [analysisDropdownVisible, setAnalysisDropdownVisible] = useState(false);

  const alertSoundRef = useRef(null);




  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [privilegesModalVisible, setPrivilegesModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [notifySOS, setNotifySOS] = useState(true);
  const [notifyHealth, setNotifyHealth] = useState(true);
  const [notifyIncidents, setNotifyIncidents] = useState(true);

  const handleNavigate = (pathname) => {
    router.push({ pathname, params: { role, adminType, adminRole } });
  };

  const playAlertSound = () => {
    if (typeof Audio !== 'undefined') {
      try {
        if (!alertSoundRef.current) {
          alertSoundRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
        }
        alertSoundRef.current.play().catch(() => { });
      } catch (error) {
        console.warn('Unable to play alert sound', error);
      }
    }
  };

  const fetchVehicles = async (search = busSearch, statusFilter = busStatusFilter) => {
    try {
      setLoadingVehicles(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await fetch(`${API_BASE}/vehicles?${params.toString()}`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load vehicles');
      }
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Fetch vehicles failed', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const runRiskAnalysis = async () => {
    try {
      setAnalyzingRisk(true);
      const sessionStr = await AsyncStorage.getItem('user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : {};

      const response = await fetch(`${API_BASE}/maintenance/risk/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': session._id || session.id
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Analysis failed');

      fetchVehicles();
      setRiskAnalysisVisible(true);
      Alert.alert('Analysis Complete', 'Risk classification scores updated for all buses.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setAnalyzingRisk(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/stats`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Fetch stats failed', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const markAlertRead = async (alertId) => {
    try {
      await fetch(`${API_BASE}/alerts/${alertId}/read`, { method: 'PUT' });
      fetchStats();
    } catch (error) {
      console.warn('Failed to mark alert read', error);
    }
  };

  const forwardAlert = async (department) => {
    if (!activeAlert) return;
    try {
      const sessionStr = await AsyncStorage.getItem('user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionUserId = session._id || session.id;
      const sessionUserName = session.username || session.name;
      const sessionUserPhone = session.phone;

      const payload = {
        department,
        message: `Forwarded to ${department}`,
        sender: session.name || role || 'Admin',
        senderRole: adminRole || role || 'admin',
      };
      const response = await fetch(`${API_BASE}/alerts/${activeAlert._id}/forward`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': sessionUserId,
          'x-user-phone': sessionUserPhone,
          'x-user-name': sessionUserName,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to forward alert');
      }
      fetchAlerts();
      fetchStats();
      Alert.alert('Forwarded', `Alert forwarded to ${department}`);
    } catch (err) {
      console.error('Forward failed', err);
      Alert.alert('Error', err.message || 'Unable to forward alert');
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const response = await fetch(`${API_BASE}/alerts?status=pending,acknowledged`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load alerts');
      }
      setPendingAlerts(data.alerts || []);
    } catch (error) {
      console.error('Fetch alerts failed', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchRecentIncidents = async () => {
    try {
      setLoadingIncidents(true);
      const response = await fetch(`${API_BASE}/incidents?status=reported,assigned,pending,acknowledged`, {
        headers: { 'x-user-role': role || adminRole || 'admin' },
      });
      const data = await response.json();
      if (response.ok) {
        setRecentIncidents((data.incidents || []));
      }
    } catch (error) {
      console.warn('Fetch recent incidents failed', error);
    } finally {
      setLoadingIncidents(false);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await fetch(`${API_BASE}/maintenance/issues`, {
        headers: { 'x-user-role': role || adminRole || 'admin' },
      });
      const data = await response.json();
      if (response.ok) {
        setRecentTasks((data.issues || []).slice(0, 50));
      }
    } catch (error) {
      console.warn('Fetch recent tasks (issues) failed', error);
    } finally {
      setLoadingTasks(false);
    }
  };


  const fetchResolvedAlerts = async () => {
    try {
      setLoadingResolved(true);
      const response = await fetch(`${API_BASE}/alerts?status=resolved`, {
        headers: { 'x-user-role': role || adminRole },
      });
      const data = await response.json();
      if (response.ok) {
        setResolvedAlerts(data.alerts || []);
      }
    } catch (error) {
      console.warn('Fetch resolved alerts failed', error);
    } finally {
      setLoadingResolved(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchResolvedAlerts();
    fetchRecentIncidents();
    fetchRecentTasks();
    fetchVehicles();
    fetchStats();

    const socket = io(API_BASE, { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('Admin socket connected', socket.id);
    });

    socket.on('maintenanceUpdate', () => {
      fetchVehicles();
      fetchRecentIncidents();
      fetchRecentTasks();
    });

    socket.on('issueCreated', () => {
      fetchVehicles();
      fetchRecentIncidents();
      fetchRecentTasks();
    });

    socket.on('sosAlertCreated', (alert) => {
      setPendingAlerts((prev) => [alert, ...prev.filter((item) => item._id !== alert._id)]);
      setAlertPopupVisible(true);
      playAlertSound();
      fetchStats();
      fetchVehicles();
    });

    socket.on('sosAlertUpdated', (alert) => {
      const openStatuses = ['pending', 'acknowledged'];
      if (alert.status === 'resolved') {
        setPendingAlerts((prev) => prev.filter((item) => item._id !== alert._id));
        setResolvedAlerts((prev) => [alert, ...prev.filter((item) => item._id !== alert._id)]);
      } else {
        setPendingAlerts((prev) => {
          const existing = prev.find((item) => item._id === alert._id);
          if (existing) {
            const updated = prev.map((item) => (item._id === alert._id ? alert : item));
            return updated.filter((item) => openStatuses.includes(item.status));
          }
          return openStatuses.includes(alert.status) ? [alert, ...prev] : prev;
        });
      }
      // setAlertPopupVisible(true); // Don't show popup for resolution necessarily? Or only if not current?
      // playAlertSound();
      fetchStats();
      fetchVehicles();
    });

    socket.on('sosAlertForwarded', () => {
      fetchStats();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const nextAlert = pendingAlerts.length > 0 ? pendingAlerts[0] : null;
    setActiveAlert(nextAlert);
    if (nextAlert) {
      markAlertRead(nextAlert._id);
    }
  }, [pendingAlerts]);

  const handleIncidentAction = async (action, incident) => {
    if (!incident) return;
    const newStatus = action === 'acknowledge' ? 'assigned' : 'resolved';

    try {
      const sessionStr = await AsyncStorage.getItem('user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionUserId = session._id || session.id;
      const sessionUserName = session.username || session.name;
      const sessionUserPhone = session.phone;

      const currentRole = role || adminRole || session.role || 'admin';
      const incidentId = incident._id || incident.incidentId;

      const response = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
          'x-user-id': sessionUserId || '',
          'x-user-phone': sessionUserPhone || '',
          'x-user-name': sessionUserName || 'Admin',
        },
        body: JSON.stringify({
          incidentStatus: newStatus,
          comment: `Manual action ${action} by administrator.`,
          actor: sessionUserName || 'Admin',
          actorRole: currentRole
        })
      });

      if (!response.ok) throw new Error('Action update failed');

      Alert.alert('Success', `Task successfully updated to ${newStatus.toUpperCase()}.`);
      setTaskModalVisible(false);
      fetchRecentIncidents();
      fetchRecentTasks();
      fetchStats();
      fetchVehicles();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };


  const handleAlertAction = async (action) => {
    if (!activeAlert) {
      return;
    }

    const endpoint = action === 'acknowledge'
      ? `${API_BASE}/alerts/${activeAlert._id}/acknowledge`
      : `${API_BASE}/alerts/${activeAlert._id}/resolve`;

    try {
      const sessionStr = await AsyncStorage.getItem('user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionUserId = session._id || session.id;
      const sessionUserName = session.username || session.name;
      const sessionUserPhone = session.phone;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': sessionUserId,
          'x-user-phone': sessionUserPhone,
          'x-user-name': sessionUserName,
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update alert');
      }

      Alert.alert('Success', action === 'resolve' ? 'SOS alert resolved.' : 'SOS alert acknowledged.');
      fetchAlerts();
      if (action === 'resolve') {
        fetchResolvedAlerts();
      }
      fetchStats();
      if (activeAlert) {
        markAlertRead(activeAlert._id);
      }
    } catch (err) {
      console.error('Alert action failed', err);
      Alert.alert('Error', err.message || 'Unable to update alert');
    }
  };






  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setUpdatingPassword(true);
      // We need the admin's actual user ID. For now we assume they are logged in and we find them by role/username if possible, 
      // but usually the session stores the ID.
      const sessionStr = await AsyncStorage.getItem('user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      if (!session || (!session._id && !session.id)) {
        throw new Error('Session expired or user ID not found. Please log in again.');
      }

      const sessionUserId = session._id || session.id;
      const sessionUserName = session.username || session.name;
      const sessionUserPhone = session.phone;

      const response = await fetch(`${API_BASE}/users/${sessionUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role || adminRole,
          'x-user-id': sessionUserId,
          'x-user-phone': sessionUserPhone,
          'x-user-name': sessionUserName,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordModalVisible(false);
        setNewPassword('');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCallContact = async (phoneNumber) => {
    if (!phoneNumber) return;
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      console.warn('Unable to place call', error);
      Alert.alert('Error', 'Unable to open call dialog.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.appTitle}>BOOK&GO</Text>
          <Text style={styles.subtitle}>Admin Dashboard</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>

        {selectedTab === 'emergency' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Active Emergencies</Text>
            {loadingAlerts ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : pendingAlerts.length === 0 ? (
              <View style={styles.emptyAlertBox}>
                <Ionicons name="shield-checkmark" size={32} color="#4CAF50" style={{ marginBottom: 10 }} />
                <Text style={styles.alertText}>No active SOS alerts. All systems clear.</Text>
              </View>
            ) : (
              <FlatList
                data={pendingAlerts}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item: alert }) => (
                  <View style={styles.busCard}>
                    <View style={styles.busRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: '#ff4444', marginBottom: 2 }]}>SOS ALERT RECEIVED</Text>
                        <Text style={[styles.cardSubtitle, { color: '#FFFFFF', fontWeight: 'bold' }]}>{alert.message || 'Immediate assistance requested'}</Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: alert.status === 'pending' ? '#D7263D' : '#F5A623' }]}>
                        <Text style={styles.statusPillText}>{alert.status?.toUpperCase()}</Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 12, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 }}>
                      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <Text style={[styles.busDetail, { flex: 1 }]}><Text style={{ fontWeight: 'bold', color: '#888' }}>SENDER: </Text>{alert.userName || alert.driverId}</Text>
                        <Text style={[styles.busDetail, { flex: 1 }]}><Text style={{ fontWeight: 'bold', color: '#888' }}>PHONE: </Text>{alert.userPhone || alert.driverId}</Text>
                      </View>
                      <Text style={styles.busDetail}><Text style={{ fontWeight: 'bold', color: '#888' }}>VEHICLE: </Text>{alert.busNumber || alert.busId} ({alert.busModel || 'Intercity Bus'})</Text>
                    </View>

                    <View style={[styles.actionRow, { marginTop: 16 }]}>
                      {alert.status === 'acknowledged' ? (
                        <TouchableOpacity
                          style={[styles.smallButton, { backgroundColor: '#333', borderColor: Colors.primary, borderWidth: 1, flex: 1, marginRight: 8, height: 40, borderRadius: 10, justifyContent: 'center' }]}
                          onPress={() => { setActiveAlert(alert); setAlertPopupVisible(true); }}
                        >
                          <Text style={[styles.primaryButtonText, { color: Colors.primary }]}>View Details</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.smallButton, styles.primaryButton, { flex: 1, marginRight: 8, height: 40, borderRadius: 10, justifyContent: 'center' }]}
                          onPress={() => { setActiveAlert(alert); handleAlertAction('acknowledge'); }}
                        >
                          <Text style={styles.primaryButtonText}>Acknowledge</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.smallButton, styles.secondaryButton, { flex: 1, height: 40, borderRadius: 10, justifyContent: 'center' }]}
                        onPress={() => { setActiveAlert(alert); handleAlertAction('resolve'); }}
                      >
                        <Text style={styles.secondaryButtonText}>Resolve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Resolved History Section */}
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#333' }}>
              <Text style={[styles.sectionTitle, { fontSize: 18, color: '#888' }]}>SOS Alert History</Text>
              {loadingResolved ? (
                <ActivityIndicator color="#666" style={{ marginTop: 10 }} />
              ) : resolvedAlerts.length === 0 ? (
                <Text style={[styles.alertText, { fontStyle: 'italic', opacity: 0.6 }]}>No resolved alerts in history.</Text>
              ) : (
                <>
                  <FlatList
                    data={showAllHistory ? resolvedAlerts : resolvedAlerts.slice(0, 3)}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    renderItem={({ item: alert }) => (
                      <View style={[styles.busCard, { backgroundColor: '#1a1a1a', borderColor: '#222', opacity: 0.8 }]}>
                        <View style={styles.busRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: '#4CAF50', fontSize: 13 }]}>RESOLVED EMERGENCY</Text>
                            <Text style={[styles.cardSubtitle, { fontSize: 12 }]}>{alert.message}</Text>
                          </View>
                          <View style={[styles.statusPill, { backgroundColor: '#2E7D32', height: 20, paddingHorizontal: 8 }]}>
                            <Text style={[styles.statusPillText, { fontSize: 9 }]}>RESOLVED</Text>
                          </View>
                        </View>
                        <View style={{ marginTop: 6 }}>
                          <Text style={[styles.busDetail, { fontSize: 11 }]}>{alert.busNumber} • {alert.userName} • {new Date(alert.updatedAt).toLocaleString()}</Text>
                        </View>
                      </View>
                    )}
                  />
                  {resolvedAlerts.length > 3 && (
                    <TouchableOpacity
                      style={styles.seeMoreBtn}
                      onPress={() => setShowAllHistory(!showAllHistory)}
                    >
                      <Text style={styles.seeMoreText}>{showAllHistory ? 'See Less' : `See More (${resolvedAlerts.length - 3} more)`}</Text>
                      <Ionicons name={showAllHistory ? "chevron-up" : "chevron-down"} size={16} color={Colors.primary} style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {selectedTab === 'users' && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Ionicons name="people" size={24} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.statLabel}>Total Passengers</Text>
                <Text style={styles.statValue}>{loadingStats ? '-' : stats.passengers}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Ionicons name="car" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.statLabel}>Online Drivers</Text>
                <Text style={styles.statValue}>{loadingStats ? '-' : stats.drivers}</Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'users' && canManageUsers && (
          <>
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleNavigate('/admin/manage')}
              activeOpacity={0.9}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="settings" size={26} color="#000" />
              </View>
              <Text style={styles.cardTitle}>USER MANAGEMENT CONSOLE</Text>
              <Text style={styles.cardSubtitle}>Register, Edit, activate, or review all user accounts.</Text>
            </TouchableOpacity>
          </>
        )}

        {selectedTab === 'maintenance' && (
          <>
            <View style={styles.busFilterRow}>
              <TextInput
                style={styles.busSearchInput}
                placeholder="Search buses..."
                placeholderTextColor={Colors.textMuted}
                value={busSearch}
                onChangeText={setBusSearch}
              />
              <TouchableOpacity style={styles.filterButton} onPress={() => fetchVehicles(busSearch)}>
                <Text style={styles.filterButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {vehicles.length > 0 && busSearch.trim() !== '' && (
              <View style={{ marginTop: 15, marginBottom: 15 }}>
                <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>Search Results ({vehicles.length})</Text>
                {vehicles.map((v) => (
                  <View key={`search-${v._id || v.vehicleId}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="bus" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{v.busNumber || v.vehicleId}</Text>
                      </View>
                      <View style={{ backgroundColor: v.riskLevel === 'high' ? 'rgba(255,68,68,0.2)' : 'rgba(255,215,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: v.riskLevel === 'high' ? '#ff4444' : Colors.primary, fontSize: 10, fontWeight: 'bold' }}>
                          RISK: {v.riskLevel?.toUpperCase() || 'UNKNOWN'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 8, padding: 10, marginBottom: 15 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>CURRENT MILEAGE</Text>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{v.currentMileage || 0} km</Text>
                      </View>
                      <View style={{ width: 1, backgroundColor: '#333', marginHorizontal: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>STATUS</Text>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{v.maintenanceStatus === 'ok' ? 'ACTIVE' : v.maintenanceStatus?.toUpperCase() || 'UNKNOWN'}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Next Service: {v.nextServiceKm ? `${v.nextServiceKm} km` : 'N/A'}</Text>
                      <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Inspection: {v.nextServiceDate ? new Date(v.nextServiceDate).toLocaleDateString() : 'N/A'}</Text>
                    </View>

                    {v.suggestedAction && v.suggestedAction !== 'None' && (
                      <View style={{ marginTop: 12, backgroundColor: 'rgba(255,68,68,0.1)', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="warning" size={14} color="#ff4444" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#ff4444', fontSize: 11, fontWeight: 'bold', flex: 1 }}>AI SUGGESTS: {v.suggestedAction}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}



            {/* Moving Reported Maintenance to the top */}




            <View style={[styles.sectionCard, { marginTop: 25 }]}>
              <Text style={[styles.sectionTitle, { color: Colors.primary }]}>FLEET MAINTENANCE LOG</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 5, borderRadius: 25, flex: 1, marginRight: 10 }}>
                  {['all', 'pending', 'completed'].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setMtFilter(filter)}
                      style={{
                        backgroundColor: mtFilter === filter ? Colors.primary : 'transparent',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        flex: 1,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: mtFilter === filter ? '#000' : '#888', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{filter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>



              {loadingTasks ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : recentTasks.filter(t => {
                const mappedStatus = ['resolved', 'closed', 'completed'].includes(t.incidentStatus || t.status) ? 'completed' : 'pending';
                const isNotSOS = t.type !== 'SOS Emergency';
                return (mtFilter === 'all' || mappedStatus === mtFilter) && isNotSOS;
              }).length === 0 ? (
                <Text style={{ color: '#444', fontSize: 13, fontStyle: 'italic', paddingVertical: 10 }}>No {mtFilter !== 'all' ? mtFilter : ''} reported issues found.</Text>
              ) : (() => {
                const filteredTasks = recentTasks.filter(t => {
                  const mappedStatus = ['resolved', 'closed', 'completed'].includes(t.incidentStatus || t.status) ? 'completed' : 'pending';
                  const isNotSOS = t.type !== 'SOS Emergency';
                  return (mtFilter === 'all' || mappedStatus === mtFilter) && isNotSOS;
                });

                return (
                  <>
                    {filteredTasks.slice(0, showAllMaintenanceLogs ? undefined : 6).map((task, idx) => {
                      const status = ['resolved', 'closed', 'completed'].includes(task.incidentStatus || task.status) ? 'completed' : 'pending';
                      const statusColor = status === 'completed' ? '#39B54A' : '#FFD700';
                      const statusBg = status === 'completed' ? 'rgba(57, 181, 74, 0.1)' : 'rgba(255, 215, 0, 0.1)';
                      const statusIcon = status === 'completed' ? 'checkmark' : 'time';

                      return (
                        <TouchableOpacity
                          key={task._id || idx}
                          activeOpacity={0.7}
                          onPress={() => { setSelectedTask(task); setTaskModalVisible(true); }}
                          style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#222', position: 'relative' }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingRight: 60 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: statusBg, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                <Ionicons name={statusIcon} size={14} color={statusColor} />
                              </View>
                              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, flex: 1 }} numberOfLines={1}>{task.type || 'Maintenance Request'}</Text>
                            </View>
                            <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                              <Text style={{ color: statusColor, fontSize: 8, fontWeight: '800' }}>{status.toUpperCase()}</Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 8 }}>
                              <Text style={{ color: '#AAA', fontSize: 10 }}>BUS: {task.vehicleId || task.busNumber}</Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(255,165,0,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                              <Text style={{ color: '#FFA500', fontSize: 10 }}>{task.priority?.toUpperCase() || 'MEDIUM'}</Text>
                            </View>
                            <Text style={{ color: '#666', fontSize: 10, marginLeft: 'auto' }}>{new Date(task.createdAt || task.date).toLocaleDateString()}</Text>
                          </View>

                          <Text style={{ color: '#888', fontSize: 12, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>{task.description}</Text>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', paddingTop: 10 }}>
                            <Text style={{ color: '#666', fontSize: 11 }}>By: <Text style={{ color: '#BBB' }}>{task.reporterName || 'Driver'}</Text></Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {filteredTasks.length > 6 && (
                      <TouchableOpacity
                        style={{ alignItems: 'center', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: '#333' }}
                        onPress={() => setShowAllMaintenanceLogs(!showAllMaintenanceLogs)}
                      >
                        <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 13 }}>
                          {showAllMaintenanceLogs ? 'SHOW LESS ▲' : `SHOW MORE (${filteredTasks.length - 6} HIDDEN) ▼`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
            </View>

            <View style={[styles.sectionCard, { marginTop: 25 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, zIndex: 10, paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark" size={22} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: Colors.primary, marginBottom: 0 }]}>RISK & PREVENTIVE ALERTS</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ position: 'relative', zIndex: 50 }}>
                    <TouchableOpacity
                      style={{ marginRight: 15, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 5, borderWidth: 1, borderColor: '#555', flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => setAnalysisDropdownVisible(!analysisDropdownVisible)}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold', marginRight: 5 }}>
                        {selectedAnalysisBus === 'ALL' ? 'ALL BUSES' : selectedAnalysisBus}
                      </Text>
                      <Ionicons name="caret-down" size={10} color="#FFF" />
                    </TouchableOpacity>

                    {analysisDropdownVisible && (
                      <View style={{ position: 'absolute', top: 30, right: 15, width: 140, backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#333', overflow: 'hidden', zIndex: 100 }}>
                        <TouchableOpacity
                          style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: selectedAnalysisBus === 'ALL' ? 'rgba(255,215,0,0.1)' : 'transparent' }}
                          onPress={() => { setSelectedAnalysisBus('ALL'); setAnalysisDropdownVisible(false); }}
                        >
                          <Text style={{ color: selectedAnalysisBus === 'ALL' ? Colors.primary : '#FFF', fontSize: 12 }}>All Buses</Text>
                        </TouchableOpacity>
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                          {vehicles.map(v => (
                            <TouchableOpacity
                              key={`dp-${v._id || v.vehicleId || Math.random()}`}
                              style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: selectedAnalysisBus === (v.busNumber || v.vehicleId) ? 'rgba(255,215,0,0.1)' : 'transparent' }}
                              onPress={() => { setSelectedAnalysisBus(v.busNumber || v.vehicleId); setAnalysisDropdownVisible(false); }}
                            >
                              <Text style={{ color: selectedAnalysisBus === (v.busNumber || v.vehicleId) ? Colors.primary : '#AAA', fontSize: 12 }} numberOfLines={1}>
                                {v.busNumber || v.vehicleId}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={{ marginRight: 15, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 5, borderWidth: 1, borderColor: '#FFD700' }}
                    onPress={runRiskAnalysis}
                    disabled={analyzingRisk}
                  >
                    <Text style={{ color: '#FFD700', fontSize: 10, fontWeight: 'bold' }}>{analyzingRisk ? 'ANALYZING...' : 'RUN ANALYSIS'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setRiskAnalysisVisible(!riskAnalysisVisible)}>
                    <Ionicons name={riskAnalysisVisible ? "chevron-up" : "chevron-down"} size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {riskAnalysisVisible && (
                <>
                  {(() => {
                    const analysisVehicles = vehicles.filter(v =>
                      selectedAnalysisBus === 'ALL' || (v.busNumber || v.vehicleId) === selectedAnalysisBus
                    );

                    return (
                      <>
                        {analysisVehicles.filter(v => v.riskLevel === 'high').length > 0 && (
                          <View style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderLeftWidth: 4, borderColor: '#ff4444' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                              <Ionicons name="warning" size={20} color="#ff4444" style={{ marginRight: 8 }} />
                              <Text style={{ color: '#ff4444', fontWeight: 'bold', fontSize: 14 }}>HIGH RISK BUSES DETECTED</Text>
                            </View>
                            {analysisVehicles.filter(v => v.riskLevel === 'high').map((v, i) => (
                              <Text key={v._id || i} style={{ color: '#FFF', fontSize: 12, marginBottom: 4 }}>
                                • Bus {v.busNumber || v.id} ({v.model || 'Unknown Model'}) has exceeded safe breakdown thresholds.
                              </Text>
                            ))}
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginRight: 10, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#39B54A' }}>
                            <Text style={{ color: '#39B54A', fontSize: 18, fontWeight: 'bold' }}>{analysisVehicles.filter(v => (v.riskLevel || 'low') === 'low').length}</Text>
                            <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>LOW RISK</Text>
                          </View>
                          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginRight: 10, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#FFA500' }}>
                            <Text style={{ color: '#FFA500', fontSize: 18, fontWeight: 'bold' }}>{analysisVehicles.filter(v => v.riskLevel === 'medium').length}</Text>
                            <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>MEDIUM RISK</Text>
                          </View>
                          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, alignItems: 'center', borderLeftWidth: 3, borderLeftColor: '#ff4444' }}>
                            <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: 'bold' }}>{analysisVehicles.filter(v => v.riskLevel === 'high').length}</Text>
                            <Text style={{ color: '#888', fontSize: 10, marginTop: 4 }}>HIGH RISK</Text>
                          </View>
                        </View>

                        {(() => {
                          const mileageAlertBuses = analysisVehicles.filter(v =>
                            v.nextServiceKm && v.currentMileage && (v.nextServiceKm - v.currentMileage <= 1000)
                          );

                          const inspectionAlertBuses = analysisVehicles.filter(v => {
                            if (!v.nextServiceDate) return false;
                            const daysUntil = (new Date(v.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                            return daysUntil <= 30;
                          });

                          return (
                            <>
                              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>Upcoming Service Reminders</Text>

                              <View style={{ backgroundColor: 'rgba(255,165,0,0.05)', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,165,0,0.1)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="time-outline" size={18} color="#FFA500" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#FFF', fontWeight: '600' }}>10,000 km Service Reminder</Text>
                                  </View>
                                  {mileageAlertBuses.length > 0 && (
                                    <View style={{ backgroundColor: '#FFA500', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                      <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>{mileageAlertBuses.length}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ color: '#888', fontSize: 12, marginBottom: mileageAlertBuses.length > 0 ? 8 : 0 }}>Automatic alert triggered for buses exceeding mileage thresholds since last overhaul.</Text>

                                {mileageAlertBuses.map((v, i) => (
                                  <Text key={`mil-${v._id || i}`} style={{ color: '#FFA500', fontSize: 12, marginTop: 4 }}>
                                    • Bus {v.busNumber || v.vehicleId} ({v.model}) is due in {v.nextServiceKm - v.currentMileage} km.
                                  </Text>
                                ))}
                              </View>

                              <View style={{ backgroundColor: 'rgba(33,150,243,0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(33,150,243,0.1)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="calendar-outline" size={18} color="#2196F3" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#FFF', fontWeight: '600' }}>6-Month Inspection Rule</Text>
                                  </View>
                                  {inspectionAlertBuses.length > 0 && (
                                    <View style={{ backgroundColor: '#2196F3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{inspectionAlertBuses.length}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ color: '#888', fontSize: 12, marginBottom: inspectionAlertBuses.length > 0 ? 8 : 0 }}>Scheduled safety inspection required for fleet vehicles every 180 days.</Text>

                                {inspectionAlertBuses.map((v, i) => {
                                  const daysUntil = Math.max(0, Math.ceil((new Date(v.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                                  return (
                                    <Text key={`ins-${v._id || i}`} style={{ color: '#2196F3', fontSize: 12, marginTop: 4 }}>
                                      • Bus {v.busNumber || v.vehicleId} ({v.model}) is due in {daysUntil} days.
                                    </Text>
                                  );
                                })}
                              </View>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                </>
              )}
            </View>


          </>
        )}


        {selectedTab === 'emergency' && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleNavigate('/incidents')}
            activeOpacity={0.9}
          >
            <View style={styles.cardIcon}>
              <Ionicons name="alert-circle" size={26} color="#000" />
            </View>
            <Text style={styles.cardTitle}>INCIDENT HISTORY</Text>
            <Text style={styles.cardSubtitle}>Full audit logs of all past vehicle incidents.</Text>

            <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: 'rgba(255,165,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                <Text style={{ color: '#FFA500', fontSize: 13, fontWeight: '700' }}>TOTAL LOGS: {loadingStats ? '-' : stats.totalIncidents || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {selectedTab === 'profile' && (
          <View style={{ flex: 1 }}>
            <View style={[styles.sectionCard, { alignItems: 'center', paddingVertical: 30 }]}>
              <View style={styles.userAvatarLarge}>
                <Ionicons name="person" size={50} color="#000" />
              </View>
              <Text style={styles.profileName}>{(role === 'super-admin' || role === 'admin' || adminRole === 'super-admin') ? 'ADMIN' : (role?.replace(/-/g, ' ').toUpperCase() || 'ADMINISTRATOR')}</Text>
              <Text style={styles.profileSubtitle}>Department: {adminType?.replace(/-/g, ' ') || 'General Management'}</Text>
            </View>

            <Text style={styles.menuGroupLabel}>ACCOUNT SETTINGS</Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setPrivilegesModalVisible(true)}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
                    <Ionicons name="person-outline" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.menuItemText}>Account Privileges</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModalVisible(true)}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" />
                  </View>
                  <Text style={styles.menuItemText}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.menuGroupLabel}>SYSTEM PREFERENCES</Text>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setNotificationsModalVisible(true)}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                    <Ionicons name="notifications-outline" size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.menuItemText}>Notification Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setSecurityModalVisible(true)}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconBox, { backgroundColor: 'rgba(156, 39, 176, 0.1)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#9C27B0" />
                  </View>
                  <Text style={styles.menuItemText}>Security & Privacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.fullLogoutBtn}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#ff4444" />
              <Text style={styles.fullLogoutText}>Log Out Session</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Book&Go Admin v2.4.0</Text>
          </View>
        )}
      </ScrollView>

      {/* Task Detail Modal */}
      <Modal visible={taskModalVisible} transparent animationType="slide" onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { width: '90%', maxHeight: '80%' }]}>
            <View style={styles.popupHeader}>
              <Text style={[styles.popupTitle, { color: Colors.primary }]}>MAINTENANCE DETAILS</Text>
              <TouchableOpacity onPress={() => setTaskModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {selectedTask && (() => {
              const mappedStatus = ['resolved', 'closed', 'completed'].includes(selectedTask.incidentStatus || selectedTask.status) ? 'completed' : 'pending';

              const rawTypeStr = selectedTask.type || 'Maintenance Request';
              const displayTitle = selectedTask.title || (rawTypeStr.startsWith('Maintenance: ') ? rawTypeStr.substring(13) : rawTypeStr);

              // Extract the true category from the task type or the description in parentheses
              let displayCategory = 'OTHER';
              const categoryMatch = (selectedTask.description || '').match(/\((oil|tire|brake|other)\)$/i);
              const possibleCat = (selectedTask.category || selectedTask.type || '').toUpperCase();

              if (['OIL', 'TIRE', 'BRAKE', 'OTHER'].includes(possibleCat)) {
                displayCategory = possibleCat;
              } else if (categoryMatch) {
                displayCategory = categoryMatch[1].toUpperCase();
              } else if (rawTypeStr.toLowerCase().includes('oil')) {
                displayCategory = 'OIL';
              } else if (rawTypeStr.toLowerCase().includes('tire')) {
                displayCategory = 'TIRE';
              } else if (rawTypeStr.toLowerCase().includes('brake')) {
                displayCategory = 'BRAKE';
              }

              return (
                <ScrollView>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, marginBottom: 15 }}>
                    <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Task Title</Text>
                    <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>{displayTitle}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Bus ID</Text>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{selectedTask.busNumber || selectedTask.vehicleId || 'N/A'}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Category</Text>
                      <View style={{ backgroundColor: 'rgba(255,215,0,0.1)', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{displayCategory}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Status</Text>
                      <View style={{ backgroundColor: mappedStatus === 'completed' ? 'rgba(57, 181, 74, 0.1)' : 'rgba(255, 215, 0, 0.1)', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: mappedStatus === 'completed' ? '#39B54A' : '#FFD700', fontWeight: 'bold' }}>{mappedStatus.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Priority</Text>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 10 }}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{selectedTask.priority?.toUpperCase() || 'MEDIUM'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Description</Text>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#222' }}>
                      <Text style={{ color: '#EEE', fontSize: 14, lineHeight: 22 }}>{selectedTask.description || 'No description provided.'}</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Driver / Submitter</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 }}>
                      <Ionicons name="person-circle" size={32} color={Colors.primary} style={{ marginRight: 12 }} />
                      <View>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{selectedTask.reporterName || selectedTask.technician || 'N/A'}</Text>
                        <Text style={{ color: '#888', fontSize: 12 }}>{selectedTask.reporterPhone || 'No contact provided'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Date Recorded</Text>
                      <Text style={{ color: '#DDD', fontSize: 13 }}>{new Date(selectedTask.date || selectedTask.createdAt).toLocaleDateString()}</Text>
                      <Text style={{ color: '#666', fontSize: 11 }}>{new Date(selectedTask.date || selectedTask.createdAt).toLocaleTimeString()}</Text>
                    </View>
                    {mappedStatus === 'completed' && (selectedTask.completedAt || selectedTask.updatedAt) && (
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#AAA', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Completed At</Text>
                        <Text style={{ color: '#39B54A', fontSize: 13 }}>{new Date(selectedTask.completedAt || selectedTask.updatedAt).toLocaleDateString()}</Text>
                        <Text style={{ color: '#666', fontSize: 11 }}>{new Date(selectedTask.completedAt || selectedTask.updatedAt).toLocaleTimeString()}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              );
            })()}


            <TouchableOpacity
              style={[styles.smallButton, { marginTop: 10, height: 45, borderRadius: 12, width: '100%', borderColor: '#333', borderWidth: 1, justifyContent: 'center' }]}
              onPress={() => setTaskModalVisible(false)}
            >
              <Text style={{ color: '#888', fontWeight: '700', fontSize: 13 }}>Close Details</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


      {/* Persistent Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('users')}>
          <Ionicons name={selectedTab === 'users' ? "people" : "people-outline"} size={26} color={selectedTab === 'users' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, selectedTab === 'users' && { color: Colors.primary }]}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('emergency')}>
          <View>
            <Ionicons name={selectedTab === 'emergency' ? "warning" : "warning-outline"} size={26} color={selectedTab === 'emergency' ? "#ff4444" : Colors.textMuted} />
            {pendingAlerts.length > 0 && <View style={styles.notifBadge} />}
          </View>
          <Text style={[styles.navText, selectedTab === 'emergency' && { color: "#ff4444" }]}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('maintenance')}>
          <Ionicons name={selectedTab === 'maintenance' ? "construct" : "construct-outline"} size={26} color={selectedTab === 'maintenance' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, selectedTab === 'maintenance' && { color: Colors.primary }]}>Maintenance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setSelectedTab('profile')}>
          <Ionicons name={selectedTab === 'profile' ? "person-circle" : "person-circle-outline"} size={26} color={selectedTab === 'profile' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, selectedTab === 'profile' && { color: Colors.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {alertPopupVisible && activeAlert ? (
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { maxWidth: 400 }]}>
            <View style={styles.popupHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="warning" size={24} color="#ff4444" style={{ marginRight: 10 }} />
                <Text style={styles.popupTitle}>SOS Alert Details</Text>
              </View>
              <TouchableOpacity onPress={() => setAlertPopupVisible(false)}>
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.emergencyDetailBoxExtended}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sender:</Text>
                <Text style={styles.infoValue}>{activeAlert.userName || 'Unknown'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bus:</Text>
                <Text style={styles.infoValue}>{activeAlert.busNumber || activeAlert.busId} ({activeAlert.busModel || 'Bus'})</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{activeAlert.userPhone || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>{new Date(activeAlert.createdAt).toLocaleString()}</Text>
              </View>

              <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', marginTop: 10 }]}>
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={[styles.infoValue, { color: '#ff6666', marginTop: 4, fontStyle: 'italic', lineHeight: 20 }]}>
                  {activeAlert.message || 'Immediate assistance requested'}
                </Text>
              </View>
            </View>

            <Text style={styles.popupSubText}>Status: {activeAlert.status?.toUpperCase()}</Text>

            {activeAlert.emergencyContacts?.length ? (
              <View style={styles.contactSection}>
                <Text style={[styles.popupTitle, { fontSize: 16, marginBottom: 10 }]}>Emergency Contacts</Text>
                {activeAlert.emergencyContacts.map((contact, index) => (
                  <View key={`${contact.phone}-${index}`} style={styles.contactItem}>
                    <View style={styles.contactTextBlock}>
                      <Text style={styles.popupText}>{contact.name}</Text>
                      <Text style={styles.popupSubText}>{contact.department} • {contact.phone}</Text>
                    </View>
                    <TouchableOpacity style={styles.callBadge} onPress={() => handleCallContact(contact.phone)}>
                      <Text style={styles.callBadgeText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={[styles.popupButtons, { marginTop: 20 }]}>
              <TouchableOpacity style={[styles.smallButton, styles.popupButtonPrimary]} onPress={() => { setAlertPopupVisible(false); handleNavigate('/incidents'); }}>
                <Text style={styles.primaryButtonText}>View Audit Log</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.popupButtonSecondary, { backgroundColor: '#ff4444', borderColor: '#ff4444' }]}
                onPress={() => { setAlertPopupVisible(false); handleAlertAction('resolve'); }}
              >
                <Text style={[styles.secondaryButtonText, { color: '#000' }]}>Resolve Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} disabled={updatingPassword}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>Enter a new secure password for your administrative account.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#666"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, updatingPassword && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalSubmitText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Privileges Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={privilegesModalVisible}
        onRequestClose={() => setPrivilegesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account Privileges</Text>
              <TouchableOpacity onPress={() => setPrivilegesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.privilegeCard}>
              <Text style={styles.privilegeRole}>{role?.replace(/-/g, ' ').toUpperCase() || 'ADMINISTRATOR'}</Text>
              <View style={styles.privilegeList}>
                <View style={styles.privilegeItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.privilegeText}>User Management Access</Text>
                </View>
                <View style={styles.privilegeItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.privilegeText}>SOS Alert Resolution</Text>
                </View>
                <View style={styles.privilegeItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.privilegeText}>System Configuration</Text>
                </View>
                <View style={styles.privilegeItem}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.privilegeText}>View Audit Logs</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setPrivilegesModalVisible(false)}>
              <Text style={styles.modalSubmitText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>




      {/* Notification Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Emergency SOS Alerts</Text>
              <Switch
                value={notifySOS}
                onValueChange={setNotifySOS}
                trackColor={{ false: '#333', true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>System Health Updates</Text>
              <Switch
                value={notifyHealth}
                onValueChange={setNotifyHealth}
                trackColor={{ false: '#333', true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>New Incident Reports</Text>
              <Switch
                value={notifyIncidents}
                onValueChange={setNotifyIncidents}
                trackColor={{ false: '#333', true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setNotificationsModalVisible(false)}>
              <Text style={styles.modalSubmitText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Security Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={securityModalVisible}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security & Privacy</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.securityItem}>
              <Ionicons name="shield-lock-outline" size={22} color="#FFF" />
              <Text style={styles.securityText}>Enable Two-Factor Auth</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.securityItem}>
              <Ionicons name="time-outline" size={22} color="#FFF" />
              <Text style={styles.securityText}>View Login History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.securityItem}>
              <Ionicons name="download-outline" size={22} color="#FFF" />
              <Text style={styles.securityText}>Export My Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={() => setSecurityModalVisible(false)}>
              <Text style={styles.modalSubmitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 20,
  },
  titleGroup: {
    flex: 1,
  },
  appTitle: {
    color: '#FFD700',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  backButton: {
    width: 32,
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  notificationCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  notificationBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notificationBadgeText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  notificationText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  busFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  busSearchInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#FFF',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    marginBottom: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  busCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  busRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  busDetail: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    width: '100%',
    backgroundColor: '#121212',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '800',
  },
  popupText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 8,
  },
  popupSubText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  popupButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  popupButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  popupButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#1e1e1e',
  },
  contactSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2e2e2e',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contactTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  callBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  callBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  forwardButton: {
    flex: 1,
    backgroundColor: '#333',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  emergencyDetailBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#ff4444',
  },
  alertCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  alertText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 6,
  },
  alertSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  smallButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginLeft: 10,
  },
  filterButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  tagButton: {
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#000',
  },
  userAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#333',
  },
  profileName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 5,
  },
  profileSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  menuGroupLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 15,
    marginTop: 10,
    paddingLeft: 5,
  },
  menuContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 5,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
  fullLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
    borderRadius: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    marginTop: 10,
    marginBottom: 20,
  },
  fullLogoutText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  versionText: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  modalText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
  },
  modalInput: {
    backgroundColor: '#121212',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 30,
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  privilegeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  privilegeRole: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1,
  },
  privilegeList: {
    gap: 12,
  },
  privilegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privilegeText: {
    color: '#DDD',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 15,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  securityText: {
    color: '#FFF',
    fontSize: 15,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: -2,
    backgroundColor: '#ff4444',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyAlertBox: {
    padding: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderStyle: 'dashed',
  },
  emergencyDetailBoxExtended: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    width: 90,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 5,
  },
  seeMoreText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
