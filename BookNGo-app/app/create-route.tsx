import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { mockSchedules, API_URL } from './globalStore';

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
    const [selectedDate, setSelectedDate] = useState((params.date as string) || new Date().toISOString().split('T')[0]);
    const [busNumber, setBusNumber] = useState((params.busNumber as string) || '');
    const [status, setStatus] = useState((params.status as string) || 'On Time');
    const [showCalendar, setShowCalendar] = useState(false);


    
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

    const handleCreateRoute = async () => {
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
        const existingRoutes = mockSchedules.map(s => s.route.toLowerCase());
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

        // Time parsing helper
        const parseTime = (timeStr: string) => {
            const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
            if (!match) return null;

            let h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            const period = match[3] ? match[3].toLowerCase() : null;

            if (isNaN(h) || isNaN(m) || m > 59) return null;

            if (period) {
                if (h > 12 || h < 1) return null;
                if (period === 'pm' && h !== 12) h += 12;
                else if (period === 'am' && h === 12) h = 0;
            } else {
                if (h > 23 || h < 0) return null;
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
            if (Platform.OS === 'web') window.alert("Please enter valid times (e.g. 08:30 AM).");
            else Alert.alert("Invalid Time", "Please enter valid times (e.g. 08:30 AM).");
            return;
        }

        if (depDate >= arrDate) {
            arrDate.setDate(arrDate.getDate() + 1);
        }

        setErrors({});

        // --- Save to Backend (MongoDB Atlas) ---
        try {
            const routeData = {
                routeName,
                startLocation,
                endLocation,
                distance,
                departureTime,
                arrivalTime,
                date: selectedDate,
                busNumber,
                status,
                stops: stops.map(s => ({ name: s.name, time: s.time }))
            };

            const url = isUpdate ? `${API_URL}/routes/${params.id}` : `${API_URL}/routes`;
            const method = isUpdate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(routeData),
            });

            if (!response.ok) throw new Error('Failed to save to database');
            
            const savedRoute = await response.json();
            console.log('Successfully saved to Atlas:', savedRoute);

            // Also update local mock for immediate UI feedback
            const newSchedule = {
                id: savedRoute._id,
                route: `${startLocation.trim()} - ${endLocation.trim()}`,
                bus: busNumber || 'N/A',
                date: selectedDate,
                scheduledDep: departureTime,
                scheduledArr: arrivalTime,
                actualDep: status === 'Delayed' ? '--' : departureTime,
                status: status
            };

            if (isUpdate) {
                const index = mockSchedules.findIndex(s => s.id === params.id);
                if (index !== -1) mockSchedules[index] = newSchedule;
            } else {
                mockSchedules.unshift(newSchedule);
            }

            const successMsg = isUpdate ? 'Schedule Updated Successfully!' : 'Schedule Created Successfully!';
            if (Platform.OS === 'web') window.alert(successMsg);
            else Alert.alert("Success", successMsg);

            router.push({ pathname: '/schedule' });

        } catch (error) {
            console.error('Database Error:', error);
            if (Platform.OS === 'web') window.alert("Could not connect to backend. Please check if server is running.");
            else Alert.alert("Error", "Could not connect to database.");
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
                        <Text style={styles.label}>Departure Date *</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }, errors.selectedDate && styles.errorInput]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#999"
                                value={selectedDate}
                                onChangeText={(val) => { setSelectedDate(val); setErrors({...errors, selectedDate: false}) }}
                            />
                            <TouchableOpacity 
                                style={[styles.input, { width: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.tint }]}
                                onPress={() => setShowCalendar(true)}
                            >
                                <IconSymbol name="calendar" size={20} color="#000" />
                            </TouchableOpacity>
                        </View>
                    </View>


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


            {/* Calendar Modal */}
            <Modal visible={showCalendar} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarCard}>
                        <Text style={styles.calendarTitle}>Select Departure Date</Text>
                        <View style={styles.calendarGrid}>
                            {Array.from({ length: 30 }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `2026-04-${day < 10 ? '0' + day : day}`;
                                const isSelected = selectedDate === dateStr;
                                return (
                                    <TouchableOpacity 
                                        key={i} 
                                        style={[styles.calendarDay, isSelected && { backgroundColor: theme.tint }]}
                                        onPress={() => { setSelectedDate(dateStr); setShowCalendar(false); }}
                                    >
                                        <Text style={[styles.calendarDayText, isSelected && { color: '#000', fontWeight: 'bold' }]}>{day}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#FFFFFF',
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxWidth: 350,
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#D4AF37',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    calendarDay: {
        width: '14%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 5,
    },
    calendarDayText: {
        fontSize: 14,
        color: '#333',
    },
    closeBtn: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        alignItems: 'center',
    },
    closeBtnText: {
        fontWeight: 'bold',
        color: '#666',
    }
});

