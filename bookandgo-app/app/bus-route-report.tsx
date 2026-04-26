import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';

import { mockSchedules } from './globalStore';

export default function BusRouteReportScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Dummy data for past traveled buses with their start and stop times
    const initialPastTrips = [
        { id: '1-br', busNo: 'ND-1234', route: 'Colombo - Kandy', date: '2026-03-22', startTime: '06:00 AM', stopTime: '10:00 AM', status: 'Completed' },
        { id: '2-br', busNo: 'ND-5678', route: 'Galle - Colombo', date: '2026-03-22', startTime: '07:30 AM', stopTime: '10:15 AM', status: 'Completed' },
        { id: '3-br', busNo: 'NW-9012', route: 'Kandy - Kurunegala', date: '2026-03-21', startTime: '02:00 PM', stopTime: '03:45 PM', status: 'Completed' },
        { id: '4-br', busNo: 'NP-3456', route: 'Jaffna - Colombo', date: '2026-03-21', startTime: '08:00 AM', stopTime: '04:30 PM', status: 'Completed' },
        { id: '5-br', busNo: 'ND-8899', route: 'Colombo - Matara', date: '2026-03-21', startTime: '05:00 PM', stopTime: '08:00 PM', status: 'Completed' },
    ];

    const [pastTrips, setPastTrips] = useState<any[]>(initialPastTrips);

    useFocusEffect(
        useCallback(() => {
            const mappedMocks = mockSchedules.map(schedule => ({
                id: schedule.id,
                busNo: schedule.bus,
                route: schedule.route,
                date: schedule.date,
                startTime: schedule.scheduledDep,
                stopTime: schedule.scheduledArr || '--:--',
                status: schedule.status
            }));
            
            setPastTrips([...mappedMocks, ...initialPastTrips]);
        }, [])
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Bus Route Report', headerStyle: { backgroundColor: theme.tint }, headerTintColor: '#000000' }} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: theme.tint }]}>Previous Bus Trips (Start & Stop Times)</Text>

                {pastTrips.map((trip) => (
                    <View key={trip.id} style={[styles.card, { borderColor: theme.tint, borderWidth: 1 }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.busInfo}>
                                <IconSymbol name="bus.fill" size={20} color="#FFD700" />
                                <Text style={styles.busText}>{trip.busNo}</Text>
                                <View style={{ marginLeft: 10, backgroundColor: mockSchedules.some(s => s.id === trip.id && s.isActive !== false) ? '#E8F5E9' : '#F5F5F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                    <Text style={{ fontSize: 10, color: mockSchedules.some(s => s.id === trip.id && s.isActive !== false) ? '#2E7D32' : '#888', fontWeight: 'bold' }}>
                                        {mockSchedules.some(s => s.id === trip.id && s.isActive !== false) ? 'ACTIVE' : 'INACTIVE'}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                {!mockSchedules.some(s => s.id === trip.id && s.isActive !== false) && (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            const existingIdx = mockSchedules.findIndex(s => s.id === trip.id);
                                            if (existingIdx !== -1) {
                                                mockSchedules[existingIdx].isActive = true;
                                            } else {
                                                // If it's a past trip not in mock, add it to mockSchedules as active
                                                mockSchedules.push({
                                                    id: trip.id,
                                                    route: trip.route,
                                                    bus: trip.busNo,
                                                    date: trip.date,
                                                    scheduledDep: trip.startTime,
                                                    scheduledArr: trip.stopTime,
                                                    status: 'On Time',
                                                    isActive: true
                                                });
                                            }
                                            setPastTrips([...pastTrips]); // Trigger re-render
                                            if (Platform.OS === 'web') window.alert("Route Activated Successfully!");
                                        }}
                                        style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#4CAF50' }}
                                    >
                                        <Text style={{ fontSize: 11, color: '#2E7D32', fontWeight: 'bold' }}>ACTIVATE</Text>
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.dateText}>{trip.date}</Text>
                            </View>
                        </View>



                        <Text style={styles.routeText}>{trip.route}</Text>

                        <View style={styles.timeContainer}>
                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Start Time</Text>
                                <Text style={[styles.timeValue, { color: '#4CAF50' }]}>{trip.startTime}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.timeBox}>
                                <Text style={styles.timeLabel}>Stop / End Time</Text>
                                <Text style={[styles.timeValue, { color: '#F44336' }]}>{trip.stopTime}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 15,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    busInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    busText: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    dateText: {
        color: '#666666',
        fontSize: 14,
    },
    routeText: {
        color: '#000000',
        fontSize: 16,
        marginBottom: 15,
    },
    timeContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    timeBox: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: '80%',
        backgroundColor: '#E0E0E0',
    },
    timeLabel: {
        color: '#666666',
        fontSize: 12,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});
