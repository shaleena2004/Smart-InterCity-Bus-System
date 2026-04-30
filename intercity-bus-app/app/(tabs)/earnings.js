import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE } from '../../services/api';
import { Colors } from '../../constants/Colors';

export default function EarningsScreen() {
  const router = useRouter();
  const { role, phone, adminType, adminRole, username } = useLocalSearchParams();
  
  const [balance, setBalance] = useState(4500);
  const [transactions, setTransactions] = useState([
    { id: '1', title: 'Trip: Colombo to Kandy', time: 'Today, 11:30 AM', amount: 3200, icon: 'bus', iconColor: Colors.primary },
    { id: '2', title: 'Morning Bonus', time: 'Today, 08:00 AM', amount: 1300, icon: 'cash', iconColor: '#4CAF50' }
  ]);
  const [percent, setPercent] = useState(12.5);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAmount = Math.floor(Math.random() * 500) + 100;
      const newTransaction = {
        id: Date.now().toString(),
        title: 'New Trip Completion',
        time: 'Just now',
        amount: newAmount,
        icon: 'bus',
        iconColor: Colors.primary
      };
      
      setBalance(prev => prev + newAmount);
      setPercent(prev => +(prev + 0.5).toFixed(1));
      setTransactions(prev => [newTransaction, ...prev]);
    }, 15000); // 15 seconds real-time simulation

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    if (role === 'admin' || role === 'super-admin' || role === 'staff') {
      router.push({ pathname: '/admin', params: { role, adminType, adminRole, username } });
    } else {
      router.push({ pathname: '/home', params: { role, phone } });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Earnings (Today)</Text>
          <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
          <View style={styles.trendContainer}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.trendText}>+{percent}% vs yesterday</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Transactions (Live Updates)</Text>
        
        {transactions.map(item => (
          <View key={item.id} style={styles.transactionItem}>
            <View style={styles.transIconBox}>
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.transDetails}>
              <Text style={styles.transTitle}>{item.title}</Text>
              <Text style={styles.transTime}>{item.time}</Text>
            </View>
            <Text style={styles.transAmount}>+Rs. {item.amount}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  balanceLabel: { color: Colors.textMuted, fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: Colors.primary, fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  trendContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trendText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  transIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transDetails: { flex: 1 },
  transTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  transTime: { color: Colors.textMuted, fontSize: 12 },
  transAmount: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' },
});
