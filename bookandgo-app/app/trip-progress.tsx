import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { mockSchedules } from './globalStore';

export default function TripProgressScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [searched, setSearched] = useState(false);

    const [currentBus, setCurrentBus] = useState<any>(null);
    const [, setTick] = useState(0);

    // Force re-render when screen is focused to show latest schedules
    useFocusEffect(
        useCallback(() => {
            setTick(t => t + 1);
        }, [])
    );
    const handleSearch = () => {
        if (searchQuery.trim().length === 0) {

            setSearched(false);
            setCurrentBus(null);
            return;
        }

        if (searchQuery.trim().length > 0) {
            const found = mockSchedules.find(s => s.route.toLowerCase().includes(searchQuery.toLowerCase()));
            
            if (found) {
                let parsedStops: string[] = [];
                try {
                    if (found.stops && typeof found.stops === 'string') {
                        parsedStops = JSON.parse(found.stops).map((s:any) => s.name);
                    }
                } catch (e) {}
                
                const fromStr = found.route.split(' - ')[0] || "Origin";

                setCurrentBus({
                    route: found.route,
                    status: found.status,
                    currentHalt: parsedStops.length > 0 ? parsedStops[Math.floor(parsedStops.length / 2)] : "Midway Point",
                    pastHalts: parsedStops.length > 0 ? [fromStr, ...parsedStops.slice(0, Math.floor(parsedStops.length / 2))] : [fromStr],
                    distanceRemaining: `${found.distance || 45} km (Assumed)`,
                });
            } else {
                setCurrentBus({
                    route: "Colombo - Kandy",
                    status: "On Time",
                    currentHalt: "Nittambuwa",
                    pastHalts: ["Colombo Fort", "Peliyagoda", "Kadawatha"],
                    distanceRemaining: "45 km (approx. 1h 20m)",
                });
            }
            setSearched(true);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Trip Progress Report', headerStyle: { backgroundColor: theme.tint }, headerTintColor: '#000000' }} />

            <View style={styles.searchSection}>
                <TextInput
                    style={[styles.searchInput, { borderColor: theme.tint, color: theme.text }]}
                    placeholder="Search Route (e.g., Colombo - Kandy)"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.tint }]} onPress={handleSearch}>
                    <IconSymbol name="magnifyingglass" size={20} color="#222" />
                </TouchableOpacity>
            </View>

            {searched && currentBus && (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.card, { borderColor: theme.tint }]}>
                        <Text style={styles.cardTitle}>Live Trip Details</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Route:</Text>
                            <Text style={styles.value}>{currentBus.route} <Text style={{color: currentBus.status === 'Delayed' ? '#ff5555' : theme.tint}}>({currentBus.status || 'On Time'})</Text></Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Currently Halted At:</Text>
                            <Text style={[styles.value, { color: theme.tint, fontSize: 18, fontWeight: 'bold' }]}>{currentBus.currentHalt}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Remaining Distance:</Text>
                            <Text style={[styles.value, { color: '#ff5555' }]}>{currentBus.distanceRemaining}</Text>
                        </View>

                        {currentBus.status !== 'Completed' && (
                            <TouchableOpacity 
                                style={[styles.completeBtn, { backgroundColor: '#4CAF50', marginTop: 10 }]} 
                                onPress={() => {
                                    const destination = currentBus.route.split(' - ')[1] || "Destination";
                                    setCurrentBus({
                                        ...currentBus,
                                        status: 'Completed',
                                        currentHalt: destination,
                                        distanceRemaining: '0 km',
                                        pastHalts: [...currentBus.pastHalts, currentBus.currentHalt]
                                    });
                                    
                                    // Update global store mock
                                    const idx = mockSchedules.findIndex(s => s.route === currentBus.route);
                                    if (idx !== -1) mockSchedules[idx].status = 'Completed';
                                }}
                            >
                                <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
                                <Text style={styles.completeBtnText}>Mark as Arrived (On Time)</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.tint }]}>Passed Halts</Text>
                    {currentBus.pastHalts.map((halt: string, index: number) => (
                        <View key={index} style={styles.haltItem}>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                            <Text style={styles.haltText}>{halt}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            {!searched && (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.sectionTitle, { color: theme.tint, marginBottom: 15 }]}>
                        Recently Updated Trips
                    </Text>
                    {mockSchedules.length > 0 ? (
                        mockSchedules.map((schedule: any, index: number) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.card, { borderColor: '#E0E0E0', padding: 15, marginBottom: 12 }]}
                                onPress={() => {
                                    setSearchQuery(schedule.route);
                                    let parsedStops: string[] = [];
                                    try {
                                        if (schedule.stops && typeof schedule.stops === 'string') {
                                            parsedStops = JSON.parse(schedule.stops).map((s:any) => s.name);
                                        }
                                    } catch (e) {}
                                    
                                    const fromStr = schedule.route.split(' - ')[0] || "Origin";
                                    
                                    setCurrentBus({
                                        route: schedule.route,
                                        status: schedule.status,
                                        currentHalt: parsedStops.length > 0 ? parsedStops[Math.floor(parsedStops.length / 2)] : "Midway Point",
                                        pastHalts: parsedStops.length > 0 ? [fromStr, ...parsedStops.slice(0, Math.floor(parsedStops.length / 2))] : [fromStr],
                                        distanceRemaining: `${schedule.distance || 45} km (Assumed)`,
                                    });
                                    setSearched(true);
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{schedule.route}</Text>
                                            <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                <Text style={{ fontSize: 10, color: '#2E7D32', fontWeight: 'bold' }}>ACTIVE</Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Status: {schedule.status} | Bus: {schedule.bus || 'N/A'}</Text>
                                    </View>

                                    <IconSymbol name="chevron.right" size={24} color={theme.tint} />
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <IconSymbol name="bus.fill" size={60} color="#555" />
                            <Text style={styles.emptyStateText}>No active trips found. Add one from Route Schedule.</Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchSection: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginRight: 10,
    },
    searchBtn: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    cardTitle: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    infoRow: {
        marginBottom: 12,
    },
    label: {
        color: '#666666',
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    haltItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    haltText: {
        color: '#000000',
        fontSize: 16,
        marginLeft: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#888',
        marginTop: 15,
        fontSize: 16,
    },
    completeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    completeBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
