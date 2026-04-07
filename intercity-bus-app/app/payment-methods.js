import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Saved Cards</Text>
        
        <View style={styles.cardItem}>
          <View style={styles.cardLeft}>
            <Ionicons name="card" size={32} color={Colors.primary} style={styles.cardIcon} />
            <View>
              <Text style={styles.cardType}>Visa</Text>
              <Text style={styles.cardNumber}>**** **** **** 4242</Text>
            </View>
          </View>
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </View>

        <View style={styles.cardItem}>
          <View style={styles.cardLeft}>
            <Ionicons name="card" size={32} color={Colors.primary} style={styles.cardIcon} />
            <View>
              <Text style={styles.cardType}>Mastercard</Text>
              <Text style={styles.cardNumber}>**** **** **** 8888</Text>
            </View>
          </View>
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </View>

        <TouchableOpacity style={styles.addCardBtn}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.addCardText}>Add New Payment Method</Text>
        </TouchableOpacity>
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
  sectionTitle: { color: Colors.textMuted, fontSize: 14, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  cardItem: { backgroundColor: '#181818', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { marginRight: 15 },
  cardType: { color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardNumber: { color: '#A0A0A0', fontSize: 14 },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, justifyContent: 'center', marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.primary, borderRadius: 16 },
  addCardText: { color: Colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 8 }
});
