import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../services/api";

export default function EditSupplier() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`/api/suppliers/${id}`).then((res) => setForm(res.data));
  }, []);

  if (!form) return <Text style={{ color: "#fff" }}>Loading...</Text>;

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const submit = () => {
    api
      .put(`/api/suppliers/${id}`, form)
      .then(() => {
        alert("Supplier updated!");
        router.replace(`/supplier-details?id=${id}`);
      })
      .catch(() => alert("Error updating supplier"));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Supplier</Text>

      <View style={styles.formCard}>
        <View style={styles.inputBox}>
          <Ionicons name="person" size={22} color="#f3be0f" />
          <TextInput
            value={form.name}
            placeholder="Supplier Name"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => handleChange("name", v)}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="business" size={22} color="#f3be0f" />
          <TextInput
            value={form.companyName}
            placeholder="Company Name"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => handleChange("companyName", v)}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="mail" size={22} color="#f3be0f" />
          <TextInput
            value={form.email}
            placeholder="Email"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => handleChange("email", v)}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="call" size={22} color="#f3be0f" />
          <TextInput
            value={form.phone}
            placeholder="Phone"
            placeholderTextColor="#777"
            style={styles.input}
            onChangeText={(v) => handleChange("phone", v)}
          />
        </View>

        <View style={[styles.inputBox, { height: 100, alignItems: "flex-start" }]}>
          <Ionicons name="location" size={22} color="#f3be0f" style={{ marginTop: 10 }} />
          <TextInput
            value={form.address}
            placeholder="Address"
            placeholderTextColor="#777"
            multiline
            style={[styles.input, { height: "100%" }]}
            onChangeText={(v) => handleChange("address", v)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Update Supplier</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 20 },
  header: { color: "#fff", fontSize: 25, fontWeight: "bold", marginBottom: 20 },
  formCard: {
    backgroundColor: "#1b1b1b",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
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
  button: {
    backgroundColor: "#f3be0f",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { textAlign: "center", fontWeight: "bold", fontSize: 16 },
});