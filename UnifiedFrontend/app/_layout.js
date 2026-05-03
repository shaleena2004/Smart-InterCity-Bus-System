import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../services/api';

function LayoutContent() {
  const router = useRouter();
  const { userRole, setUserRole, userId, setUserId, userName, setUserName, userPhone, setUserPhone, assignedVehicle, setAssignedVehicle } = useAuth();
  const [appState, setAppState] = useState('loading'); // loading, role_select, subrole_select, registration, unified_login, app
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedSubRole, setSelectedSubRole] = useState(null);
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Animation for splash progress
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (appState === 'loading') {
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        setAppState('role_select');
      });
    }
  }, [appState]);

  useEffect(() => {
    if (userRole === null && appState === 'app') {
      handleLogout();
    }
  }, [userRole]);

  const handleRoleSelect = (role) => {
    if (role === 'staff') {
      setAppState('subrole_select');
    } else {
      setSelectedRole(role);
      setSelectedSubRole(role);
      setAppState('registration');
    }
  };

  const handleSubRoleSelect = (role) => {
    setSelectedSubRole(role);
    setAppState('registration');
  };

  const handleAuthSuccess = (role, id, name, phone, vehicleId) => {
    setUserRole(role);
    setUserId(id);
    setUserName(name || '');
    setUserPhone(phone || '');
    setAssignedVehicle(vehicleId || null);
    setAppState('app');

    // Use a small timeout to ensure the Drawer is rendered before navigation
    setTimeout(() => {
      if (role === 'supplier') {
        router.replace('/supplier_dashboard');
      } else {
        router.replace('/');
      }
    }, 100);
  };

  const handleRegister = async (role) => {
    if (!regForm.name || !regForm.phone || !regForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRegister({ ...regForm, role });
      Alert.alert('Success', 'Account created successfully');
      handleAuthSuccess(res.data.user.role, res.data.user._id, res.data.user.name, res.data.user.phone, res.data.user.assignedVehicle);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.phone || !loginForm.password) {
      Alert.alert('Error', 'Please enter both phone and password');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiLogin(loginForm);
      handleAuthSuccess(res.data.user.role, res.data.user._id, res.data.user.name, res.data.user.phone, res.data.user.assignedVehicle);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAppState('role_select');
    setSelectedRole(null);
    setUserRole(null);
    setUserId(null);
    setUserName(null);
    setUserPhone(null);
    setAssignedVehicle(null);
  };

  // Helper to render the authentication overlays
  const renderAuthOverlay = () => {
    if (appState === 'app') return null;

    if (appState === 'loading') {
      const widthInterpolated = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
      });

      return (
        <View style={[StyleSheet.absoluteFill, styles.splashContainer]}>
          <View style={styles.splashCenter}>
            <View style={styles.logoBox}>
              <Ionicons name="bus" size={48} color="#0B0F19" />
            </View>
            <Text style={styles.logoText}>BOOK<Text style={{ color: '#FFC107' }}>&GO</Text></Text>

            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBarFill, { width: widthInterpolated }]} />
            </View>
          </View>
          <Text style={styles.fetchingText}>Fetching live bus data...</Text>
        </View>
      );
    }

    if (appState === 'role_select') {
      return (
        <View style={[StyleSheet.absoluteFill, styles.authContainer]}>
          <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
            <View style={styles.smallLogoBox}>
              <Ionicons name="bus" size={24} color="#0B0F19" />
            </View>
            <Text style={styles.authLogoText}>BOOK<Text style={{ color: '#FFC107' }}>&GO</Text></Text>
            <Text style={styles.authSubtitle}>IDENTIFICATION</Text>
          </View>

          <Text style={styles.questionText}>How will you be using the app?</Text>

          <View style={{ gap: 16 }}>
            {[
              { id: 'passenger', title: 'I am a Passenger', desc: 'Find bus routes, live locations, and schedules for your daily commute.', icon: 'people' },
              { id: 'driver', title: 'I am a Driver', desc: 'Share your live location, manage your trips, and view passenger stats.', icon: 'speedometer' },
              { id: 'staff', title: 'I am Staff', desc: 'Manage operations, finance, suppliers, and administration.', icon: 'briefcase' }
            ].map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleCard, selectedRole === r.id && styles.roleCardActive]}
                onPress={() => setSelectedRole(r.id)}
              >
                <View style={styles.roleCardTop}>
                  <View style={[styles.roleIconCircle, selectedRole === r.id && { backgroundColor: '#E0A800' }]}>
                    <Ionicons name={r.icon} size={20} color="#0B0F19" />
                  </View>
                  <Ionicons name={selectedRole === r.id ? "checkmark-circle" : "ellipse-outline"} size={24} color={selectedRole === r.id ? "#0B0F19" : "#232940"} />
                </View>
                <Text style={[styles.roleCardTitle, selectedRole === r.id && { color: '#0B0F19' }]}>{r.title}</Text>
                <Text style={[styles.roleCardDesc, selectedRole === r.id && { color: '#0B0F19' }]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.continueBtn, !selectedRole && { opacity: 0.5 }]}
            disabled={!selectedRole}
            onPress={() => handleRoleSelect(selectedRole)}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAppState('unified_login')}>
            <Text style={styles.bottomLinkText}>Already have an account? <Text style={{ color: '#FFC107' }}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (appState === 'subrole_select') {
      return (
        <View style={[StyleSheet.absoluteFill, styles.authContainer]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setAppState('role_select'); setSelectedRole(null); }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
            <View style={styles.smallLogoBox}>
              <Ionicons name="bus" size={24} color="#0B0F19" />
            </View>
            <Text style={styles.authLogoText}>BOOK<Text style={{ color: '#FFC107' }}>&GO</Text></Text>
            <Text style={styles.authSubtitle}>STAFF PORTAL</Text>
          </View>

          <Text style={styles.questionText}>Select your department</Text>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            {[
              { id: 'finance', title: 'Finance Department', desc: 'Manage revenues, salaries, and commissions.', icon: 'cash' },
              { id: 'supplier', title: 'Supplier Portal', desc: 'Manage bus fleets and performance.', icon: 'bus' },
              { id: 'admin', title: 'System Administrator', desc: 'Full access to users, routes, and settings.', icon: 'shield-checkmark' },
              { id: 'staff', title: 'Operations Staff', desc: 'Manage daily routes and schedules.', icon: 'calendar' }
            ].map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleCard, selectedSubRole === r.id && styles.roleCardActive]}
                onPress={() => setSelectedSubRole(r.id)}
              >
                <View style={styles.roleCardTop}>
                  <View style={[styles.roleIconCircle, selectedSubRole === r.id && { backgroundColor: '#E0A800' }]}>
                    <Ionicons name={r.icon} size={20} color="#0B0F19" />
                  </View>
                  <Ionicons name={selectedSubRole === r.id ? "checkmark-circle" : "ellipse-outline"} size={24} color={selectedSubRole === r.id ? "#0B0F19" : "#232940"} />
                </View>
                <Text style={[styles.roleCardTitle, selectedSubRole === r.id && { color: '#0B0F19' }]}>{r.title}</Text>
                <Text style={[styles.roleCardDesc, selectedSubRole === r.id && { color: '#0B0F19' }]}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.continueBtn, !selectedSubRole && { opacity: 0.5 }]}
            disabled={!selectedSubRole}
            onPress={() => handleSubRoleSelect(selectedSubRole)}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (appState === 'registration') {
      const currentRole = selectedSubRole || selectedRole;
      const roleName = currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1) : "";
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[StyleSheet.absoluteFill, styles.authContainer]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
              if (['finance', 'supplier', 'admin'].includes(userRole) || (userRole === 'staff' && selectedRole === 'staff')) {
                setAppState('subrole_select');
              } else {
                setAppState('role_select');
              }
              setUserRole(null);
            }}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
              <View style={styles.smallLogoBox}>
                <Ionicons name="bus" size={24} color="#0B0F19" />
              </View>
              <Text style={styles.authLogoText}>BOOK<Text style={{ color: '#FFC107' }}>&GO</Text></Text>
              <Text style={styles.authSubtitle}>CREATE NEW ACCOUNT</Text>
            </View>

            <Text style={styles.loginTitle}>{roleName} Registration</Text>
            <View style={styles.loginTitleUnderline} />

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person" size={18} color="#8690A9" style={{ marginLeft: 16, marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor="#404659"
                value={regForm.name}
                onChangeText={(v) => setRegForm({ ...regForm, name: v })}
              />
            </View>

            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
            <View style={styles.inputBox}>
              <View style={styles.flagBox}>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 8, height: 12, backgroundColor: '#800000' }} />
                  <View style={{ width: 8, height: 12, backgroundColor: '#FFC107' }} />
                </View>
                <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13, fontWeight: 'bold' }}>+94</Text>
              </View>
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.textInput}
                placeholder="7X XXX XXXX"
                placeholderTextColor="#404659"
                keyboardType="phone-pad"
                value={regForm.phone}
                onChangeText={(v) => setRegForm({ ...regForm, phone: v })}
              />
            </View>

            <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail" size={18} color="#8690A9" style={{ marginLeft: 16, marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#404659"
                keyboardType="email-address"
                value={regForm.email}
                onChangeText={(v) => setRegForm({ ...regForm, email: v })}
              />
            </View>

            <Text style={styles.inputLabel}>CREATE PASSWORD</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed" size={18} color="#8690A9" style={{ marginLeft: 16, marginRight: 10 }} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#404659"
                secureTextEntry
                value={regForm.password}
                onChangeText={(v) => setRegForm({ ...regForm, password: v })}
              />
              <Ionicons name="eye" size={20} color="#404659" style={{ marginRight: 16 }} />
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={() => handleRegister(currentRole)}
              disabled={isSubmitting}
            >
              <Text style={styles.continueBtnText}>{isSubmitting ? 'Creating Account...' : 'Sign Up'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAppState('unified_login')}>
              <Text style={[styles.bottomLinkText, { marginTop: 20, marginBottom: 40 }]}>Already have an account? <Text style={{ color: '#FFC107' }}>Login</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    if (appState === 'unified_login') {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[StyleSheet.absoluteFill, styles.authContainer]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setAppState('role_select')}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
            <View style={styles.smallLogoBox}>
              <Ionicons name="bus" size={24} color="#0B0F19" />
            </View>
            <Text style={styles.authLogoText}>BOOK<Text style={{ color: '#FFC107' }}>&GO</Text></Text>
            <Text style={styles.authSubtitle}>Commute with confidence</Text>
          </View>

          <Text style={styles.loginTitle}>Login</Text>
          <View style={styles.loginTitleUnderline} />

          <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
          <View style={styles.inputBox}>
            <View style={styles.flagBox}>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 8, height: 12, backgroundColor: '#800000' }} />
                <View style={{ width: 8, height: 12, backgroundColor: '#FFC107' }} />
              </View>
              <Text style={{ color: '#fff', marginLeft: 6, fontSize: 13, fontWeight: 'bold' }}>+94</Text>
            </View>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.textInput}
              placeholder="7X XXX XXXX"
              placeholderTextColor="#404659"
              keyboardType="phone-pad"
              value={loginForm.phone}
              onChangeText={(v) => setLoginForm({ ...loginForm, phone: v })}
            />
          </View>

          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed" size={18} color="#8690A9" style={{ marginLeft: 16, marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#404659"
              secureTextEntry
              value={loginForm.password}
              onChangeText={(v) => setLoginForm({ ...loginForm, password: v })}
            />
            <Ionicons name="eye" size={20} color="#404659" style={{ marginRight: 16 }} />
          </View>

          <Text style={styles.forgotText}>Forgot Password?</Text>

          <TouchableOpacity
            style={[styles.continueBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.continueBtnText}>{isSubmitting ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setAppState('role_select')}>
            <Text style={[styles.bottomLinkText, { marginTop: 40 }]}>Don't have an account? <Text style={{ color: '#FFC107' }}>Sign Up</Text></Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      );
    }

    return null;
  };

  // App Layout Logic based on role
  const isPassenger = userRole === 'passenger';
  const isDriver = userRole === 'driver';
  const isStaff = userRole === 'staff';
  const isFinance = userRole === 'finance';
  const isSupplier = userRole === 'supplier';
  const isAdmin = userRole === 'admin' || userRole === 'super-admin';

  // Dynamic dashboard title
  const getDashboardTitle = () => {
    if (isDriver) return 'Driver Dashboard';
    if (isFinance) return 'Finance Dashboard';
    if (isSupplier) return 'Supplier Portal';
    if (isStaff) return 'Staff Operations';
    if (isAdmin) return 'Admin Dashboard';
    return 'Passenger Dashboard';
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F19' }}>
      <View style={{ flex: 1 }}>
        <Drawer
          screenOptions={{
            headerStyle: { backgroundColor: '#0B0F19', elevation: 0, shadowOpacity: 0 },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            drawerStyle: { backgroundColor: '#0B0F19', width: 280 },
            drawerActiveTintColor: '#0B0F19',
            drawerActiveBackgroundColor: '#FFC107',
            drawerInactiveTintColor: '#8690A9',
            drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -10 },
            drawerItemStyle: { borderRadius: 10, paddingHorizontal: 4 },
            headerRight: () => (
              <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
                <Ionicons name="log-out-outline" size={24} color="#f14668" />
              </TouchableOpacity>
            )
          }}
        >
          <Drawer.Screen name="index" options={{ drawerLabel: 'Home Dashboard', title: getDashboardTitle(), drawerIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />, drawerItemStyle: { display: (isSupplier || isFinance) ? 'none' : 'flex' } }} />
          <Drawer.Screen name="find-buses" options={{ drawerLabel: 'Find Available Buses', title: 'Find Buses', drawerIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color} />, drawerItemStyle: { display: isPassenger ? 'flex' : 'none' } }} />
          <Drawer.Screen name="my-bookings" options={{ drawerLabel: 'My Tickets', title: 'My Bookings', drawerIcon: ({ color }) => <Ionicons name="ticket-outline" size={22} color={color} />, drawerItemStyle: { display: isPassenger ? 'flex' : 'none' } }} />
          <Drawer.Screen name="bookings" options={{ drawerLabel: 'Seat Selection', title: 'Confirm Booking', drawerIcon: ({ color }) => <Ionicons name="apps-outline" size={22} color={color} />, drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="routes" options={{ drawerLabel: 'Route Scheduling', title: 'Route Scheduling', drawerIcon: ({ color }) => <Ionicons name="map-outline" size={22} color={color} />, drawerItemStyle: { display: (isAdmin || isStaff) ? 'flex' : 'none' } }} />
          <Drawer.Screen name="emergencies" options={{ drawerLabel: 'Active Emergencies', title: 'Emergencies', drawerIcon: ({ color }) => <Ionicons name="warning-outline" size={22} color={color} />, drawerItemStyle: { display: (isAdmin || isStaff) ? 'flex' : 'none' } }} />
          <Drawer.Screen name="incidents" options={{ drawerLabel: 'Incident Log', title: 'Incidents', drawerIcon: ({ color }) => <Ionicons name="alert-circle-outline" size={22} color={color} />, drawerItemStyle: { display: (isAdmin || isStaff) ? 'flex' : 'none' } }} />
          <Drawer.Screen name="supplier_dashboard" options={{ drawerLabel: 'Supplier Dashboard', title: 'Supplier Dashboard', drawerIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={22} color={color} />, drawerItemStyle: { display: isSupplier ? 'flex' : 'none' } }} />
          <Drawer.Screen name="suppliers" options={{ drawerLabel: 'Supplier Management', title: 'Supplier Portal', drawerIcon: ({ color }) => <Ionicons name="briefcase-outline" size={22} color={color} />, drawerItemStyle: { display: (isAdmin || isStaff) ? 'flex' : 'none' } }} />
          <Drawer.Screen name="finance" options={{ drawerLabel: 'Financial Management', title: 'Finance Dashboard', drawerIcon: ({ color }) => <Ionicons name="cash-outline" size={22} color={color} />, drawerItemStyle: { display: (isAdmin || isFinance) ? 'flex' : 'none' } }} />
          <Drawer.Screen name="profile" options={{ drawerLabel: 'My Profile', title: 'Profile', drawerIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />, drawerItemStyle: { display: 'flex' } }} />
          <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings', title: 'Settings', drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color} />, drawerItemStyle: { display: 'flex' } }} />
          <Drawer.Screen name="bus-details" options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="users" options={{ drawerItemStyle: { display: 'none' } }} />
        </Drawer>
      </View>
      {renderAuthOverlay()}
    </View>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: { backgroundColor: '#0B0F19', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  splashCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBox: { width: 80, height: 80, backgroundColor: '#FFC107', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#FFC107', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  progressBarContainer: { width: 200, height: 4, backgroundColor: '#1c2130', borderRadius: 2, marginTop: 40, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#FFC107' },
  fetchingText: { color: '#404659', fontSize: 12 },

  authContainer: { backgroundColor: '#0B0F19', padding: 24 },
  smallLogoBox: { width: 48, height: 48, backgroundColor: '#FFC107', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  authLogoText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  authSubtitle: { color: '#8690A9', fontSize: 10, letterSpacing: 1, marginTop: 4 },
  questionText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },

  roleCard: { backgroundColor: '#141926', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#232940' },
  roleCardActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  roleCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roleIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1c2130', justifyContent: 'center', alignItems: 'center' },
  roleCardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  roleCardDesc: { color: '#8690A9', fontSize: 12, lineHeight: 18 },

  continueBtn: { backgroundColor: '#FFC107', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  bottomLinkText: { color: '#8690A9', fontSize: 12, textAlign: 'center', marginTop: 20 },
  backBtn: { position: 'absolute', top: 50, left: 24, zIndex: 10 },

  loginTitle: { color: '#FFC107', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  loginTitleUnderline: { width: 24, height: 2, backgroundColor: '#FFC107', alignSelf: 'center', marginTop: 6, marginBottom: 30 },
  inputLabel: { color: '#8690A9', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', borderRadius: 12, height: 56, marginBottom: 20, borderWidth: 1, borderColor: '#232940' },
  flagBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  inputDivider: { width: 1, height: 24, backgroundColor: '#232940' },
  textInput: { flex: 1, color: '#fff', fontSize: 15, paddingHorizontal: 16 },
  forgotText: { color: '#FFC107', fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: 30 },

  bottomBar: { flexDirection: 'row', backgroundColor: '#0B0F19', borderTopWidth: 1, borderTopColor: '#232940', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  bottomBarItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBarText: { color: '#8690A9', fontSize: 10, marginTop: 4, fontWeight: '600' }
});
