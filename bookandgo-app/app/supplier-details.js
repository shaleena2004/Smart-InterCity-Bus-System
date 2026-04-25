import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  SafeAreaView
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";

export default function SupplierDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/api/suppliers/${id}`)
        .then((res) => {
          setSupplier(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const handleToggleStatus = () => {
    const newStatus = supplier.status === "active" ? "inactive" : "active";
    api.put(`/api/suppliers/${id}`, { ...supplier, status: newStatus })
      .then(() => {
        setSupplier({ ...supplier, status: newStatus });
        alert(`Supplier marked as ${newStatus.toUpperCase()}`);
      })
      .catch(() => alert("Failed to update status"));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      api.delete(`/api/suppliers/${id}`)
        .then(() => {
          alert("Supplier deleted successfully");
          router.replace("/supplier-list");
        })
        .catch(() => alert("Failed to delete supplier"));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f3be0f" />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#fff" }}>Supplier not found</Text>
      </View>
    );
  }

  const isActive = supplier.status === "active";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#f3be0f" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Supplier Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.headerCard}>
            <View style={styles.profileImageContainer}>
              {supplier.profilePic ? (
                <Image
                  source={{ uri: supplier.profilePic }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.logoText}>
                  {supplier.name?.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <Text style={styles.name}>{supplier.name}</Text>
            <Text style={styles.sub}>{supplier.companyName}</Text>

            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusActive : styles.statusInactive
              ]}
            >
              <Text style={styles.statusText}>
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Text>
            </View>
          </View>

          {/* Supplier Information */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Supplier Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{supplier.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{supplier.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{supplier.address}</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Supplier ID:</Text>
              <Text style={[styles.value, { color: "#888", fontSize: 13 }]}>
                {supplier._id}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => router.push(`/edit-supplier?id=${supplier._id}`)}
            >
              <Ionicons name="create" size={20} color="#000" style={styles.btnIcon} />
              <Text style={styles.buttonPrimaryText}>Edit Supplier</Text>
            </TouchableOpacity>
          </View>

          {/* System Actions */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>System Actions</Text>

            <TouchableOpacity style={styles.systemBtn} onPress={handleToggleStatus}>
              <Ionicons
                name={isActive ? "pause-circle" : "play-circle"}
                size={20}
                color="#fff"
                style={styles.btnIcon}
              />
              <Text style={styles.systemBtnText}>
                {isActive ? "Deactivate Supplier" : "Set as Active"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4d" style={styles.btnIcon} />
              <Text style={styles.deleteBtnText}>Delete Supplier</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 60, alignItems: "center" },
  contentWrapper: { width: "100%", maxWidth: 900, padding: 25 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  backBtn: {
    backgroundColor: "rgba(243,190,15,0.1)",
    padding: 8,
    borderRadius: 10,
    marginRight: 15
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  headerCard: {
    backgroundColor: "#1a1a1a",
    padding: 35,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#292929"
  },

  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(243,190,15,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#f3be0f",
    overflow: "hidden"
  },
  profileImage: { width: "100%", height: "100%", resizeMode: "cover" },
  logoText: { color: "#f3be0f", fontSize: 36, fontWeight: "bold" },

  name: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  sub: { color: "#aaa", fontSize: 15, marginBottom: 15 },

  statusBadge: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 20 },
  statusActive: { backgroundColor: "rgba(31,170,89,0.2)" },
  statusInactive: { backgroundColor: "rgba(211,47,47,0.2)" },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  infoCard: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#292929",
    marginBottom: 25
  },
  infoTitle: { color: "#f3be0f", fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  label: { color: "#aaa", flex: 1 },
  value: { color: "#fff", fontWeight: "bold", flex: 2, textAlign: "right" },

  actionsGrid: { marginBottom: 20 },
  buttonPrimary: {
    backgroundColor: "#f3be0f",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  buttonPrimaryText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  btnIcon: { marginRight: 10 },

  dangerZone: {
    backgroundColor: "rgba(255,77,77,0.03)",
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.15)"
  },
  dangerTitle: { color: "#ff4d4d", fontWeight: "bold", marginBottom: 15 },
  systemBtn: {
    backgroundColor: "#262626",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  systemBtnText: { color: "#fff", fontWeight: "bold" },
  deleteBtn: {
    backgroundColor: "rgba(255,77,77,0.1)",
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  deleteBtnText: { color: "#ff4d4d", fontWeight: "bold" }
});
