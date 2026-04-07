import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function PromotionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="ticket" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.promoTitle}>20% Off Weekend Rides</Text>
              <Text style={styles.promoDesc}>Use code WKND20 at checkout</Text>
            </View>
          </View>
          <Text style={styles.promoDate}>Exp: Nov 30</Text>
        </View>

        <View style={styles.promoCard}>
          <View style={styles.promoLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.promoTitle}>$5 First Journey</Text>
              <Text style={styles.promoDesc}>Automatically applied</Text>
            </View>
          </View>
          <Text style={styles.promoDate}>No Expiry</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  container: { padding: 20 },
  promoCard: { backgroundColor: '#181818', borderRadius: 16, padding: 15, flexDirection: 'column', marginBottom: 15 },
  promoLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 193, 7, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  promoTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  promoDesc: { color: '#A0A0A0', fontSize: 13 },
  promoDate: { color: Colors.primary, fontSize: 13, fontWeight: '600', alignSelf: 'flex-end' }
});
