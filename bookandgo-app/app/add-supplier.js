import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    useWindowDimensions,
    SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

export default function AddSupplier() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768; // Desktop තිරයක්දැයි පරීක්ෂා කිරීම

    // ඔයාගේ පරණ state එකට vehicleCount එකතු කළා
    const [form, setForm] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        vehicleCount: "",
    });

    // පින්තූරය සහ loading තත්වය සඳහා අලුත් states
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    // පින්තූරය තෝරාගන්නා function එක
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfilePic(result.assets[0].uri);
        }
    };

    // ඔයාගේ submit logic එකමයි, පින්තූරය විතරක් ඇතුලත් කරලා තියෙනවා
    const submit = () => {
        setLoading(true);
        const submitData = {
            ...form,
            profilePic: profilePic // පින්තූරය API එකට යවන්න
        };

        api
            .post("/api/suppliers", submitData)
            .then(() => {
                setLoading(false);
                alert("Supplier Added Successfully!");
                router.replace("/supplier-list");
            })
            .catch(() => {
                setLoading(false);
                alert("Error adding supplier");
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.contentWrapper}>

                    {/* Header Section */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#f3be0f" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.header}>Register New Supplier</Text>
                            <Text style={styles.subHeader}>Add a new third-party fleet provider to the system</Text>
                        </View>
                    </View>

                    <View style={styles.formContainer}>

                        {/* Profile Picture Upload Area */}
                        <View style={styles.photoUploadSection}>
                            <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
                                {profilePic ? (
                                    <Image source={{ uri: profilePic }} style={styles.profileImagePreview} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera" size={36} color="#777" />
                                        <Text style={styles.uploadText}>Upload Logo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {profilePic && (
                                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setProfilePic(null)}>
                                    <Text style={styles.removePhotoText}>Remove Image</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Row 1: Name & Company (Desktop වලදී කොටු දෙකකට බෙදේ) */}
                        <View style={[styles.formRow, isDesktop && { flexDirection: "row", justifyContent: "space-between" }]}>
                            {/* Supplier Name */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Supplier Name</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="person" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. Nisal Fernando"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        onChangeText={(v) => handleChange("name", v)}
                                    />
                                </View>
                            </View>

                            {/* Company Name */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>Company Name</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="business" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. Nisal Transport Services"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        onChangeText={(v) => handleChange("companyName", v)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Row 2: Email & Phone */}
                        <View style={[styles.formRow, isDesktop && { flexDirection: "row", justifyContent: "space-between" }]}>
                            {/* Email */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="mail" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. nisal@gmail.com"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        keyboardType="email-address"
                                        onChangeText={(v) => handleChange("email", v)}
                                    />
                                </View>
                            </View>

                            {/* Phone */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="call" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. 0778956782"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        onChangeText={(v) => handleChange("phone", v)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Row 3: Address & Vehicle Count */}
                        <View style={[styles.formRow, isDesktop && { flexDirection: "row", justifyContent: "space-between" }]}>
                            {/* Address */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 2, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Address</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="location" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. Nisal Uyana, Colombo"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        onChangeText={(v) => handleChange("address", v)}
                                    />
                                </View>
                            </View>

                            {/* Vehicle Count */}
                            <View style={[styles.inputGroup, isDesktop && { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>Initial Vehicle Count</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="bus" size={20} color="#f3be0f" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="e.g. 5"
                                        placeholderTextColor="#777"
                                        style={styles.input}
                                        keyboardType="numeric"
                                        onChangeText={(v) => handleChange("vehicleCount", v)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Add Supplier Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={submit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Register Supplier</Text>
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
    },
    scrollContent: {
        alignItems: 'center', // Content එක මැදට ගන්නවා
        paddingBottom: 50,
    },
    contentWrapper: {
        width: "100%",
        maxWidth: 900, // Desktop එකේදී උපරිම පළල
        padding: 25,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    backBtn: {
        backgroundColor: 'rgba(243, 190, 15, 0.1)',
        padding: 10,
        borderRadius: 10,
        marginRight: 20,
    },
    header: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
    subHeader: {
        color: "#888",
        fontSize: 14,
        marginTop: 4,
    },
    formContainer: {
        backgroundColor: "#1b1b1b",
        padding: 35,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#2a2a2a",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    photoUploadSection: {
        alignItems: 'center',
        marginBottom: 35,
    },
    imagePickerBtn: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#262626',
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        color: '#888',
        fontSize: 12,
        marginTop: 8,
        fontWeight: 'bold',
    },
    profileImagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removePhotoBtn: {
        marginTop: 12,
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 77, 77, 0.1)',
        borderRadius: 20,
    },
    removePhotoText: {
        color: '#ff4d4d',
        fontSize: 12,
        fontWeight: 'bold',
    },
    formRow: {
        marginBottom: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        color: '#aaa',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
        marginLeft: 5,
        letterSpacing: 0.5,
    },
    inputBox: {
        flexDirection: "row",
        backgroundColor: "#262626",
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 55,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#333",
    },
    inputIcon: {
        marginRight: 15
    },
    input: {
        color: "#fff",
        fontSize: 15,
        flex: 1,
        height: '100%',
    },
    button: {
        backgroundColor: "#f3be0f",
        height: 55,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    buttonText: {
        color: "#000",
        fontSize: 17,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
});