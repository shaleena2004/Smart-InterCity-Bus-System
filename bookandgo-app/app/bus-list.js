import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";

export default function BusList() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);


  //Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  //Trip Modal
  const [isTripModalVisible, setIsTripModalVisible] = useState(false);
  const [tripStatus, setTripStatus] = useState("on-time");
  const [selectedBus, setSelectedBus] = useState("");
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);
  const [tripSuccess, setTripSuccess] = useState("");


  //Incident Modal
  const [isIncidentModalVisible, setIsIncidentModalVisible] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState("");
  const [selectedIncidentBus, setSelectedIncidentBus] = useState("");
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [incidentSuccess, setIncidentSuccess] = useState("");

  const [errorMsg, setErrorMsg] = useState("");


  //Load Buses
  const loadBuses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/buses");
      setBuses(res.data);

      if (res.data.length > 0) {
        setSelectedBus(res.data[0]._id);
        setSelectedIncidentBus(res.data[0]._id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuses();
  }, []);


  //Add Trip
  const handleAddTrip = async () => {
    setErrorMsg("");
    setTripSuccess("");

    const bus = buses.find(b => b._id === selectedBus);
    if (!bus || !bus.supplierId) {
      setErrorMsg("Please select a valid bus");
      return;
    }

    setIsSubmittingTrip(true);
    try {
      await api.post("/api/performance/trip", {
        supplierId:
          typeof bus.supplierId === "object"
            ? bus.supplierId._id
            : bus.supplierId,
        busId: selectedBus,
        status: tripStatus === "on-time" ? "ON_TIME" : "LATE"
      });

      setTripSuccess("Trip recorded successfully ✅");

      setTimeout(() => {
        setIsTripModalVisible(false);
        setTripSuccess("");
      }, 1200);
    } catch {
      setErrorMsg("Failed to record trip");
    } finally {
      setIsSubmittingTrip(false);
    }
  };


  //Add Incident
  const handleAddIncident = async () => {
    setErrorMsg("");
    setIncidentSuccess("");

    if (!incidentDesc.trim()) {
      setErrorMsg("Please enter incident description");
      return;
    }

    const bus = buses.find(b => b._id === selectedIncidentBus);
    if (!bus || !bus.supplierId) {
      setErrorMsg("Please select a valid bus");
      return;
    }

    setIsSubmittingIncident(true);
    try {
      await api.post("/api/performance/incident", {
        supplierId:
          typeof bus.supplierId === "object"
            ? bus.supplierId._id
            : bus.supplierId,
        busId: selectedIncidentBus,
        description: incidentDesc
      });

      setIncidentSuccess("Incident logged successfully ✅");
      setIncidentDesc("");

      setTimeout(() => {
        setIsIncidentModalVisible(false);
        setIncidentSuccess("");
      }, 1200);
    } catch {
      setErrorMsg("Failed to log incident");
    } finally {
      setIsSubmittingIncident(false);
    }
  };


  //Filtering
  const filteredBuses = buses.filter(bus => {
    const q = searchQuery.toLowerCase();

    const matchSearch =
      bus.busNumber?.toLowerCase().includes(q) ||
      bus.plateNumber?.toLowerCase().includes(q) ||
      bus.supplierId?.companyName?.toLowerCase().includes(q) ||
      bus.supplierId?.name?.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "all" || bus.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const activeCount = buses.filter(b => b.status === "active").length;


  //Render Bus Card
  const renderBus = bus => (
    <TouchableOpacity
      key={bus._id}
      style={[styles.card, isDesktop && styles.cardDesktop]}
      onPress={() => router.push(`/bus-details/${bus._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconWrapper}>
          <Ionicons name="bus" size={26} color="#f3be0f" />
        </View>

        <View style={styles.busInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.busNumber}>{bus.busNumber}</Text>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    bus.status === "active"
                      ? "rgba(31,170,89,0.2)"
                      : "rgba(211,47,47,0.2)"
                }
              ]}
            >
              <Text
                style={{
                  color: bus.status === "active" ? "#1faa59" : "#ff4d4d",
                  fontSize: 10,
                  fontWeight: "bold"
                }}
              >
                {bus.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.subText}>
            Plate: {bus.plateNumber} • Seats: {bus.seatCount}
          </Text>

          {bus.supplierId && (
            <Text style={styles.supplierText}>
              <Ionicons name="business" size={12} />{" "}
              {bus.supplierId.companyName || bus.supplierId.name}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f3be0f" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.contentWrapper}>

          {/* HEADER */}
          <Text style={styles.headerTitle}>Fleet Management</Text>
          <Text style={styles.headerSubtitle}>
            Monitor and manage transport fleet
          </Text>

          {/* KPI */}
          <View style={styles.statsRow}>
            <View style={styles.statCardDark}>
              <Text style={[styles.statLabel, { color: "#fff" }]}>TOTAL FLEET</Text>
              <Text style={styles.statValueDark}>{buses.length}</Text>
            </View>
            <View style={styles.statCardLight}>
              <Text style={[styles.statLabel, { color: "#000" }]}>ACTIVE NOW</Text>
              <Text style={styles.statValueLight}>{activeCount}</Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#ff9800" }]}
              onPress={() => setIsIncidentModalVisible(true)}
            >
              <Ionicons name="warning" size={18} color="#ff9800" />
              <Text style={[styles.actionBtnText, { color: "#ff9800" }]}>Log Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: "#f3be0f" }]}
              onPress={() => setIsTripModalVisible(true)}
            >
              <Ionicons name="time" size={18} color="#f3be0f" />
              <Text style={styles.actionBtnText}>Log Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#f3be0f" }]}
              onPress={() => router.push("/add-bus")}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={[styles.actionBtnText, { color: "#000" }]}>Add Bus</Text>
            </TouchableOpacity>
          </View>

          {/* FILTER & SEARCH */}
          <View style={styles.filterRow}>
            <View style={{ flexDirection: "row" }}>
              {["all", "active", "inactive"].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterBtn,
                    statusFilter === status && styles.filterBtnActive
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={{ color: statusFilter === status ? "#000" : "#aaa" }}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={14} color="#777" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search fleet, plate or service..."
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* BUS LIST */}
          {filteredBuses.length === 0 ? (
            <Text style={{ color: "#777", textAlign: "center", marginTop: 40 }}>
              No buses found
            </Text>
          ) : (
            filteredBuses.map(renderBus)
          )}

        </View>
      </ScrollView>

      {/* ===== TRIP MODAL ===== */}
      <Modal visible={isTripModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Log Trip</Text>
            <TouchableOpacity onPress={() => setIsTripModalVisible(false)}>
                <Ionicons name="close" size={24} color="#aaa" />
            </TouchableOpacity>

            {tripSuccess ? (
              <Text style={styles.successText}>{tripSuccess}</Text>
            ) : errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            <Picker selectedValue={selectedBus} onValueChange={setSelectedBus}>
              {buses.map(b => (
                <Picker.Item
                  key={b._id}
                  label={`${b.busNumber} (${b.plateNumber})`}
                  value={b._id}
                />
              ))}
            </Picker>

            <View style={styles.statusButtonsRow}>
              <TouchableOpacity
                style={[styles.statusBtn, tripStatus === "on-time" && styles.statusActive]}
                onPress={() => setTripStatus("on-time")}
              >
                <Text>On-Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusBtn, tripStatus === "delayed" && styles.statusDelayed]}
                onPress={() => setTripStatus("delayed")}
              >
                <Text>Delayed</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddTrip}
              disabled={isSubmittingTrip}
            >
              {isSubmittingTrip ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalSubmitText}>Record Trip</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== INCIDENT MODAL ===== */}
      <Modal visible={isIncidentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Report Incident</Text>
            <TouchableOpacity onPress={() => setIsIncidentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#aaa" />
            </TouchableOpacity>

            {incidentSuccess ? (
              <Text style={styles.successText}>{incidentSuccess}</Text>
            ) : errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : null}

            <Picker
              selectedValue={selectedIncidentBus}
              onValueChange={setSelectedIncidentBus}
            >
              {buses.map(b => (
                <Picker.Item
                  key={b._id}
                  label={`${b.busNumber} (${b.plateNumber})`}
                  value={b._id}
                />
              ))}
            </Picker>

            <TextInput
              style={styles.textArea}
              placeholder="Describe what happened..."
              placeholderTextColor="#777"
              value={incidentDesc}
              onChangeText={setIncidentDesc}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: "#ff9800" }]}
              onPress={handleAddIncident}
              disabled={isSubmittingIncident}
            >
              {isSubmittingIncident ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalSubmitText}>Log Incident</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  scrollContainer: { paddingBottom: 60 },

  contentWrapper: {
    padding: 25,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%"
  },

  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerSubtitle: { color: "#888", marginBottom: 25 },

  statsRow: { flexDirection: "row", marginBottom: 25 },
  statCardDark: { backgroundColor: "#1a1a1a", flex: 1, marginRight: 10, padding: 20, borderRadius: 12 },
  statCardLight: { backgroundColor: "#f3be0f", flex: 1, padding: 20, borderRadius: 12 },
  statLabel: { fontSize: 12, fontWeight: "bold" },
  statValueDark: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  statValueLight: { fontSize: 32, fontWeight: "bold" },

  actionRow: { flexDirection: "row", marginBottom: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15, marginRight: 10 },
  actionBtnText: { fontWeight: "bold", marginLeft: 6, color: "#fff" },

  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: "#262626", marginRight: 8 },
  filterBtnActive: { backgroundColor: "#f3be0f" },

  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", paddingHorizontal: 12, borderRadius: 20, width: 260 },
  searchInput: { color: "#fff", marginLeft: 8, flex: 1 },

  card: { backgroundColor: "#1a1a1a", padding: 18, borderRadius: 14, marginBottom: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardDesktop: { paddingHorizontal: 30 },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },

  iconWrapper: { backgroundColor: "rgba(243,190,15,0.15)", width: 46, height: 46, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  busInfo: { marginLeft: 15, flex: 1 },
  busNumber: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  subText: { color: "#aaa", marginTop: 4 },
  supplierText: { color: "#f3be0f", marginTop: 4, fontSize: 12 },

  statusBadge: { marginLeft: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  modalContainer: { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  successText: { color: "#1faa59", textAlign: "center", marginBottom: 10, fontWeight: "bold" },
  errorText: { color: "#ff4d4d", textAlign: "center", marginBottom: 10, fontWeight: "bold" },

  statusButtonsRow: { flexDirection: "row", marginVertical: 15 },
  statusBtn: { flex: 1, backgroundColor: "#262626", padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: "center" },
  statusActive: { backgroundColor: "#f3be0f" },
  statusDelayed: { backgroundColor: "#ff9800" },

  textArea: {
    backgroundColor: "#262626",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    height: 90,
    marginVertical: 10
  },

  modalSubmitBtn: { backgroundColor: "#f3be0f", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  modalSubmitText: { color: "#000", fontWeight: "bold", fontSize: 16 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" }
});