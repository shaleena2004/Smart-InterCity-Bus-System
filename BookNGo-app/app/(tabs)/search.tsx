import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const SRI_LANKA_CITIES = [
  "Colombo", "Kandy", "Galle", "Ampara", "Anuradhapura", "Badulla", 
  "Batticaloa", "Gampaha", "Hambantota", "Jaffna", "Kalutara", 
  "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", 
  "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", 
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

// Function to generate next 14 days for selection
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

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const filteredOrigins = SRI_LANKA_CITIES.filter(city => city.toLowerCase().includes(origin.toLowerCase()));
  const filteredDestinations = SRI_LANKA_CITIES.filter(city => city.toLowerCase().includes(destination.toLowerCase()));
  
  const upcomingDates = generateDates();

  const handleSearch = () => {
    if (!origin || !destination || !date) {
      alert('Please fill all fields and select a date');
      return;
    }
    router.push({
      pathname: '/search-results',
      params: { origin, destination, date },
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.tint }]}>
        <ThemedText style={styles.headerTitle}>Search Buses</ThemedText>
      </View>
      
      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <MaterialIcons name="directions-bus" size={28} color={theme.icon} style={{ marginRight: 8 }} />
          <ThemedText style={[styles.cardTitle, { marginBottom: 0 }]}>Find Available Trips</ThemedText>
        </View>

        <View style={{ zIndex: 3 }}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="location-on" size={24} color={theme.icon} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Origin (e.g., Colombo)"
              placeholderTextColor={theme.icon}
              value={origin}
              onChangeText={(txt) => { setOrigin(txt); setShowOriginDropdown(true); }}
              onFocus={() => setShowOriginDropdown(true)}
              onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
            />
          </View>
          {showOriginDropdown && origin.length > 0 && filteredOrigins.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                {filteredOrigins.map((city, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
                    onPress={() => { setOrigin(city); setShowOriginDropdown(false); }}
                  >
                    <ThemedText style={{ color: theme.text }}>{city}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ zIndex: 2 }}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="map" size={24} color={theme.icon} style={styles.icon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Destination (e.g., Kandy)"
              placeholderTextColor={theme.icon}
              value={destination}
              onChangeText={(txt) => { setDestination(txt); setShowDestinationDropdown(true); }}
              onFocus={() => setShowDestinationDropdown(true)}
              onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
            />
          </View>
          {showDestinationDropdown && destination.length > 0 && filteredDestinations.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                {filteredDestinations.map((city, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
                    onPress={() => { setDestination(city); setShowDestinationDropdown(false); }}
                  >
                    <ThemedText style={{ color: theme.text }}>{city}</ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <MaterialIcons name="date-range" size={20} color="#666" style={{ marginRight: 8 }} />
          <ThemedText style={[styles.dateLabel, { marginBottom: 0 }]}>Select Travel Date</ThemedText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {upcomingDates.map((d) => {
            const isSelected = date === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.dateChip,
                  { 
                    backgroundColor: isSelected ? theme.tint : theme.background,
                    borderColor: isSelected ? theme.tint : theme.border
                  }
                ]}
                onPress={() => setDate(d)}
              >
                <ThemedText style={{ color: isSelected ? '#121212' : theme.text, fontWeight: isSelected ? 'bold' : 'normal' }}>
                  {d}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.tint, flexDirection: 'row' }]} 
          onPress={handleSearch}
        >
          <MaterialIcons name="search" size={24} color="#121212" style={{ marginRight: 8 }} />
          <ThemedText style={styles.searchButtonText}>Search Buses</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
  },
  card: {
    margin: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  dateScroll: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  searchButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#121212',
  },
});
