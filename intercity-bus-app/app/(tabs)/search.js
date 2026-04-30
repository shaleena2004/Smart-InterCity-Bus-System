import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE } from '../../services/api';
import { Colors } from '../../constants/Colors';

export default function SearchScreen() {
  const router = useRouter();
  const { role, phone } = useLocalSearchParams();
  const handleBack = () => router.push({ pathname: '/home', params: { role, phone } });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.wrapper} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.container}>
        <Text style={styles.text}>Search Routes (Coming Soon)</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  wrapper: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.textMuted, fontSize: 16 },
});
