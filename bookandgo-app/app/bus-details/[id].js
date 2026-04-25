import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../services/api";
import { useEffect, useState } from "react";

export default function BusDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/buses/${id}`)
      .then(res => {
        setBus(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <Text style={styles.text}>Loading...</Text>;
  }

  if (!bus) {
    return <Text style={styles.text}>Bus not found</Text>;
  }

  const isActive = bus.status === "active";

  const toggleBusStatus = () => {
    const newStatus = isActive ? "inactive" : "active";
    api.put(`/api/buses/${bus._id}`, { ...bus, status: newStatus })
      .then(() => {
        setBus({ ...bus, status: newStatus });
        alert(`Bus marked as ${newStatus.toUpperCase()}`);
      })
      .catch(() => alert("Failed to update status"));
  };

  const deleteBus = () => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      api.delete(`/api/buses/${bus._id}`)
        .then(() => {
          alert("Bus deleted successfully");
          router.replace("/bus-list");
        })
        .catch(() => alert("Failed to delete bus"));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Ionicons name="bus" size={46} color="#f3be0f" />
        <Text style={styles.busName}>{bus.busNumber}</Text>
        <Text style={styles.subText}>Plate: {bus.plateNumber}</Text>

        <View style={[styles.statusBadge, { backgroundColor: isActive ? "#1faa59" : "#d32f2f" }]}>
          <Text style={styles.statusText}>{bus.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Info label="Bus Number" value={bus.busNumber} />
        <Info label="Plate Number" value={bus.plateNumber} />
        <Info label="Bus Type" value={bus.busType} />
        <Info label="Seat Count" value={bus.seatCount} />
        <Info label="Supplier" value={bus.supplierId?.name || "N/A"} />
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push(`/edit-bus?id=${bus._id}`)}
      >
        <Ionicons name="create" size={20} color="#000" />
        <Text style={styles.editText}>Edit Bus</Text>
      </TouchableOpacity>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>System Actions</Text>

        <TouchableOpacity style={styles.systemBtn} onPress={toggleBusStatus}>
          <Ionicons
            name={isActive ? "pause-circle" : "play-circle"}
            size={20}
            color="#fff"
          />
          <Text style={styles.systemText}>
            {isActive ? "Deactivate Bus" : "Activate Bus"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={deleteBus}>
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
          <Text style={styles.deleteText}>Delete Bus</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const Info = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 20 },
  text: { color: "#fff", padding: 20 },
  headerCard: { backgroundColor: "#1a1a1a", padding: 25, borderRadius: 16, alignItems: "center", marginBottom: 20 },
  busName: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 10 },
  subText: { color: "#aaa", marginBottom: 10 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 18, borderRadius: 20 },
  statusText: { color: "#fff", fontWeight: "bold" },
  infoCard: { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 20, marginBottom: 20 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  label: { color: "#aaa" },
  value: { color: "#fff", fontWeight: "bold" },
  editBtn: { backgroundColor: "#f3be0f", padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  editText: { color: "#000", fontWeight: "bold", marginLeft: 8 },
  dangerZone: { backgroundColor: "rgba(255,77,77,0.05)", padding: 20, borderRadius: 14 },
  dangerTitle: { color: "#ff4d4d", fontWeight: "bold", marginBottom: 12 },
  systemBtn: { backgroundColor: "#262626", padding: 14, borderRadius: 10, flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  systemText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  deleteBtn: { backgroundColor: "rgba(255,77,77,0.15)", padding: 14, borderRadius: 10, flexDirection: "row", justifyContent: "center" },
  deleteText: { color: "#ff4d4d", fontWeight: "bold", marginLeft: 8 },
});