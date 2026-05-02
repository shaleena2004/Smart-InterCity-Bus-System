import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';

import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { mockSchedules } from '../globalStore';

export default function BookingsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [bookings, setBookings] = useState<any[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            // Only show ACTIVE bookings
            const activeBookings = mockSchedules.filter(s => s.isActive !== false);
            setBookings(activeBookings);
        }, [])
    );


    // Combine hardcoded bookings with newly created schedules from the store
    const myBookings = [
        ...bookings.map(s => ({
            id: s.id,
            route: s.route,
            date: s.date,
            time: s.scheduledDep,
            seat: '14A', // Default seat for mock
            status: 'Confirmed',
            price: 'Rs. 1,200',
            bus: s.bus
        }))
    ];


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                
                {myBookings.map((booking) => (
                    <TouchableOpacity key={booking.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.routeText}>{booking.route}</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>{booking.status}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Date & Time</Text>
                                <Text style={styles.value}>{booking.date} | {booking.time}</Text>
                            </View>
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Seat No</Text>
                                <Text style={styles.value}>{booking.seat}</Text>
                            </View>
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Bus Number</Text>
                                <Text style={styles.value}>{booking.bus}</Text>
                            </View>
                            <View style={styles.detailCol}>
                                <Text style={styles.label}>Amount Paid</Text>
                                <Text style={[styles.value, { color: '#4CAF50' }]}>{booking.price}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.ticketBtn, { borderColor: theme.tint }]}>
                            <IconSymbol name="qrcode" size={20} color={theme.tint} />
                            <Text style={[styles.ticketBtnText, { color: theme.tint }]}>View E-Ticket</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                {myBookings.length === 0 && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="ticket.fill" size={60} color="#E0E0E0" />
                        <Text style={styles.emptyText}>No active bookings. Start your journey today!</Text>
                    </View>
                )}
            </ScrollView>
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
    content: {
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
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailCol: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    ticketBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginTop: 5,
    },
    ticketBtnText: {
        marginLeft: 10,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    }
});
