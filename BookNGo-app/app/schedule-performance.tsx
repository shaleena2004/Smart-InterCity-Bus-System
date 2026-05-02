import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { mockSchedules } from './globalStore';

export default function SchedulePerformanceScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Dummy data for previously added schedules
    const initialPastSchedules = [
        { id: '1-mock', route: 'Colombo - Kandy', bus: 'ND-1234', date: '2026-03-21', scheduledDep: '08:00 AM', actualDep: '08:05 AM', status: 'On Time' },
        { id: '2-mock', route: 'Galle - Colombo', bus: 'ND-5678', date: '2026-03-21', scheduledDep: '10:30 AM', actualDep: '11:00 AM', status: 'Delayed' },
        { id: '3-mock', route: 'Kandy - Kurunegala', bus: 'NW-9012', date: '2026-03-20', scheduledDep: '02:00 PM', actualDep: '02:00 PM', status: 'On Time' },
        { id: '4-mock', route: 'Jaffna - Colombo', bus: 'NP-3456', date: '2026-03-19', scheduledDep: '05:00 AM', actualDep: '05:15 AM', status: 'On Time' },
    ];

    const [pastSchedules, setPastSchedules] = useState<any[]>(initialPastSchedules);

    useFocusEffect(
        useCallback(() => {
            // Merge mockSchedules (new items) at the top of the initial mock list
            setPastSchedules([...mockSchedules, ...initialPastSchedules]);
        }, [])
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Schedule Performance', headerStyle: { backgroundColor: theme.tint }, headerTintColor: '#000000' }} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: theme.tint }]}>Past Schedules Performance</Text>

                {pastSchedules.map((schedule) => (
                    <View key={schedule.id} style={[styles.card, { borderColor: theme.tint, borderWidth: 1 }]}>
                        <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.routeText}>{schedule.route}</Text>
                                {mockSchedules.some(s => s.id === schedule.id) && (
                                    <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ fontSize: 10, color: '#2E7D32', fontWeight: 'bold' }}>ACTIVE</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.dateText}>{schedule.date}</Text>
                        </View>


                        <View style={styles.detailRow}>
                            <IconSymbol name="bus.fill" size={16} color="#ccc" />
                            <Text style={styles.detailText}>Bus: {schedule.bus}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <IconSymbol name="clock.fill" size={16} color="#ccc" />
                            <Text style={styles.detailText}>Scheduled: {schedule.scheduledDep} | Actual: {schedule.actualDep}</Text>
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
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 10,
    },
    routeText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#666666',
        fontSize: 14,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        color: '#666666',
        fontSize: 14,
        marginLeft: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 10,
    },
    statusText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 12,
    }
});
