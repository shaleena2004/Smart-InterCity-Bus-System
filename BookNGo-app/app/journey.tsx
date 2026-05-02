import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MapComponent from '@/components/MapComponent';


export default function JourneyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [isDestinationReached, setIsDestinationReached] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Mock locations in Colombo area
  const passengerStartCoord = { latitude: 6.9270, longitude: 79.8600 };
  const destinationCoord = { latitude: 6.9065, longitude: 79.8510 };
  
  const [busLocation, setBusLocation] = useState({ latitude: 6.9400, longitude: 79.8700 });
  const [haltsLeft, setHaltsLeft] = useState(8);
  const [reportText, setReportText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sentiment, setSentiment] = useState<'Positive'|'Negative'|null>(null);
  
  const mapRef = useRef<typeof MapView>(null);

  const busDetails = {
    number: 'ND-4521 (Colombo - Galle)',
    driverName: 'Mr. Sunil Perera',
    conductorName: 'Kamal',
    ticketPrice: 'Rs. 450'
  };

  // Journey time tracking
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  
  // Simulate bus movement
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    // If journey hasn't started, just move bus towards passenger slowly to show it arriving
    if (!journeyStarted) {
      interval = setInterval(() => {
        setBusLocation(prev => {
          const latDiff = passengerStartCoord.latitude - prev.latitude;
          const lngDiff = passengerStartCoord.longitude - prev.longitude;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          if (distance < 0.001) return passengerStartCoord; // Bus arrived at passenger
          
          return {
            latitude: prev.latitude + (latDiff * 0.05),
            longitude: prev.longitude + (lngDiff * 0.05),
          };
        });
      }, 2000);
    } 
    // If journey started, move from passenger location to destination
    else if (journeyStarted && !isDestinationReached) {
      interval = setInterval(() => {
        setBusLocation(prev => {
          const latDiff = destinationCoord.latitude - prev.latitude;
          const lngDiff = destinationCoord.longitude - prev.longitude;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
          
          if (distance < 0.001) {
            setIsDestinationReached(true);
            setHaltsLeft(0);
            return destinationCoord;
          }
          
          // Simulate halts decrement based on distance progress
          if (distance < 0.005) setHaltsLeft(0);
          else if (distance < 0.010) setHaltsLeft(1);
          else if (distance < 0.015) setHaltsLeft(2);
          else if (distance < 0.020) setHaltsLeft(3);
          else if (distance < 0.025) setHaltsLeft(4);
          
          return {
            latitude: prev.latitude + (latDiff * 0.05),
            longitude: prev.longitude + (lngDiff * 0.05),
          };
        });
      }, 1500);
    }
    
    return () => clearInterval(interval);
  }, [journeyStarted, isDestinationReached]);

  const handleStartJourney = () => {
    setJourneyStarted(true);
    setStartTime(new Date());
    // Once journey starts, the passenger is ON the bus, so their location is the bus location
    // But for map display, we'll just track the bus.
  };

  const handleEndJourney = () => {
    setEndTime(new Date());
    setShowSummary(true);
  };

  const handleSubmitReport = () => {
    if (reportText.trim().length === 0) {
      Alert.alert('Error', 'Please enter your issue before submitting.');
      return;
    }
    Alert.alert('Report Submitted', 'Your report has been sent to the admin. We will look into it shortly.');
    setReportText(''); // Clear
  };

  const handleSubmitFeedback = () => {
    Alert.alert('Thank You', 'We appreciate your feedback!');
    setShowSummary(false);
  };

  const durationFormatted = () => {
    if (!startTime || !endTime) return 'N/A';
    const diffMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    if (diffMins === 0) return 'Less than a minute'; // Since it's a simulation
    return `${diffMins} minutes`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Live Journey</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} style={{ flex: 1 }}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapComponent
            busLocation={busLocation}
            routeCoordinates={[
              journeyStarted ? busLocation : passengerStartCoord,
              destinationCoord
            ]}
            theme={theme}
            style={styles.map}
          />
        </View>


        {/* Bus Details & Status */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Journey Details</Text>
          <View style={styles.detailRow}>
            <MaterialIcons name="directions-bus" size={20} color={theme.text} />
            <Text style={[styles.detailText, { color: theme.text }]}>{busDetails.number}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={20} color={theme.text} />
            <Text style={[styles.detailText, { color: theme.text }]}>Driver: {busDetails.driverName}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={20} color={theme.text} />
            <Text style={[styles.detailText, { color: theme.text }]}>Halts Remaining: {haltsLeft}</Text>
          </View>
        </View>

        {/* Controls Section */}
        <View style={styles.controlsCard}>
          {!journeyStarted ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartJourney}>
              <Text style={styles.buttonText}>Start Journey</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.primaryButton, 
                !isDestinationReached ? styles.disabledButton : null,
                isDestinationReached ? { backgroundColor: '#e74c3c' } : null
              ]} 
              onPress={handleEndJourney}
              disabled={!isDestinationReached}
            >
              <Text style={styles.buttonText}>End Journey</Text>
            </TouchableOpacity>
          )}
          {!isDestinationReached && journeyStarted && (
            <Text style={styles.helperText}>End button will be enabled when you reach destination.</Text>
          )}
        </View>

        {/* Report Issue Form */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Report an Issue</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Describe any delay or issue here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            value={reportText}
            onChangeText={setReportText}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSubmitReport}>
            <Text style={styles.secondaryButtonText}>Submit Report</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Journey End Summary Modal */}
      <Modal visible={showSummary} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Journey Completed!</Text>
            
            <View style={[styles.summaryBox, { backgroundColor: theme.surface }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.text }]}>Date:</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{new Date().toLocaleDateString()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.text }]}>Time Taken:</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{durationFormatted()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.text }]}>Price:</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{busDetails.ticketPrice}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.text }]}>Bus Details:</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{busDetails.number}</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { marginTop: 15, color: theme.text }]}>How was your trip?</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton, 
                  { backgroundColor: sentiment === 'Positive' ? '#2ecc71' : '#ccc', flex: 1, marginRight: 5 }
                ]}
                onPress={() => setSentiment('Positive')}
              >
                <Text style={styles.buttonText}>Positive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.secondaryButton, 
                  { backgroundColor: sentiment === 'Negative' ? '#e74c3c' : '#ccc', flex: 1, marginLeft: 5 }
                ]}
                onPress={() => setSentiment('Negative')}
              >
                <Text style={styles.buttonText}>Negative</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, height: 80 }]}
              placeholder="Leave a comment (optional)..."
              placeholderTextColor="#999"
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitFeedback}>
              <Text style={styles.buttonText}>Submit & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  scrollBody: { paddingBottom: 30 },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee'
  },
  map: { width: '100%', height: '100%' },
  busMarker: {
    backgroundColor: '#e67e22',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white'
  },
  passengerMarker: {
    backgroundColor: '#3498db',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white'
  },
  destinationMarker: {
    backgroundColor: '#2ecc71',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white'
  },
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { marginLeft: 10, fontSize: 16 },
  controlsCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#e67e22',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  helperText: { textAlign: 'center', color: '#888', marginTop: 8, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  summaryBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 16, fontWeight: '600' },
  summaryValue: { fontSize: 16 },
});
