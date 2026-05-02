<<<<<<< HEAD
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { mockSchedules } from '../globalStore';

export default function SearchScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.trim().length > 0) {
            const filtered = mockSchedules.filter(s => 
                s.route.toLowerCase().includes(text.toLowerCase()) ||
                s.bus.toLowerCase().includes(text.toLowerCase())
            );
            setResults(filtered);
        } else {
            setResults([]);
        }
    };

    const renderResult = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/schedule', params: { ...item, newRoute: 'yes' } })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.route}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Delayed' ? '#ff4d4d' : '#4CAF50' }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.detailRow}>
                <IconSymbol name="bus.fill" size={16} color="#666" />
                <Text style={styles.detailText}>Bus: {item.bus}</Text>
            </View>
            <View style={styles.detailRow}>
                <IconSymbol name="clock.fill" size={16} color="#666" />
                <Text style={styles.detailText}>Departs: {item.scheduledDep}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Search Bus Routes</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <IconSymbol name="magnifyingglass" size={20} color="#666" />
                    <TextInput
                        style={styles.input}
                        placeholder="Where to? (e.g. Kandy)"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            {searchQuery.length > 0 ? (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderResult}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No routes found for "{searchQuery}"</Text>
                            </View>
                        }
                    />
                    
                    {/* Location Lookup Logic (from Courier System) */}
                    <View style={styles.locationLookup}>
                        <Text style={styles.lookupTitle}>Location Lookup (Sri Lanka)</Text>
                        <Text style={styles.lookupResult}>
                            Searching for "{searchQuery}" might be in: 
                            {searchQuery.toLowerCase().includes('colombo') ? ' Western Province, Colombo District' : 
                             searchQuery.toLowerCase().includes('kandy') ? ' Central Province, Kandy District' : 
                             searchQuery.toLowerCase().includes('galle') ? ' Southern Province, Galle District' : 
                             ' ... (Check full list in Reports)'}
                        </Text>
                    </View>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    <Text style={styles.sectionTitle}>Popular Routes</Text>
                    {mockSchedules.slice(0, 3).map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.card}
                            onPress={() => router.push({ pathname: '/schedule', params: { ...item, newRoute: 'yes' } })}
                        >
                            <Text style={styles.cardTitle}>{item.route}</Text>
                            <Text style={styles.detailText}>Daily at {item.scheduledDep}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#000000',
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#000',
    },
    listContent: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D4AF37',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    detailText: {
        color: '#666',
        fontSize: 14,
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    locationLookup: {
        padding: 15,
        backgroundColor: '#F0F7FF',
        borderTopWidth: 1,
        borderTopColor: '#D0E0FF',
    },
    lookupTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0056b3',
        marginBottom: 5,
    },
    lookupResult: {
        fontSize: 12,
        color: '#333',
        fontStyle: 'italic',
    }
=======
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
>>>>>>> origin/bookings
});
