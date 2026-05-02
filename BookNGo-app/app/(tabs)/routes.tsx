import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { mockSchedules } from '../globalStore';

export default function RoutesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [, setTick] = useState(0);

    // Refresh when focused to show latest schedules
    useFocusEffect(
        useCallback(() => {
            setTick(t => t + 1);
        }, [])
    );

    const handleToggleStatus = (id: string) => {
        const index = mockSchedules.findIndex(s => String(s.id) === String(id));
        if (index !== -1) {
            const currentStatus = mockSchedules[index].isActive;
            mockSchedules[index].isActive = !currentStatus;
            setTick(t => t + 1);
            
            const msg = !currentStatus ? "Route Activated Successfully!" : "Route Deactivated (Soft Deleted)!";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Success", msg);
        }
    };


    const handleEdit = (item: any) => {
        router.push({
            pathname: '/create-route',
            params: {
                isUpdate: 'yes',
                id: item.id,
                routeName: item.route,
                from: item.route.split(' - ')[0],
                to: item.route.split(' - ')[1],
                departure: item.scheduledDep,
                arrival: item.scheduledArr,
                busNumber: item.bus,
                status: item.status,
                date: item.date
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Manage Routes</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.actionRow}>
                    <Text style={[styles.subtitle, { color: theme.tint }]}>Active Routes</Text>
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: theme.tint }]}
                        onPress={() => router.push('/create-route')}
                    >
                        <IconSymbol name="plus" size={16} color="#222" />
                        <Text style={styles.createBtnText}>New Route</Text>
                    </TouchableOpacity>
                </View>

                {mockSchedules.map((route) => (
                    <View key={route.id} style={styles.card}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: route.isActive === false ? 0.6 : 1 }}>
                            <View style={[styles.iconBox, { backgroundColor: route.isActive === false ? '#E0E0E0' : theme.tint + '20' }]}>
                                <IconSymbol name="map.fill" size={20} color={route.isActive === false ? '#888' : theme.tint} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={[styles.routeName, route.isActive === false && { color: '#888' }]}>{route.route}</Text>
                                    <View style={[styles.activeBadge, { backgroundColor: route.isActive === false ? '#F5F5F5' : '#E8F5E9' }]}>
                                        <Text style={[styles.activeBadgeText, { color: route.isActive === false ? '#888' : '#2E7D32' }]}>
                                            {route.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.routeDetail}>Bus: {route.bus} | {route.scheduledDep}</Text>
                            </View>
                        </View>
                        
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            {route.isActive !== false ? (
                                <>
                                    <TouchableOpacity onPress={() => handleEdit(route)} style={[styles.actionBtn, { borderColor: '#007AFF' }]}>
                                        <IconSymbol name="pencil" size={18} color="#007AFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleToggleStatus(route.id)} style={[styles.actionBtn, { backgroundColor: '#FFF5F5', borderColor: '#FF3B30' }]}>
                                        <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity onPress={() => handleToggleStatus(route.id)} style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                                    <IconSymbol name="plus" size={18} color="#4CAF50" />
                                    <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: 'bold', marginLeft: 4 }}>ACTIVATE</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}


                {mockSchedules.length === 0 && (
                    <View style={styles.emptyState}>
                        <IconSymbol name="bus.fill" size={60} color="#E0E0E0" />
                        <Text style={styles.emptyText}>No active routes found. Click 'New Route' to start.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 5,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        elevation: 2,
    },
    createBtnText: {
        color: '#000000',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    iconBox: {
        padding: 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    routeDetail: {
        fontSize: 12,
        color: '#777',
        marginTop: 2,
    },
    actionBtn: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    activeBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    activeBadgeText: {
        fontSize: 10,
        color: '#2E7D32',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

