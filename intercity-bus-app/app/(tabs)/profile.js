import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/ui/Button';
import { API_BASE } from '../../services/api';

const ProfileMenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <Ionicons name={icon} size={22} color={Colors.primary} style={styles.menuIcon} />
      <Text style={styles.menuText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const fetchProfile = async () => {
    if (!phone) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        setUserId(data.user?._id);
      }
    } catch (error) {
      console.warn('Unable to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile();
    }, [phone])
  );

  const handleLogout = () => {
    router.replace('/');
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('user_session');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        
        const targetId = userId || session?.id || session?._id;
        
        if (!targetId) {
          if (Platform.OS === 'web') window.alert('Unable to find session Id. Please login again.');
          else Alert.alert('Error', 'Unable to find session Id. Please login again.');
          return;
        }

        const response = await fetch(`${API_BASE}/users/${targetId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': targetId,
            'x-user-role': role || session?.role || 'passenger'
          }
        });

        if (response.ok) {
          await AsyncStorage.removeItem('user_session');
          if (Platform.OS === 'web') window.alert('Your account has been successfully removed.');
          else Alert.alert('Account Deleted', 'Your account has been successfully removed.');
          router.replace('/');
        } else {
          const data = await response.json();
          const msg = data.message || 'Failed to delete account';
          if (Platform.OS === 'web') window.alert('Error: ' + msg);
          else Alert.alert('Error', msg);
        }
      } catch (error) {
        console.error('Delete account failed:', error);
        if (Platform.OS === 'web') window.alert('An error occurred while deleting your account.');
        else Alert.alert('Error', 'An error occurred while deleting your account.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to permanently delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <View style={styles.avatarImageWrapper}>
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#000" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="#000" />
            </View>
          </View>
          <Text style={styles.name}>{user?.name || 'Shaleena Samadhushi'}</Text>
          <Text style={styles.phone}>{user?.phone || '+94 77 123 4567'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        <View style={styles.menuList}>
          <ProfileMenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push({ pathname: '/edit-profile', params: { role, phone } })}
          />
          <ProfileMenuItem 
            icon="card-outline" 
            title="Payment Methods" 
            onPress={() => router.push('/payment-methods')}
          />
          <ProfileMenuItem 
            icon="time-outline" 
            title="Travel History" 
            onPress={() => router.push('/travel-history')}
          />
          <ProfileMenuItem 
            icon="pricetag-outline" 
            title="Promotions" 
            onPress={() => router.push('/promotions')}
          />
          <ProfileMenuItem
            icon="shield-half-outline"
            title="Emergency Contacts"
            onPress={() => router.push({ pathname: '/emergency-contacts', params: { role, phone } })}
          />
          <ProfileMenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => router.push({ pathname: '/settings', params: { role, phone } })}
          />
        </View>

        <Button
          title="LOGOUT"
          type="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={styles.logoutText}
        />

        <TouchableOpacity 
          style={styles.deleteAccountBtn} 
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteAccountText}>Delete My Account</Text>
        </TouchableOpacity>
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
    paddingTop: 10,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  avatarImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#333',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#121212',
  },
  name: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  email: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  menuList: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    color: '#E0E0E0',
    fontSize: 16,
  },
  logoutBtn: {
    borderColor: Colors.primary,
    marginTop: 'auto',
  },
  logoutText: {
    color: Colors.primary,
  },
  deleteAccountBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
