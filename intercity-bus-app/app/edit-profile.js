import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { API_BASE } from "../services/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!phone) return;
      try {
        const response = await fetch(`${API_BASE}/user?phone=${encodeURIComponent(phone)}`);
        const data = await response.json();
        if (response.ok && data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
        }
      } catch (error) {
        console.warn('Unable to load profile:', error);
      }
    };

    loadUser();
  }, [phone]);

  const handleSave = async () => {
    if (!name || !phoneNumber) {
      setErrorMessage('Name and phone are required.');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE}/user/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPhone: phone,
          phone: phoneNumber,
          name,
          email,
          password: password || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to update profile.');
        return;
      }

      router.replace({ pathname: '/profile', params: { role, phone: phoneNumber } });
    } catch (error) {
      console.warn('Profile update failed:', error);
      setErrorMessage('Unable to update profile at this time.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Input label="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Change Password (Optional)</Text>
          <Input 
            label="New Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="Leave blank to keep current"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Button title="Save Changes" onPress={handleSave} style={styles.saveBtn} />
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
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 15,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 10,
  },
});
