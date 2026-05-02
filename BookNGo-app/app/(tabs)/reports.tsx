import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const reports = [
        { id: '1', title: 'Route Status Report', icon: 'location.fill', description: 'View current active routes, delays, and general status.' },
        { id: '2', title: 'Trip Progress Report', icon: 'map.fill', description: 'Monitor how far along active trips are with completion %.' },
        { id: '3', title: 'Schedule Performance', icon: 'chart.bar.fill', description: 'Overall On-Time vs Delayed metrics for past 30 days.' },
        { id: '4', title: 'Bus Route Report', icon: 'bus.fill', description: 'Comprehensive data on interchanges, stops, and times.' },
    ];

    const router = useRouter();

    const handleReportPress = (reportName: string) => {
        if (reportName === 'Route Status Report') {
            router.push('/route-status');
        } else if (reportName === 'Trip Progress Report') {
            router.push('/trip-progress');
        } else if (reportName === 'Schedule Performance') {
            router.push('/schedule-performance');
        } else if (reportName === 'Bus Route Report') {
            router.push('/bus-route-report');
        } else {
            console.log(`Open report: ${reportName}`);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.tint }]}>
                <Text style={styles.headerTitle}>Reporting Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.quickActionCard}>
                    <Text style={styles.cardTitle}>Quick Actions</Text>
                    <TouchableOpacity 
                        style={[styles.createBtn, { backgroundColor: theme.tint }]} 
                        onPress={() => router.push('/create-route')}
                    >
                        <IconSymbol name="plus.circle.fill" size={24} color="#000" />
                        <Text style={styles.createBtnText}>Create New Schedule</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.subtitle, { color: theme.tint, marginTop: 10 }]}>Available Reports</Text>

                {reports.map((report) => (
                    <TouchableOpacity
                        key={report.id}
                        style={[styles.card, { borderColor: theme.tint, borderWidth: 1 }]}
                        onPress={() => handleReportPress(report.title)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.tint }]}>
                            {/* @ts-ignore - using map name to match typical SF Symbols if used */}
                            <IconSymbol name={report.icon as any} size={28} color="#222" />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{report.title}</Text>
                            <Text style={styles.cardDesc}>{report.description}</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={theme.tint} />
                    </TouchableOpacity>
                ))}

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
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        color: '#D4AF37',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardDesc: {
        color: '#666666',
        fontSize: 12,
    },
    quickActionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    createBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 10,
    }
});
