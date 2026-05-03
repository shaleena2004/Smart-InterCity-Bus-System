import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { createBooking, getBookings } from '../services/api';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
const seatLayout = [
  [{ id: '1', booked: true }, { id: '2', booked: false }, null, { id: '3', booked: false }, { id: '4', booked: false }],
  [{ id: '5', booked: false }, { id: '6', booked: false }, null, { id: '7', booked: true }, { id: '8', booked: false }],
  [{ id: '9', booked: false }, { id: '10', booked: false }, null, { id: '11', booked: false }, { id: '12', booked: false }],
  [{ id: '13', booked: false }, { id: '14', booked: true }, null, { id: '15', booked: false }, { id: '16', booked: false }],
  [{ id: '17', booked: false }, { id: '18', booked: false }, null, { id: '19', booked: false }, { id: '20', booked: false }],
  [{ id: '21', booked: false }, { id: '22', booked: false }, null, { id: '23', booked: false }, { id: '24', booked: false }],
  [{ id: '25', booked: true }, { id: '26', booked: false }, null, { id: '27', booked: false }, { id: '28', booked: false }],
  [{ id: '29', booked: false }, { id: '30', booked: false }, null, { id: '31', booked: false }, { id: '32', booked: false }],
  [{ id: '33', booked: false }, { id: '34', booked: false }, null, { id: '35', booked: false }, { id: '36', booked: false }],
  [{ id: '37', booked: false }, { id: '38', booked: false }, { id: '39', booked: false }, { id: '40', booked: false }, { id: '41', booked: false }],
];
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CITIES = ["Colombo", "Kandy", "Galle", "Matara", "Jaffna", "Kurunegala", "Anuradhapura", "Badulla", "Ratnapura", "Negombo", "Trincomalee", "Batticaloa", "Nuwara Eliya", "Hambantota", "Ampara", "Kegalle", "Puttalam", "Polonnaruwa", "Vavuniya", "Mannar", "Kalutara", "Gampaha", "Monaragala"];

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const MOCK_TRIPS = [
  { id: '1', time: '06:30 AM', arrival: '11:00 AM', type: 'Single Deck', seats: 15, price: 1500, plate: 'NC-4521' },
  { id: '2', time: '08:00 AM', arrival: '01:00 PM', type: 'Single Deck', seats: 12, price: 1500, plate: 'NB-9988' },
  { id: '3', time: '10:30 AM', arrival: '03:30 PM', type: 'Single Deck', seats: 5, price: 1550, plate: 'ND-1122' },
  { id: '4', time: '01:00 PM', arrival: '06:00 PM', type: 'Single Deck', seats: 22, price: 1500, plate: 'NE-3344' },
  { id: '5', time: '04:30 PM', arrival: '09:30 PM', type: 'Single Deck', seats: 8, price: 1600, plate: 'NF-5566' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tab, setTab] = useState('seats');
  const [origin, setOrigin] = useState(params.origin || '');
  const [destination, setDestination] = useState(params.destination || '');
  const [date, setDate] = useState(params.date || new Date().toISOString().split('T')[0]);
  const { userId } = useAuth();
  const [selectedTrip, setSelectedTrip] = useState(params.tripData ? JSON.parse(params.tripData) : null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [bookedSeats, setBookedSeats] = useState([]);

  useEffect(() => {
    if (!selectedTrip && !loading) {
      router.replace('/find-buses');
    }
  }, [selectedTrip]);

  const fetchBookedSeats = async (targetDate, trip) => {
    try {
      const res = await getBookings();
      const relevantBookings = res.data.filter(b => 
        b.date === targetDate && 
        b.busNumber === (trip?.busNumber || 'EX01') &&
        (b.status === 'Confirmed' || b.status === 'Pending')
      );
      const seats = [];
      relevantBookings.forEach(b => {
        if (b.seatNumber) {
          seats.push(...b.seatNumber.split(',').map(s => s.trim()));
        }
      });
      setBookedSeats(seats);
    } catch (err) {
      console.error('Failed to fetch booked seats', err);
    }
  };

  useEffect(() => {
    if (params.tripData) {
      const parsedTrip = JSON.parse(params.tripData);
      const parsedDate = params.date || new Date().toISOString().split('T')[0];
      setTab('seats');
      setSelectedSeats([]);
      setOrigin(params.origin || '');
      setDestination(params.destination || '');
      setDate(parsedDate);
      setSelectedTrip(parsedTrip);
      setPaymentMethod('card');
      fetchBookedSeats(parsedDate, parsedTrip);
    }
  }, [params.tripData, params.tripId, params.date, params.origin, params.destination, params.t]);

  const toggleSeat = (id, booked) => {
    if (booked) return;
    if (selectedSeats.includes(id)) setSelectedSeats(selectedSeats.filter(s => s !== id));
    else if (selectedSeats.length < 6) setSelectedSeats([...selectedSeats, id]);
    else Alert.alert('Limit', 'Max 6 seats');
  };

  const generateTicketPDF = async () => {
    try {
      const qrData = `TKT-BB2-X86-L-${userId || 'GUEST'}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
      const ticketHtml = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; background-color: #f4f4f4; padding: 20px; }
              .ticket { background-color: #fff; border-radius: 10px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 20px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
              .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
              .details-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .detail-box { flex: 1; }
              .label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
              .value { font-size: 16px; font-weight: bold; color: #333; }
              .route { display: flex; align-items: center; justify-content: space-between; background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .route-city { font-size: 20px; font-weight: bold; color: #333; }
              .qr-container { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ccc; }
              .qr-img { width: 150px; height: 150px; }
              .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1 class="title">BOOK & GO</h1>
                <p class="subtitle">Boarding Pass / E-Ticket</p>
              </div>
              
              <div class="route">
                <div class="route-city">${origin}</div>
                <div style="color: #FFC107; font-size: 24px;">&#8594;</div>
                <div class="route-city">${destination}</div>
              </div>
              
              <div class="details-container">
                <div class="detail-box">
                  <div class="label">Passenger</div>
                  <div class="value">${userId ? 'Registered User' : 'Guest'}</div>
                </div>
                <div class="detail-box">
                  <div class="label">Date</div>
                  <div class="value">${new Date(date).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div class="details-container">
                <div class="detail-box">
                  <div class="label">Time</div>
                  <div class="value">${selectedTrip?.departureTime || '08:30 AM'}</div>
                </div>
                <div class="detail-box">
                  <div class="label">Seat(s)</div>
                  <div class="value">${selectedSeats.join(', ')}</div>
                </div>
              </div>

              <div class="details-container">
                <div class="detail-box">
                  <div class="label">Bus Number</div>
                  <div class="value">${selectedTrip?.busNumber || 'EX01'}</div>
                </div>
                <div class="detail-box">
                  <div class="label">Total Fare</div>
                  <div class="value">LKR ${(selectedSeats.length * (selectedTrip?.price || 1500)).toFixed(2)}</div>
                </div>
              </div>
              
              <div class="qr-container">
                <img class="qr-img" src="${qrUrl}" />
                <p class="label" style="margin-top: 10px;">Ticket ID: TKT-BB2-X86-L</p>
                <div class="footer">Please present this QR code to the conductor when boarding.</div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: ticketHtml });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Success', 'Ticket PDF generated! But sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate ticket PDF');
      console.error(error);
    }
  };

  const confirmBooking = async () => {
    setLoading(true);
    try {
      await createBooking({
        user: userId,
        busRoute: `${origin} → ${destination}`,
        route: `${origin} → ${destination}`,
        seatNumber: selectedSeats.join(','),
        seat: selectedSeats.join(','),
        date: date,
        time: selectedTrip?.departureTime,
        busNumber: selectedTrip?.busNumber || 'EX01',
        fare: selectedSeats.length * selectedTrip?.price,
        status: 'Confirmed'
      });
      setTab('confirmation');
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.message || 'Could not process booking');
    } finally {
      setLoading(false);
    }
  };

  const renderSeats = () => (
    <View style={{ flex: 1 }}>
      {/* Header matching design */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{origin} ⇌ {destination}</Text>
          <Text style={{ color: '#8690A9', fontSize: 12 }}>{selectedTrip?.routeNumber || 'EX01 Expressway'} • {selectedTrip?.departureTime || '14:30 PM'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Select your seats</Text>
      <Text style={{ color: '#8690A9', fontSize: 14, marginBottom: 20 }}>Luxury AC Coach • {selectedTrip?.routeNumber || 'NB-4521'}</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#1c2130', borderWidth: 1, borderColor: '#232940' }]} /><Text style={styles.legendLabel}>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} /><Text style={styles.legendLabel}>Selected</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: '#232940' }]} /><Text style={styles.legendLabel}>Booked</Text></View>
      </View>

      <View style={styles.busLayout}>
        <View style={{ backgroundColor: '#141926', paddingVertical: 8, borderRadius: 8, marginBottom: 16, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' }}>
          <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 12 }}><Ionicons name="time" size={14} /> SELECTION EXPIRES IN 05:00</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="radio-button-off" size={24} color="#8690A9" />
            <Text style={{ color: '#8690A9', fontWeight: 'bold' }}>DRIVER</Text>
          </View>
          <View style={{ backgroundColor: '#232940', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>ENTRANCE</Text>
          </View>
        </View>

        {seatLayout.map((row, ri) => (
          <View key={ri} style={styles.seatRow}>
            {row.map((s, si) => {
              if (!s) return <View key={`spacer-${si}`} style={{ width: 28 }} />;
              const isBooked = bookedSeats.includes(s.id) || s.booked;
              const sel = selectedSeats.includes(s.id);
              const bg = isBooked ? '#232940' : sel ? '#FFC107' : '#1c2130';
              return (
                <TouchableOpacity key={s.id} style={[styles.seat, { backgroundColor: bg, borderColor: sel ? '#FFC107' : '#232940' }]} onPress={() => toggleSeat(s.id, isBooked)}>
                  <Text style={{ color: sel ? '#0B0F19' : '#8690A9', fontSize: 12, fontWeight: 'bold' }}>{s.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ backgroundColor: '#232940', paddingVertical: 12, borderRadius: 20, marginTop: 20, width: '80%', alignItems: 'center' }}>
          <Text style={{ color: '#8690A9', fontSize: 12, fontWeight: 'bold' }}>ENGINE BAY / REAR EXIT</Text>
        </View>
      </View>

      <Text style={{ color: '#8690A9', fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginBottom: 20 }}>Aisle provides easy access to all seats</Text>

      {selectedSeats.length > 0 && (
        <View style={{ backgroundColor: '#141926', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#232940', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>SELECTED SEATS</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {selectedSeats.map(s => (
                  <View key={s} style={{ backgroundColor: '#FFC10720', borderWidth: 1, borderColor: '#FFC107', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#8690A9', fontSize: 11, fontWeight: 'bold', marginBottom: 6 }}>TOTAL PRICE</Text>
              <Text style={{ color: '#FFC107', fontSize: 20, fontWeight: 'bold' }}>LKR {(selectedSeats.length * (selectedTrip?.price || 1500)).toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setTab('payment')}>
            <Text style={styles.primaryBtnText}>Proceed to Pay</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPayment = () => {
    const total = (selectedSeats.length * (selectedTrip?.price || 1500)).toFixed(2);
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setTab('seats')}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20 }}>Payment</Text>
        </View>

        <View style={{ backgroundColor: '#141926', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#232940', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#8690A9', fontSize: 11, marginBottom: 4 }}>ROUTE</Text>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{origin} ⇌ {destination}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#8690A9', fontSize: 11, marginBottom: 4 }}>SEATS</Text>
              <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>{selectedSeats.join(', ')}</Text>
            </View>
          </View>
          <View style={{ borderTopWidth: 1, borderColor: '#232940', marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#8690A9', fontSize: 14 }}>Amount to Pay</Text>
            <Text style={{ color: '#FFC107', fontSize: 18, fontWeight: 'bold' }}>LKR {total}</Text>
          </View>
        </View>

        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Select Payment Method</Text>

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setPaymentMethod('card')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: paymentMethod === 'card' ? '#FFC107' : '#232940', marginBottom: 10 }}>
            <Ionicons name="card" size={24} color={paymentMethod === 'card' ? '#FFC107' : '#8690A9'} style={{ marginRight: 12 }} />
            <Text style={{ color: paymentMethod === 'card' ? '#fff' : '#8690A9', flex: 1, fontSize: 14 }}>Credit / Debit Card</Text>
            <Ionicons name={paymentMethod === 'card' ? "radio-button-on" : "radio-button-off"} size={20} color={paymentMethod === 'card' ? '#FFC107' : '#8690A9'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod('koko')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: paymentMethod === 'koko' ? '#FFC107' : '#232940', marginBottom: 10 }}>
            <Ionicons name="cash-outline" size={24} color={paymentMethod === 'koko' ? '#FFC107' : '#8690A9'} style={{ marginRight: 12 }} />
            <Text style={{ color: paymentMethod === 'koko' ? '#fff' : '#8690A9', flex: 1, fontSize: 14 }}>KOKO / Mintpay</Text>
            <Ionicons name={paymentMethod === 'koko' ? "radio-button-on" : "radio-button-off"} size={20} color={paymentMethod === 'koko' ? '#FFC107' : '#8690A9'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaymentMethod('genie')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: paymentMethod === 'genie' ? '#FFC107' : '#232940' }}>
            <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'genie' ? '#FFC107' : '#8690A9'} style={{ marginRight: 12 }} />
            <Text style={{ color: paymentMethod === 'genie' ? '#fff' : '#8690A9', flex: 1, fontSize: 14 }}>Dialog Genie / eZ Cash</Text>
            <Ionicons name={paymentMethod === 'genie' ? "radio-button-on" : "radio-button-off"} size={20} color={paymentMethod === 'genie' ? '#FFC107' : '#8690A9'} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Add New Card</Text>
        <Text style={{ color: '#8690A9', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>CARD NUMBER</Text>
        <TextInput style={styles.formInput} placeholder="0000 0000 0000 0000" placeholderTextColor="#8690A9" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8690A9', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>EXPIRY DATE</Text>
            <TextInput style={styles.formInput} placeholder="MM / YY" placeholderTextColor="#8690A9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8690A9', fontSize: 11, marginBottom: 8, letterSpacing: 1 }}>CVV</Text>
            <TextInput style={styles.formInput} placeholder="***" placeholderTextColor="#8690A9" secureTextEntry />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <Ionicons name="checkbox" size={20} color="#FFC107" style={{ marginRight: 8 }} />
          <Text style={{ color: '#8690A9', fontSize: 12 }}>Save card for future payments</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={confirmBooking}>
          <Text style={styles.primaryBtnText}>{loading ? 'Processing...' : `Pay LKR ${total}`}</Text>
          <Ionicons name="lock-closed" size={16} color="#000" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderConfirmation = () => {
    return (
      <View style={{ flex: 1, alignItems: 'center' }}>


        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFC10720', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-sharp" size={24} color="#000" />
          </View>
        </View>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>Payment Successful</Text>
        <Text style={{ color: '#8690A9', fontSize: 12, marginBottom: 30 }}>Transaction ID: SL-{Math.floor(Math.random() * 1000000)}</Text>

        <View style={{ backgroundColor: '#141926', width: '100%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#232940', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#FFC107', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>BOARDING PASS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{origin}</Text>
              <Ionicons name="bus" size={16} color="#FFC107" />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{destination}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#8690A9', fontSize: 10, marginBottom: 4 }}>SERVICE</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>Highway Express</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#8690A9', fontSize: 10, marginBottom: 4 }}>SEAT NUMBER</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{selectedSeats.join(', ')}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ color: '#8690A9', fontSize: 10, marginBottom: 4 }}>DATE</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>{new Date(date).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#8690A9', fontSize: 10, marginBottom: 4 }}>DEPARTURE</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>{selectedTrip?.departureTime || '08:30 AM'}</Text>
            </View>
          </View>

          <View style={{ borderTopWidth: 1, borderColor: '#232940', borderStyle: 'dashed', marginHorizontal: -20, marginBottom: 20 }} />

          <View style={{ backgroundColor: '#0B0F19', padding: 16, borderRadius: 8, alignItems: 'center' }}>
            <Image source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=TKT-BB2-X86-L-${userId}` }} style={{ width: 120, height: 120 }} />
            <Text style={{ color: '#8690A9', fontSize: 11, marginTop: 12 }}>Scan this code at the terminal</Text>
            <Text style={{ color: '#232940', fontSize: 10, marginTop: 4 }}>TKT-BB2-X86-L</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { width: '100%', marginBottom: 12 }]} onPress={generateTicketPDF}>
          <Ionicons name="download-outline" size={20} color="#000" />
          <Text style={styles.primaryBtnText}>Download Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ width: '100%', backgroundColor: '#232940', paddingVertical: 15, borderRadius: 12, alignItems: 'center' }} onPress={() => { router.replace('/my-bookings'); }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Go to My Tickets</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        {tab === 'seats' && renderSeats()}
        {tab === 'payment' && renderPayment()}
        {tab === 'confirmation' && renderConfirmation()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  tabBar: { flexDirection: 'row', backgroundColor: '#141926', borderBottomWidth: 1, borderBottomColor: '#232940' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  tabActive: { backgroundColor: '#FFC107', borderRadius: 0 },
  tabText: { color: '#8690A9', fontWeight: '600', fontSize: 13 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141926', borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: '#232940' },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14, marginLeft: 10 },
  label: { color: '#8690A9', fontSize: 13, marginBottom: 8 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#232940', marginRight: 8, backgroundColor: '#141926' },
  dateChipActive: { backgroundColor: '#FFC107', borderColor: '#FFC107' },
  dateText: { color: '#8690A9', fontSize: 13 },
  primaryBtn: { backgroundColor: '#FFC107', borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  primaryBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
  promoBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12, gap: 10 },
  promoText: { flex: 1, fontSize: 13 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tripCard: { backgroundColor: '#141926', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#232940' },
  tripTime: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tripSub: { color: '#8690A9', fontSize: 13, marginTop: 2 },
  tripPrice: { color: '#FFC107', fontSize: 20, fontWeight: 'bold' },
  tripBottom: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#232940', paddingTop: 10, marginTop: 10, gap: 6 },
  tripSeats: { color: '#8690A9', fontSize: 13 },
  fast: { color: '#f14668', fontSize: 12, fontWeight: 'bold', marginLeft: 'auto' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 18, height: 18, borderRadius: 4 },
  legendLabel: { color: '#8690A9', fontSize: 12 },
  busLayout: { alignItems: 'center', borderWidth: 2, borderColor: '#232940', borderRadius: 20, padding: 16, marginBottom: 16 },
  frontLabel: { color: '#8690A9', marginBottom: 12, fontWeight: 'bold' },
  seatRow: { flexDirection: 'row', marginBottom: 8, gap: 6 },
  seat: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  seatFooter: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#141926', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#232940', marginBottom: 16 },
  formInput: { backgroundColor: '#141926', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#232940', marginBottom: 12 },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  smallBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#141926', borderRadius: 20, padding: 24, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#232940' },
});
