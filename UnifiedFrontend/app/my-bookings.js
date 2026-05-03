import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUserBookings, cancelBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    if (userId) fetchMyBookings();
  }, [userId]);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await getUserBookings(userId);
      setMyBookings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (booking) => {
    Alert.alert(
      'Cancel Ticket',
      `Cancel your ticket for ${booking.busRoute}?`,
      [
        { text: 'Keep My Ticket', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking._id);
              setMyBookings(myBookings.map(b => b._id === booking._id ? { ...b, status: 'Cancelled' } : b));
            } catch {
              Alert.alert('Error', 'Failed to cancel ticket');
            }
          }
        }
      ]
    );
  };

  const active = myBookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending');
  const past = myBookings.filter(b => b.status === 'Cancelled' || b.status === 'Completed');

  return (
    <View style={styles.container}>


      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#FFC107" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>My Tickets</Text>
            <TouchableOpacity onPress={fetchMyBookings} style={{ backgroundColor: '#141926', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#232940' }}>
              <Ionicons name="refresh" size={20} color="#FFC107" />
            </TouchableOpacity>
          </View>
          {/* Active Tickets */}
          {active.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.sectionTitle}>ACTIVE TICKETS</Text>
                <View style={{ backgroundColor: '#4ade8020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#4ade80' }}>
                  <Text style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 11 }}>{active.length} TICKET{active.length > 1 ? 'S' : ''}</Text>
                </View>
              </View>
              {active.map(b => (
                <View key={b._id || b.id} style={[styles.ticketCard, { borderColor: '#FFC10740', borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#8690A9', fontSize: 11, letterSpacing: 1 }}>ROUTE</Text>
                    <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>● {b.status}</Text>
                  </View>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12 }}>{b.busRoute}</Text>
                  <View style={styles.dashedLine} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                      <Text style={styles.subLabel}>DATE & TIME</Text>
                      <Text style={styles.subValue}>{new Date(b.date).toLocaleDateString()} • {b.time || '08:30 AM'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.subLabel}>SEATS</Text>
                      <Text style={[styles.subValue, { color: '#FFC107' }]}>{b.seatNumber}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.subLabel}>BUS NUMBER</Text>
                    <Text style={styles.subValue}>{b.busNumber || 'EX01'}</Text>
                  </View>
                  {b.fare > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={styles.subLabel}>FARE PAID</Text>
                      <Text style={[styles.subValue, { color: '#4ade80' }]}>LKR {b.fare?.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(b)}>
                      <Ionicons name="close-circle" size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qrBtn} onPress={() => setQrModal(b._id || b.id)}>
                      <Ionicons name="qr-code" size={16} color="#000" />
                      <Text style={{ color: '#000', fontWeight: '700' }}>View QR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Past trips */}
          {past.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>PAST TRIPS</Text>
              {past.map(b => (
                <View key={b._id || b.id} style={[styles.ticketCard, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#232940', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={b.status === 'Cancelled' ? 'close-circle' : 'checkmark-circle'} size={22} color={b.status === 'Cancelled' ? '#f14668' : '#8690A9'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{b.busRoute}</Text>
                    <Text style={{ color: '#8690A9', fontSize: 12, marginTop: 3 }}>
                      {b.busNumber || 'EX02'} • {b.time || '08:00 AM'} • Seat {b.seatNumber}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#8690A9', fontSize: 12 }}>
                      {new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={{ color: b.status === 'Cancelled' ? '#f14668' : '#4ade80', fontSize: 11, fontWeight: 'bold', marginTop: 3 }}>
                      {b.status}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Empty state */}
          {myBookings.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="ticket-outline" size={56} color="#232940" />
              <Text style={{ color: '#8690A9', marginTop: 16, textAlign: 'center', fontSize: 15 }}>
                No tickets found.{'\n'}Book a trip to get started!
              </Text>
              <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/find-buses')}>
                <Ionicons name="search" size={18} color="#000" />
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>Find Buses</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* QR Modal */}
      <Modal visible={!!qrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Scan QR to Board</Text>
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 16 }}>
              <Image
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=BKNG-${qrModal}` }}
                style={{ width: 160, height: 160 }}
              />
            </View>
            <Text style={{ color: '#8690A9', marginBottom: 16, fontSize: 12 }}>Booking: {qrModal}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setQrModal(null)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#232940' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { color: '#8690A9', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  ticketCard: { backgroundColor: '#141926', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#232940' },
  subLabel: { color: '#8690A9', fontSize: 11 },
  subValue: { color: '#fff', fontWeight: '600', marginTop: 2 },
  dashedLine: { borderTopWidth: 1, borderColor: '#232940', borderStyle: 'dashed', marginVertical: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f14668', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  qrBtn: { flex: 1, backgroundColor: '#FFC107', borderRadius: 10, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, marginTop: 20 },
  primaryBtn: { backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, alignItems: 'center' },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141926', borderRadius: 20, padding: 24, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#232940' },
});
