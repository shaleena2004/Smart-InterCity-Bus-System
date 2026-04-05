import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TripProgressScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [searchQuery, setSearchQuery] = useState('');
    const [searched, setSearched] = useState(false);

    // Dummy data for simulated active route
    const currentBus = {
        route: "Colombo - Kandy",
        currentHalt: "Nittambuwa",
        pastHalts: ["Colombo Fort", "Peliyagoda", "Kadawatha"],
        distanceRemaining: "45 km (approx. 1h 20m)",
    };

    const handleSearch = () => {
        if (searchQuery.trim().length > 0) {
            setSearched(true);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: 'Trip Progress Report', headerStyle: { backgroundColor: theme.tint }, headerTintcolor: '#000000' }} />

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

            {searched && (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.card, { borderColor: theme.tint }]}>
                        <Text style={styles.cardTitle}>Live Trip Details</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Route:</Text>
                            <Text style={styles.value}>{currentBus.route}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Currently Halted At:</Text>
                            <Text style={[styles.value, { color: theme.tint, fontSize: 18, fontWeight: 'bold' }]}>{currentBus.currentHalt}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Remaining Distance:</Text>
                            <Text style={[styles.value, { color: '#ff5555' }]}>{currentBus.distanceRemaining}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: theme.tint }]}>Passed Halts</Text>
                    {currentBus.pastHalts.map((halt, index) => (
                        <View key={index} style={styles.haltItem}>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                            <Text style={styles.haltText}>{halt}</Text>
                        </View>
                    ))}
                </ScrollView>
            )}

            {!searched && (
                <View style={styles.emptyState}>
                    <IconSymbol name="bus.fill" size={60} color="#555" />
                    <Text style={styles.emptyStateText}>Search for a route to view its progress.</Text>
                </View>
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
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#555',
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
    }
});
