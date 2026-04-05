import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoutesScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const currentRoutes = [
        { id: '1', name: 'Colombo - Kandy', distance: '115 km', duration: '3h 30m' },
        { id: '2', name: 'Colombo - Galle', distance: '120 km', duration: '2h 15m' },
    ];

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

                {currentRoutes.map((route) => (
                    <View key={route.id} style={[styles.card, { borderColor: theme.tint, borderWidth: 1 }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="map.fill" size={24} color={theme.tint} />
                            <Text style={styles.routeName}>{route.name}</Text>
                        </View>
                        <Text style={styles.routeDetail}>Distance: {route.distance} | Avg. Time: {route.duration}</Text>
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
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createBtnText: {
        color: '#000000',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    routeName: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    routeDetail: {
        color: '#666666',
        fontSize: 14,
        marginLeft: 34,
    }
});
