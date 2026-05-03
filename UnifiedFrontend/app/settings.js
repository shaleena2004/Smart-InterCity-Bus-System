import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { userRole, userName } = useAuth();

  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);
  const [locationSharing, setLocationSharing] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(false);

  const renderSettingItem = (icon, label, value, onToggle, type = 'switch') => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#FFC107" />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#1c2130', true: 'rgba(255, 193, 7, 0.3)' }}
          thumbColor={value ? '#FFC107' : '#8690A9'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#8690A9" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          {renderSettingItem('notifications-outline', 'Push Notifications', notifications, setNotifications)}
          {renderSettingItem('moon-outline', 'Dark Mode (Always On)', darkMode, () => { })}
          {renderSettingItem('location-outline', 'Location Services', locationSharing, setLocationSharing)}
        </View>

        <Text style={styles.sectionTitle}>SECURITY</Text>
        <View style={styles.sectionCard}>
          {renderSettingItem('finger-print-outline', 'Biometric Login', biometrics, setBiometrics)}
          <TouchableOpacity onPress={() => Alert.alert('Security', 'Password reset email sent.')}>
            {renderSettingItem('lock-closed-outline', 'Change Password', null, null, 'link')}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Privacy', 'Privacy Policy updated: May 2026')}>
            {renderSettingItem('shield-checkmark-outline', 'Privacy Policy', null, null, 'link')}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.sectionCard}>
          <TouchableOpacity onPress={() => Alert.alert('Help', 'Support ticket #8291 created.')}>
            {renderSettingItem('help-circle-outline', 'Help & FAQ', null, null, 'link')}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Feedback', 'Thank you for your feedback!')}>
            {renderSettingItem('chatbubble-outline', 'Send Feedback', null, null, 'link')}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert('Delete Account', 'Are you sure you want to permanently delete your account?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }])}>
          <Ionicons name="trash-outline" size={20} color="#f14668" />
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Logged in as {userName || 'User'}</Text>
          <Text style={styles.footerText}>Role: {userRole?.toUpperCase() || 'PASSENGER'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#141926' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 4 },

  sectionTitle: { color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginLeft: 20, marginTop: 25, marginBottom: 10, letterSpacing: 1 },
  sectionCard: { backgroundColor: '#141926', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#232940' },

  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#232940' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1c2130', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingLabel: { color: '#fff', fontSize: 15 },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 30, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f14668' },
  deleteText: { color: '#f14668', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { color: '#404659', fontSize: 12, marginBottom: 4 }
});
