import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { mockSchedules, API_URL } from '../globalStore';


export default function ScheduleScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const params = useLocalSearchParams();
    const router = useRouter();
    const [tick, setTick] = useState(0);

    // Check if there is an incoming newly created route
    const hasNewRoute = params.newRoute === 'yes';
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        setIsCancelled(false);
    }, [params.newRoute, params.routeName]);

    const [dbSchedules, setDbSchedules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/routes`);
            const data = await response.json();
            setDbSchedules(data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchSchedules();
        }, [])
    );

    const combinedSchedules = [...dbSchedules, ...mockSchedules.filter(ms => !dbSchedules.some(ds => ds._id === ms.id))];

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/routes/${id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                setDbSchedules(prev => prev.filter(s => s._id !== id));
                if (Platform.OS === 'web') window.alert("Schedule Deleted Successfully!");
                else Alert.alert("Success", "Schedule Deleted Successfully!");
            } else {
                // If it's a mock schedule, handle it locally
                const index = mockSchedules.findIndex(s => String(s.id) === String(id));
                if (index !== -1) {
                    mockSchedules.splice(index, 1);
                    setTick(t => t + 1);
                    if (Platform.OS === 'web') window.alert("Schedule Deleted!");
                }
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleEdit = (item: any) => {
        router.push({
            pathname: '/create-route',
            params: {
                isUpdate: 'yes',
                id: item._id || item.id,
                routeName: item.routeName || item.route,
                from: item.startLocation || item.route.split(' - ')[0],
                to: item.endLocation || item.route.split(' - ')[1],
                departure: item.departureTime || item.scheduledDep,
                arrival: item.arrivalTime || item.scheduledArr,
                busNumber: item.busNumber || item.bus,
                status: item.status,
                date: item.date,
                stops: JSON.stringify(item.stops || [])
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
                    <Text style={styles.stopTime}>{item.time}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.tint }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 15 }}>
                <View style={{ width: 40 }} />
                <Text style={styles.headerTitle}>Schedule & Route</Text>
                <TouchableOpacity onPress={() => router.push('/create-route')}>
                    <IconSymbol name="plus.circle.fill" size={28} color="#000" />
                </TouchableOpacity>
            </View>
        </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Incoming Created Schedules (Dynamic from creation) */}
                {hasNewRoute && !isCancelled && (
                    <View style={[styles.card, { borderColor: '#4CAF50', borderWidth: 2 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <IconSymbol name="plus.circle.fill" size={20} color="#4CAF50" />
                                <Text style={[styles.cardTitle, { marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0, marginLeft: 8, color: '#4CAF50' }]}>
                                    New Schedule Created
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/create-route')} style={{ backgroundColor: theme.tint, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 5 }}>
                                <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>Add Another</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>This schedule has been added to your upcoming trips below.</Text>
                    </View>
                )}

                {/* Upcoming Trips List */}
                <View style={[styles.card, { marginTop: 0 }]}>
                    <Text style={styles.cardTitle}>Managed Trips & Schedules</Text>
                    {combinedSchedules.length > 0 ? (
                        combinedSchedules.map((item: any) => (
                            <View key={item._id || item.id} style={styles.upcomingItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.upcomingRoute}>{item.routeName || item.route}</Text>
                                    <Text style={styles.upcomingDate}>{item.date} • {item.departureTime || item.scheduledDep}</Text>
                                    <Text style={{ fontSize: 11, color: '#999' }}>Bus: {item.busNumber || item.bus}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 8 }}>

                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                        <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12 }]}>
                                            <IconSymbol name="pencil" size={16} color="#666" />
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={[styles.actionBtn, { backgroundColor: '#FFEBEA', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderColor: '#FF3B30' }]}>
                                            <IconSymbol name="trash.fill" size={16} color="#FF3B30" />
                                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FF3B30' }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>

                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 20 }}>No schedules found.</Text>
                    )}
                </View>


                {/* Route Timetable */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Stops & Timetable</Text>
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
        borderBottomColor: '#E0E0E0',
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
    upcomingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    upcomingRoute: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    upcomingDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    actionBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    }
});


