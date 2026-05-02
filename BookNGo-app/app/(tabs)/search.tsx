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
});
