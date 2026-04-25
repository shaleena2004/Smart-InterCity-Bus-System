import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    useWindowDimensions,
    ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import api from "../services/api";

export default function AddBus() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768; // Desktop view එක detect කරනවා

    const [form, setForm] = useState({
        busNumber: "",
        plateNumber: "",
        busType: "Non-AC", // Default එකක් දුන්නා
        seatCount: "",
        supplierId: "",
    });

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get("/api/suppliers")
            .then((res) => {
                setSuppliers(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.log("Error loading suppliers", err);
                setLoading(false);
            });
    }, []);

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const submit = () => {
        // Validation
        if (!form.busNumber || !form.plateNumber || !form.seatCount || !form.supplierId) {
            alert("Please fill in all required fields.");
            return;
        }

        // Data Formatting
        const payload = {
            ...form,
            seatCount: Number(form.seatCount) // Seat Count එක Number එකක් බව තහවුරු කරනවා
        };

        setIsSubmitting(true);

        api.post("/api/buses", payload)
            .then(() => {
                setIsSubmitting(false);
                alert("Bus added successfully");
                router.replace("/bus-list");
            })
            .catch((err) => {
                setIsSubmitting(false);
                console.log(err.response?.data || err.message);
                alert(`Error adding bus: ${err.response?.data?.message || 'Check your details and try again.'}`);
            });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#f3be0f" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>

                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#f3be0f" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add New Bus</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.formCard}>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={24} color="#f3be0f" />
                            <Text style={styles.infoText}>
                                Enter the bus details accurately. Make sure the Vehicle Plate Number is unique.
                            </Text>
                        </View>

                        {/* Bus Fleet Number */}
                        <Text style={styles.label}>1. Bus Fleet Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="bus" size={20} color="#777" style={styles.inputIcon} />
                            <TextInput
                                placeholder="e.g. B-001"
                                placeholderTextColor="#555"
                                style={styles.input}
                                value={form.busNumber}
                                onChangeText={(v) => handleChange("busNumber", v)}
                            />
                        </View>

                        {/* Plate Number */}
                        <Text style={styles.label}>2. Vehicle Plate Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="barcode" size={20} color="#777" style={styles.inputIcon} />
                            <TextInput
                                placeholder="e.g. NA-1234"
                                placeholderTextColor="#555"
                                style={styles.input}
                                value={form.plateNumber}
                                onChangeText={(v) => handleChange("plateNumber", v)}
                            />
                        </View>

                        {/* Bus Type Dropdown */}
                        <Text style={styles.label}>3. Air Conditioning Type</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={form.busType}
                                onValueChange={(itemValue) => handleChange("busType", itemValue)}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                <Picker.Item label="Non-AC" value="Non-AC" color="#000" />
                                <Picker.Item label="AC" value="AC" color="#000" />
                            </Picker>
                        </View>

                        {/* Seat Count */}
                        <Text style={styles.label}>4. Total Seating Capacity</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="people" size={20} color="#777" style={styles.inputIcon} />
                            <TextInput
                                placeholder="e.g. 54"
                                placeholderTextColor="#555"
                                style={styles.input}
                                keyboardType="numeric" // Keyboard එක numeric pad එකක් කරනවා
                                value={form.seatCount}
                                onChangeText={(v) => handleChange("seatCount", v.replace(/[^0-9]/g, ''))} // ඉලක්කම් විතරක් type වෙන්න සලස්වනවා
                            />
                        </View>

                        {/* Supplier Dropdown */}
                        <Text style={styles.label}>5. Assign to Supplier</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={form.supplierId}
                                onValueChange={(itemValue) => handleChange("supplierId", itemValue)}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                <Picker.Item label="-- Select a Supplier --" value="" color="#000" />
                                {suppliers.map((sup) => (
                                    <Picker.Item
                                        key={sup._id}
                                        label={sup.companyName || sup.name}
                                        value={sup._id}
                                        color="#000"
                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={submit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <Ionicons name="add-circle" size={22} color="#000" style={{ marginRight: 10 }} />
                                    <Text style={styles.submitBtnText}>Add Bus</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#0f0f0f",
        flex: 1,
        alignItems: 'center',
    },
    scrollContent: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 50,
    },
    contentWrapper: {
        width: '100%',
        padding: 25,
    },
    contentWrapperDesktop: {
        maxWidth: 800, // Desktop එකේ Center වෙලා පේන්න
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 10,
    },
    backBtn: {
        backgroundColor: 'rgba(243, 190, 15, 0.1)',
        padding: 10,
        borderRadius: 10,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    formCard: {
        backgroundColor: "#1a1a1a",
        padding: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#292929",
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(243, 190, 15, 0.1)',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(243, 190, 15, 0.3)',
        alignItems: 'center',
        marginBottom: 30,
    },
    infoText: {
        color: '#f3be0f',
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 15,
        flex: 1,
    },
    label: {
        color: "#aaa",
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#262626",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#333",
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 25,
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        color: "#fff",
        fontSize: 16,
        flex: 1,
        height: '100%',
        outlineStyle: 'none',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        backgroundColor: '#262626',
        marginBottom: 25,
        overflow: 'hidden',
    },
    picker: {
        color: '#fff',
        backgroundColor: '#262626',
        height: 55,
        borderWidth: 0,
        outlineStyle: 'none',
        paddingHorizontal: 10,
    },
    submitBtn: {
        backgroundColor: '#f3be0f',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 10,
        marginTop: 10,
    },
    submitBtnText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    }
});