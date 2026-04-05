import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { mockSchedules } from './globalStore';

export default function CreateRouteScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const isUpdate = params.isUpdate === 'yes';

    const [routeName, setRouteName] = useState((params.routeName as string) || '');
    const [startLocation, setStartLocation] = useState((params.from as string) || '');
    const [endLocation, setEndLocation] = useState((params.to as string) || '');
    const [distance, setDistance] = useState((params.distance as string) || '');
    const [departureTime, setDepartureTime] = useState((params.departure as string) || '');
    const [arrivalTime, setArrivalTime] = useState((params.arrival as string) || '');
    const [busNumber, setBusNumber] = useState((params.busNumber as string) || '');
    const [status, setStatus] = useState((params.status as string) || 'On Time');
    
    // Dynamic Stops array
    const defaultStops = params.stops ? JSON.parse(params.stops as string) : [];
    const [stops, setStops] = useState<{id: string, name: string, time: string}[]>(defaultStops);

    const handleAddStop = () => {
        setStops([...stops, { id: Date.now().toString(), name: '', time: '' }]);
    };

    const handleUpdateStop = (id: string, field: 'name' | 'time', value: string) => {
        setStops(stops.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleRemoveStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };
    
    // Error tracking state
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

    const handleCreateRoute = () => {
        let newErrors: { [key: string]: boolean } = {};

        if (!routeName) newErrors.routeName = true;
        if (!startLocation) newErrors.startLocation = true;
        if (!endLocation) newErrors.endLocation = true;
        if (!departureTime) newErrors.departureTime = true;
        if (!arrivalTime) newErrors.arrivalTime = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("Please fill all required fields. Route Name cannot be empty.");
            else Alert.alert("Error", "Please fill all required fields. Route Name cannot be empty.");
            return;
        }

        // String and Number validations
        const isOnlyNumbers = (str: string) => /^\d+$/.test(str.trim());
        
        if (isOnlyNumbers(routeName)) newErrors.routeName = true;
        if (isOnlyNumbers(startLocation)) newErrors.startLocation = true;
        if (isOnlyNumbers(endLocation)) newErrors.endLocation = true;

        if (newErrors.routeName || newErrors.startLocation || newErrors.endLocation) {
            setErrors(newErrors);
            const msg = "Route Name and Locations cannot be just numbers. Letters must be included.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Validation Error", msg);
            return;
        }

        if (distance && !/^\d+(\.\d+)?$/.test(distance.trim())) {
            newErrors.distance = true;
            setErrors(newErrors);
            const msg = "Distance must contain only valid numbers.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Validation Error", msg);
            return;
        }

        // 1. Route validation - Same start and end location
        if (startLocation.trim().toLowerCase() === endLocation.trim().toLowerCase()) {
            newErrors.startLocation = true;
            newErrors.endLocation = true;
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("Start location and End location cannot be the same.");
            else Alert.alert("Validation Error", "Start location and End location cannot be the same.");
            return;
        }

        // 2. Duplicate Route validation (Mock check) - Skip if updating same route
        const existingRoutes = ['colombo - kandy', 'kandy - colombo']; // Existing mock routes
        const currentRouteString = `${startLocation.trim()} - ${endLocation.trim()}`.toLowerCase();
        
        if (!isUpdate && (existingRoutes.includes(currentRouteString) || existingRoutes.includes(routeName.toLowerCase()))) {
            newErrors.routeName = true;
            newErrors.startLocation = true;
            newErrors.endLocation = true;
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("This route already exists. You cannot add duplicate routes.");
            else Alert.alert("Validation Error", "This route already exists. You cannot add duplicate routes.");
            return;
        }

        // Time parsing helper (Supports AM/PM or 24-hour)
        const parseTime = (timeStr: string) => {
            const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
            if (!match) return null;

            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const period = match[3] ? match[3].toLowerCase() : null;

            if (isNaN(h) || isNaN(m) || m > 59) return null;

            if (period) {
                if (h > 12 || h < 1) return null; // 1-12 range for AM/PM
                if (period === 'pm' && h !== 12) h += 12;
                else if (period === 'am' && h === 12) h = 0;
            } else {
                if (h > 23 || h < 0) return null; // 0-23 range for 24-hour
            }
            
            let d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
        };

        const depDate = parseTime(departureTime);
        const arrDate = parseTime(arrivalTime);

        if (!depDate || !arrDate) {
            if (!depDate) newErrors.departureTime = true;
            if (!arrDate) newErrors.arrivalTime = true;
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("Please enter valid times (e.g. 02:30 PM).");
            else Alert.alert("Invalid Time", "Please enter valid times (e.g. 02:30 PM).");
            return;
        }

        // 3. Past time validation
        const now = new Date();
        if (depDate < now) {
            newErrors.departureTime = true;
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("Departure time cannot be in the past.");
            else Alert.alert("Validation Error", "Departure time cannot be in the past.");
            return;
        }

        // 4. Time range validation: Departure < Arrival
        if (depDate >= arrDate) {
            newErrors.arrivalTime = true;
            setErrors(newErrors);
            if (Platform.OS === 'web') window.alert("Arrival time must be strictly after the Departure time.");
            else Alert.alert("Validation Error", "Arrival time must be strictly after the Departure time.");
            return;
        }

        // If everything passes, clear errors
        setErrors({});

        // Save to globalStore mock 
        const dateStr = new Date().toISOString().split('T')[0];
        const newSchedule = {
            id: isUpdate ? (params.id as string || Date.now().toString()) : Date.now().toString(),
            route: `${startLocation.trim()} - ${endLocation.trim()}`,
            bus: busNumber || 'N/A',
            date: dateStr,
            scheduledDep: departureTime,
            actualDep: status === 'Delayed' ? '--' : departureTime,
            status: status
        };

        if (isUpdate) {
            const index = mockSchedules.findIndex(s => s.id === params.id);
            if (index !== -1) mockSchedules[index] = newSchedule;
            else mockSchedules.unshift(newSchedule);
        } else {
            mockSchedules.unshift(newSchedule);
        }

        // Navigate and pass data
        const returnParams = { 
            newRoute: 'yes', 
            routeName, 
            from: startLocation, 
            to: endLocation, 
            departure: departureTime, 
            arrival: arrivalTime, 
            distance,
            stops: JSON.stringify(stops),
            busNumber,
            status,
            id: newSchedule.id
        };

        const successMsg = isUpdate ? 'Schedule Updated Successfully!' : 'Schedule Created Successfully!';

        if (Platform.OS === 'web') {
            window.alert(successMsg);
            router.push({ pathname: '/schedule', params: returnParams });
        } else {
            Alert.alert("Success", successMsg, [
                { text: "OK", onPress: () => router.push({ pathname: '/schedule', params: returnParams }) }
            ]);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ title: isUpdate ? 'Update Schedule' : 'Schedule Route', headerStyle: { backgroundColor: theme.tint }, headerTintColor: '#000000' }} />

            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Route Details</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Route Name *</Text>
                        <TextInput
                            style={[styles.input, errors.routeName && styles.errorInput]}
                            placeholder="e.g. Colombo - Kandy"
                            placeholderTextColor="#999"
                            value={routeName}
                            onChangeText={(val) => { setRouteName(val); setErrors({...errors, routeName: false}) }}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Start Location *</Text>
                        <TextInput
                            style={[styles.input, errors.startLocation && styles.errorInput]}
                            placeholder="e.g. Colombo Fort"
                            placeholderTextColor="#999"
                            value={startLocation}
                            onChangeText={(val) => { setStartLocation(val); setErrors({...errors, startLocation: false}) }}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>End Location *</Text>
                        <TextInput
                            style={[styles.input, errors.endLocation && styles.errorInput]}
                            placeholder="e.g. Kandy Bus Stand"
                            placeholderTextColor="#999"
                            value={endLocation}
                            onChangeText={(val) => { setEndLocation(val); setErrors({...errors, endLocation: false}) }}
                        />
                    </View>
                </View>

                <View style={[styles.card, { marginTop: 15 }]}>
                    <Text style={styles.sectionTitle}>Timing & Schedule</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Departure Time (e.g. 08:30 AM) *</Text>
                        <TextInput
                            style={[styles.input, errors.departureTime && styles.errorInput]}
                            placeholder="e.g. 08:30 AM"
                            placeholderTextColor="#999"
                            value={departureTime}
                            onChangeText={(val) => { setDepartureTime(val); setErrors({...errors, departureTime: false}) }}
                            keyboardType="default"
                        />
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Bus Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. ND-1234"
                            placeholderTextColor="#999"
                            value={busNumber}
                            onChangeText={setBusNumber}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Status</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setStatus('On Time')} style={[styles.input, { flex: 1, backgroundColor: status === 'On Time' ? '#4CAF50' : '#F8F9FA' }]}>
                                <Text style={{ color: status === 'On Time' ? '#FFF' : '#000', textAlign: 'center', fontWeight: 'bold' }}>On Time</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setStatus('Delayed')} style={[styles.input, { flex: 1, backgroundColor: status === 'Delayed' ? '#ff4d4d' : '#F8F9FA' }]}>
                                <Text style={{ color: status === 'Delayed' ? '#FFF' : '#000', textAlign: 'center', fontWeight: 'bold' }}>Delayed</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Arrival Time (e.g. 01:15 PM) *</Text>
                        <TextInput
                            style={[styles.input, errors.arrivalTime && styles.errorInput]}
                            placeholder="e.g. 01:15 PM"
                            placeholderTextColor="#999"
                            value={arrivalTime}
                            onChangeText={(val) => { setArrivalTime(val); setErrors({...errors, arrivalTime: false}) }}
                            keyboardType="numbers-and-punctuation"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Estimated Distance (km)</Text>
                        <TextInput
                            style={[styles.input, errors.distance && styles.errorInput]}
                            placeholder="e.g. 115"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={distance}
                            onChangeText={(val) => { setDistance(val); setErrors({...errors, distance: false}) }}
                        />
                    </View>
                </View>

                <View style={[styles.card, { marginTop: 15 }]}>
                    <Text style={styles.sectionTitle}>Timetable (Intermediate Stops)</Text>
                    {stops.map((stop, index) => (
                        <View key={stop.id} style={{ flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                            <TextInput
                                style={[styles.input, { flex: 2, marginBottom: 0 }]}
                                placeholder="Stop Name"
                                value={stop.name}
                                onChangeText={(val) => handleUpdateStop(stop.id, 'name', val)}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Time"
                                value={stop.time}
                                onChangeText={(val) => handleUpdateStop(stop.id, 'time', val)}
                            />
                            <TouchableOpacity onPress={() => handleRemoveStop(stop.id)} style={{ backgroundColor: '#FF3B30', padding: 10, borderRadius: 8 }}>
                                <Text style={{ color: '#FFF' }}>X</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity onPress={handleAddStop} style={{ backgroundColor: '#E0E0E0', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 }}>
                        <Text style={{ fontWeight: 'bold' }}>+ Add Stop</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.tint }]}
                    onPress={handleCreateRoute}
                >
                    <Text style={styles.submitBtnText}>{isUpdate ? 'Update Schedule' : 'Save Schedule'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E0E0E0'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#D4AF37',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 5,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#666666'
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#000000'
    },
    errorInput: {
        borderColor: '#FF3B30',
        borderWidth: 2,
        backgroundColor: '#FFEBEA'
    },
    submitBtn: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitBtnText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
