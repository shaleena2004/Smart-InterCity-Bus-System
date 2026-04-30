import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.introText}>How can we help you today?</Text>
        
        <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL('mailto:support@intercity.com')}>
          <View style={styles.linkLeft}>
            <Ionicons name="mail-outline" size={24} color={Colors.primary} style={styles.icon} />
            <View>
              <Text style={styles.linkTitle}>Email Support</Text>
              <Text style={styles.linkSub}>support@intercity.com</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkCard} onPress={() => Linking.openURL('tel:+1234567890')}>
          <View style={styles.linkLeft}>
            <Ionicons name="call-outline" size={24} color={Colors.primary} style={styles.icon} />
            <View>
              <Text style={styles.linkTitle}>Call Support</Text>
              <Text style={styles.linkSub}>+1 (234) 567-890</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>How do I reset my password?</Text>
            <Text style={styles.faqA}>You can reset your password from the login screen by tapping on 'Forgot Password'.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>Where can I find my ticket?</Text>
            <Text style={styles.faqA}>Your tickets are automatically saved in the 'Travel History' section of your profile.</Text>
          </View>
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
  introText: { color: '#FFF', fontSize: 18, marginBottom: 20, fontWeight: '600' },
  linkCard: { backgroundColor: '#181818', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linkLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15 },
  linkTitle: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  linkSub: { color: '#A0A0A0', fontSize: 13, marginTop: 2 },
  faqSection: { marginTop: 20 },
  sectionTitle: { color: Colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  faqItem: { marginBottom: 15, backgroundColor: '#181818', padding: 15, borderRadius: 12 },
  faqQ: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  faqA: { color: '#A0A0A0', fontSize: 14, lineHeight: 20 }
});
