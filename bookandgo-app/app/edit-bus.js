import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";

export default function EditBus() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [bus, setBus] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    api.get(`/api/buses/${id}`).then((res) => setBus(res.data));
    api.get("/api/suppliers").then((res) => setSuppliers(res.data));
  }, []);

  if (!bus)
    return <Text style={{ color: "#fff", padding: 20 }}>Loading...</Text>;

  const updateField = (key, value) => {
    setBus({ ...bus, [key]: value });
  };

  const submit = () => {
    api
      .put(`/api/buses/${id}`, bus)
      .then(() => {
        alert("Bus updated successfully!");
        router.replace(`/bus-details/${id}`);
      })
      .catch(() => alert("Error updating bus"));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Bus</Text>

      <View style={styles.formCard}>
        {/* Bus Number */}
        <View style={styles.inputBox}>
          <Ionicons name="bus" size={22} color="#f3be0f" />
          <TextInput
            value={bus.busNumber}
            placeholder="Bus Number"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => updateField("busNumber", v)}
          />
        </View>

        {/* Plate Number */}
        <View style={styles.inputBox}>
          <Ionicons name="barcode" size={22} color="#f3be0f" />
          <TextInput
            value={bus.plateNumber}
            placeholder="Plate Number"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => updateField("plateNumber", v)}
          />
        </View>

        {/* Bus Type */}
        <View style={styles.inputBox}>
          <Ionicons name="settings" size={22} color="#f3be0f" />
          <TextInput
            value={bus.busType}
            placeholder="Bus Type (AC / Non-AC / Luxury)"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => updateField("busType", v)}
          />
        </View>

        {/* Seat Count */}
        <View style={styles.inputBox}>
          <Ionicons name="people" size={22} color="#f3be0f" />
          <TextInput
            value={bus.seatCount.toString()}
            placeholder="Seat Count"
            placeholderTextColor="#777"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(v) => updateField("seatCount", v)}
          />
        </View>

        {/* Supplier Dropdown */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {suppliers.find((s) => s._id === bus.supplierId)?.name ||
              "Select Supplier"}
          </Text>
          <Ionicons name="chevron-down" size={22} color="#fff" />
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownList}>
            {suppliers.map((sup) => (
              <TouchableOpacity
                key={sup._id}
                style={styles.dropdownItem}
                onPress={() => {
                  updateField("supplierId", sup._id);
                  setShowDropdown(false);
                }}
              >
                <Text style={{ color: "#fff" }}>{sup.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Update Bus</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 20 },
  header: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#1b1b1b",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: { color: "#fff", marginLeft: 10, flex: 1 },
  dropdown: {
    backgroundColor: "#262626",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdownText: { color: "#fff", fontSize: 16 },
  dropdownList: {
    backgroundColor: "#333",
    borderRadius: 10,
    marginBottom: 15,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  button: {
    backgroundColor: "#f3be0f",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 17,
  },
});