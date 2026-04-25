import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Image,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "../services/api";
import * as ImagePicker from "expo-image-picker";

export default function SupplierList() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  const [addForm, setAddForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    status: "active"
  });

  /* ================= FETCH SUPPLIERS ================= */

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/suppliers");
      setSuppliers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERED LIST ================= */

  const displaySuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : supplier.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeSuppliersCount = suppliers.filter(
    s => s.status === "active"
  ).length;

  /* ================= ADD SUPPLIER ================= */

  const handleAddChange = (field, value) => {
    setAddForm({ ...addForm, [field]: value });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const submitNewSupplier = async () => {
    try {
      setIsSubmitting(true);
      await api.post("/api/suppliers", {
        ...addForm,
        profilePic
      });

      setIsAddModalVisible(false);
      setAddForm({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        status: "active"
      });
      setProfilePic(null);
      fetchSuppliers();
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= SUPPLIER CARD ================= */

  const renderSupplierCard = supplier => {
    const isActive = supplier.status === "active";

    return (
      <TouchableOpacity
        key={supplier._id}
        style={[styles.card, isDesktop && styles.cardDesktop]}
        onPress={() => router.push(`/supplier-details?id=${supplier._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.iconWrapper}>
            {supplier.profilePic ? (
              <Image source={{ uri: supplier.profilePic }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {supplier.name?.charAt(0)?.toUpperCase()}
              </Text>
            )}
          </View>

          <View style={styles.info}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.title}>{supplier.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isActive
                      ? "rgba(31,170,89,0.25)"
                      : "rgba(211,47,47,0.25)"
                  }
                ]}
              >
                <Text
                  style={{
                    color: isActive ? "#1faa59" : "#ff4d4d",
                    fontSize: 10,
                    fontWeight: "bold"
                  }}
                >
                  {supplier.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.subText}>{supplier.companyName}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              router.push(`/performance?supplierId=${supplier._id}`)
            }
          >
            <Ionicons name="analytics" size={18} color="#f3be0f" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f3be0f" />
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.wrapper}>

          <Text style={styles.header}>Supplier Management</Text>
          <Text style={styles.subtitle}>
            Manage and monitor registered transport suppliers
          </Text>

          {/* KPI */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiDark}>
              <Text style={styles.kpiLabel}>TOTAL SUPPLIERS</Text>
              <Text style={styles.kpiValue}>{suppliers.length}</Text>
            </View>
            <View style={styles.kpiLight}>
              <Text style={[styles.kpiLabel, { color: "#000" }]}>ACTIVE NOW</Text>
              <Text style={styles.kpiValueDark}>{activeSuppliersCount}</Text>
            </View>
          </View>

          {/* ACTION ROW */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setIsAddModalVisible(true)}
            >
              <Ionicons name="person-add" size={18} color="#000" />
              <Text style={styles.primaryBtnText}>Add Supplier</Text>
            </TouchableOpacity>

            <View style={styles.filterGroup}>
              {["ALL", "ACTIVE", "INACTIVE"].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterBtn,
                    statusFilter === type && styles.filterBtnActive
                  ]}
                  onPress={() => setStatusFilter(type)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      statusFilter === type && styles.filterTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color="#777" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search suppliers..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {displaySuppliers.length === 0 ? (
            <Text style={styles.empty}>No suppliers found</Text>
          ) : (
            displaySuppliers.map(renderSupplierCard)
          )}

        </View>
      </ScrollView>

      {/* ADD SUPPLIER MODAL */}
      <Modal visible={isAddModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ padding: 25 }}>
              <Text style={styles.modalTitle}>Register New Supplier</Text>

              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {profilePic ? (
                  <Image
                    source={{ uri: profilePic }}
                    style={styles.profilePreview}
                  />
                ) : (
                  <Ionicons name="camera" size={32} color="#777" />
                )}
              </TouchableOpacity>

              {["name", "companyName", "email", "phone", "address"].map(field => (
                <TextInput
                  key={field}
                  placeholder={field}
                  style={styles.input}
                  placeholderTextColor="#777"
                  value={addForm[field]}
                  onChangeText={v => handleAddChange(field, v)}
                />
              ))}

              <TouchableOpacity
                style={styles.modalSubmit}
                onPress={submitNewSupplier}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.modalSubmitText}>Add Supplier</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  wrapper: { padding: 25, maxWidth: 1100, alignSelf: "center", width: "100%" },

  header: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#888", marginBottom: 25 },

  kpiRow: { flexDirection: "row", marginBottom: 25 },
  kpiDark: { flex: 1, backgroundColor: "#1a1a1a", padding: 20, borderRadius: 12, marginRight: 10 },
  kpiLight: { flex: 1, backgroundColor: "#f3be0f", padding: 20, borderRadius: 12 },
  kpiLabel: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  kpiValue: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  kpiValueDark: { fontSize: 32, fontWeight: "bold", color: "#000" },

  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  primaryBtn: {
    backgroundColor: "#f3be0f",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10
  },
  primaryBtnText: { color: "#000", fontWeight: "bold", marginLeft: 6 },

  filterGroup: { flexDirection: "row", marginRight: 10 },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#262626",
    borderRadius: 6,
    marginRight: 5
  },
  filterBtnActive: { backgroundColor: "#f3be0f" },
  filterText: { color: "#aaa", fontSize: 12, fontWeight: "bold" },
  filterTextActive: { color: "#000" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1
  },
  searchInput: { color: "#fff", marginLeft: 8, flex: 1 },

  card: {
    backgroundColor: "#1a1a1a",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardDesktop: { paddingHorizontal: 30 },

  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(243,190,15,0.15)",
    justifyContent: "center",
    alignItems: "center"
  },
  avatar: { width: "100%", height: "100%", borderRadius: 12 },
  avatarText: { color: "#f3be0f", fontWeight: "bold", fontSize: 18 },

  info: { marginLeft: 15 },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  subText: { color: "#aaa", marginTop: 4 },

  statusBadge: {
    marginLeft: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },

  cardRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    backgroundColor: "#262626",
    padding: 8,
    borderRadius: 6,
    marginRight: 8
  },

  empty: { color: "#777", textAlign: "center", marginTop: 40 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#0f0f0f",
    borderRadius: 12
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 15 },

  imagePicker: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 15
  },
  profilePreview: { width: "100%", height: "100%", borderRadius: 45 },

  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    color: "#fff",
    padding: 12,
    marginBottom: 10
  },

  modalSubmit: {
    backgroundColor: "#f3be0f",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center"
  },
  modalSubmitText: { color: "#000", fontWeight: "bold" },
  cancel: { color: "#f44336", textAlign: "center", marginTop: 15 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});