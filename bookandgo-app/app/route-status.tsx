import RouteStatusMap from '@/components/RouteStatusMap';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
export default function RouteStatusScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Dummy data for all company buses
    const buses = [
        { id: '1', route: 'Colombo - Kandy', lat: 6.9271, lng: 79.8612, title: 'Bus ND-1234' },
        { id: '2', route: 'Colombo - Galle', lat: 6.0535, lng: 80.2210, title: 'Bus ND-5678' },
        { id: '3', route: 'Kandy - Kurunegala', lat: 7.2906, lng: 80.6337, title: 'Bus NW-9012' },
        { id: '4', route: 'Jaffna - Colombo', lat: 9.6615, lng: 80.0255, title: 'Bus NP-3456' }
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Route Status Report', headerStyle: { backgroundColor: theme.tint }, headerTintColor: '#000000' }} />
            <RouteStatusMap buses={buses} theme={theme} colorScheme={colorScheme} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});
