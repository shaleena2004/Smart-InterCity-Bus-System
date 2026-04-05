import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScheduleScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const params = useLocalSearchParams();
    const router = useRouter();

    // Check if there is an incoming newly created route
    const hasNewRoute = params.newRoute === 'yes';

    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        setIsCancelled(false);
    }, [params.newRoute, params.routeName]);

    const handleCancel = () => {
        if (Platform.OS === 'web') {
            const confirm = window.confirm("Are you sure you want to cancel this incoming schedule?");
            if (confirm) setIsCancelled(true);
        } else {
            Alert.alert(
                "Cancel Schedule",
                "Are you sure you want to cancel this incoming schedule?",
                [
                    { text: "No", style: "cancel" },
                    { text: "Yes, Cancel", onPress: () => setIsCancelled(true), style: "destructive" }
                ]
            );
        }
    };

    const handleEdit = () => {
        router.push({
            pathname: '/create-route',
            params: {
                isUpdate: 'yes',
                routeName: params.routeName,
                from: params.from,
                to: params.to,
                departure: params.departure,
                arrival: params.arrival,
                distance: params.distance || '',
                stops: params.stops || '[]',
                busNumber: params.busNumber || '',
                status: params.status || 'On Time',
                id: params.id
            }
        });
    };

    const tripDetails = hasNewRoute ? {
        busNumber: (params.busNumber as string) || "N/A",
        seat: "Unassigned",
        from: params.from as string,
        to: params.to as string,
        departure: params.departure as string || '--:--',
        status: (params.status as string) || "Pending",
    } : {
        busNumber: "ND-1234",
        seat: "Window 14",
        from: "Colombo",
        to: "Kandy",
        departure: "08:00 AM",
        status: "On Time", // "On Time", "Delayed", "Departed"
    };

    let stops = [
        { id: '1', name: "Colombo Fort", type: "Interchange", time: "08:00 AM", status: "Departed" },
        { id: '2', name: "Peliyagoda", type: "Stop", time: "08:20 AM", status: "Departed" },
        { id: '3', name: "Kadawatha", type: "Interchange", time: "08:45 AM", status: "On Time" },
        { id: '4', name: "Nittambuwa", type: "Stop", time: "09:30 AM", status: "On Time" },
        { id: '5', name: "Kandy Bus Stand", type: "Interchange", time: "11:00 AM", status: "On Time" },
    ];

    if (hasNewRoute) {
        let dynamicStops = [];
        dynamicStops.push({ id: 'start', name: params.from as string, type: "Interchange", time: (params.departure as string) || '--', status: "Departed" });
        
        if (params.stops) {
            try {
                const parsedStops = JSON.parse(params.stops as string);
                parsedStops.forEach((s: any, index: number) => {
                    if (s.name && s.time) {
                        dynamicStops.push({ id: `stop-${index}`, name: s.name, type: "Stop", time: s.time, status: "On Time" });
                    }
                });
            } catch (e) {}
        }
        
        dynamicStops.push({ id: 'end', name: params.to as string, type: "Interchange", time: (params.arrival as string) || '--', status: "On Time" });
        stops = dynamicStops;
    }

    const renderStop = ({ item, index }: { item: any; index: number }) => {
        return (
            <View style={styles.stopItem}>
                <View style={styles.timeline}>
                    <View style={[styles.dot, item.status === 'Departed' ? { backgroundColor: '#FFFFFF' } : { backgroundColor: theme.tint }]} />
                    {index !== stops.length - 1 && <View style={[styles.line, { backgroundColor: theme.tint }]} />}
                </View>
                <View style={styles.stopContent}>
                    <Text style={[styles.stopName, { color: theme.tint }]}>
                        {item.name} {item.type === 'Interchange' && <Text style={styles.badge}>(Major Interchange)</Text>}
                    </Text>
                    <Text style={styles.stopTime}>{item.time} - <Text style={item.status === 'Departed' ? styles.departed : styles.onTime}>{item.status}</Text></Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Schedule & Route</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Incoming Created Schedules (Dynamic from creation) */}
                {hasNewRoute && !isCancelled && (
                    <View style={[styles.card, { borderColor: '#4CAF50', borderWidth: 2 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#555', paddingBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <IconSymbol name="plus.circle.fill" size={20} color="#4CAF50" />
                                <Text style={[styles.cardTitle, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0, marginLeft: 8 }]}>
                                    Incoming New Schedule
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={handleEdit} style={{ backgroundColor: '#FFC107', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 5 }}>
                                    <Text style={{ color: '#000000', fontSize: 12, fontWeight: 'bold' }}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleCancel} style={{ backgroundColor: '#F44336', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 }}>
                                    <Text style={{ color: '#000000', fontSize: 12, fontWeight: 'bold' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Route Name</Text>
                                <Text style={styles.value}>{params.routeName}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Departure From</Text>
                                <Text style={styles.value}>{params.from}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Destination To</Text>
                                <Text style={styles.value}>{params.to}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Status</Text>
                                <Text style={[styles.value, { color: '#D4AF37' }]}>Pending Assignment</Text>
                            </View>
                        </View>
                        <View style={[styles.row, { marginBottom: 0 }]}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Departure</Text>
                                <Text style={styles.value}>{params.departure || '--:--'}</Text>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Arrival</Text>
                                <Text style={styles.value}>{params.arrival || '--:--'}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Trip Details Card (Fixed Data) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Trip Details</Text>

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Bus Plate</Text>
                            <Text style={styles.value}>{tripDetails.busNumber}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Assigned Seat</Text>
                            <Text style={styles.value}>{tripDetails.seat}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.col}>
                            <Text style={styles.label}>Route</Text>
                            <Text style={styles.value}>{tripDetails.from} to {tripDetails.to}</Text>
                        </View>
                        <View style={styles.col}>
                            <Text style={styles.label}>Departure</Text>
                            <Text style={styles.value}>{tripDetails.departure}</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBanner, { backgroundColor: tripDetails.status === 'Delayed' ? 'red' : theme.tint }]}>
                        <Text style={styles.statusText}>Current Status: {tripDetails.status}</Text>
                    </View>
                </View>

                {/* Route Timetable */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Route Timetable</Text>
                    <FlatList
                        data={stops}
                        keyExtractor={(item) => item.id}
                        renderItem={renderStop}
                        scrollEnabled={false}
                    />
                </View>

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
    scrollContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    cardTitle: {
        color: '#D4AF37',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
        paddingBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    col: {
        flex: 1,
    },
    label: {
        color: '#666666',
        fontSize: 12,
    },
    value: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    statusBanner: {
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    statusText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    stopItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    timeline: {
        width: 30,
        alignItems: 'center',
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        zIndex: 2,
    },
    line: {
        width: 2,
        height: 40,
        position: 'absolute',
        top: 14,
        zIndex: 1,
    },
    stopContent: {
        flex: 1,
        paddingBottom: 25,
        paddingLeft: 10,
    },
    stopName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    badge: {
        fontSize: 12,
        color: '#666666',
        fontWeight: 'normal',
    },
    stopTime: {
        color: '#000000',
        marginTop: 4,
        fontSize: 14,
    },
    onTime: {
        color: '#D4AF37', // Yellow
        fontWeight: 'bold',
    },
    departed: {
        color: '#888',
    },
});
