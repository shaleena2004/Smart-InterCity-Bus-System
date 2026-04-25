import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ReportsHome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reports</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/reports/supplier-report")}
      >
        <Ionicons name="people" size={32} color="#f3be0f" />
        <Text style={styles.cardText}>Supplier Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/reports/bus-report")}
      >
        <Ionicons name="bus" size={32} color="#f3be0f" />
        <Text style={styles.cardText}>Bus Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#0f0f0f", flex: 1, padding: 20 },
  header: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    borderColor: "#292929",
    borderWidth: 1,
    alignItems: "center",
  },
  cardText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    fontWeight: "bold",
  },
});