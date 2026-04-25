import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  TextInput
} from "react-native";
import api from "../services/api";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SupplierPerformanceList() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [suppliers, setSuppliers] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/suppliers");
        setSuppliers(res.data || []);

        const results = {};
        for (const sup of res.data) {
          try {
            const p = await api.get(`/api/performance/${sup._id}`);
            results[sup._id] = p.data;
          } catch {
            results[sup._id] = {
              grade: "D",
              trips: { total: 0, onTimePercentage: 0 },
              incidents: { total: 0 }
            };
          }
        }
        setPerformanceData(results);
      } catch (error) {
        console.error("Error fetching suppliers or performance", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= SEARCH FILTER ================= */

  const filteredSuppliers = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= GRADE COLOR ================= */
  const getGradeColor = (grade) => {
    if (grade === "A+") return "#2e7d32";
    if (grade === "A") return "#43a047";
    if (grade === "B") return "#f3be0f";
    if (grade === "C") return "#fb8c00";
    return "#e53935"; // D
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f3be0f" />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Performance Overview</Text>
            <Text style={styles.headerSubtitle}>
              Select a supplier to view detailed metrics
            </Text>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search suppliers or companies..."
            placeholderTextColor="#777"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f3be0f" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              style={[
                styles.gridContainer,
                !isDesktop && { flexDirection: "column" }
              ]}
            >
              {filteredSuppliers.map((sup) => {
                const perf = performanceData[sup._id];
                const grade = perf?.grade ?? "D";
                const gradeColor = getGradeColor(grade);

                return (
                  <TouchableOpacity
                    key={sup._id}
                    style={[styles.card, isDesktop && { width: "48%" }]}
                    onPress={() =>
                      router.push(`/performance?supplierId=${sup._id}`)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.supplierInfo}>
                        <Text style={styles.name}>{sup.name}</Text>
                        <Text style={styles.companyName}>
                          {sup.companyName}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.gradeBadge,
                          { borderColor: gradeColor }
                        ]}
                      >
                        <Text
                          style={[
                            styles.gradeText,
                            { color: gradeColor }
                          ]}
                        >
                          {grade}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricsRow}>
                      <View style={styles.metricBox}>
                        <Ionicons name="time-outline" size={16} color="#aaa" />
                        <Text style={styles.label}>On‑Time</Text>
                        <Text style={styles.value}>
                          {perf?.trips?.onTimePercentage ?? 0}%
                        </Text>
                      </View>

                      <View style={styles.metricBox}>
                        <Ionicons name="bus-outline" size={16} color="#aaa" />
                        <Text style={styles.label}>Trips</Text>
                        <Text style={styles.value}>
                          {perf?.trips?.total ?? 0}
                        </Text>
                      </View>

                      <View style={styles.metricBox}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color="#aaa"
                        />
                        <Text style={styles.label}>Incidents</Text>
                        <Text style={styles.value}>
                          {perf?.incidents?.total ?? 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.viewMoreRow}>
                      <Text style={styles.viewMoreText}>
                        View Full Report
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#f3be0f"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

/* =========================
   STYLES (UPDATED)
========================= */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0f0f",
    flex: 1,
    alignItems: "center"
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 1000,
    padding: 25,
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10
  },
  backBtn: {
    backgroundColor: "rgba(243, 190, 15, 0.1)",
    padding: 10,
    borderRadius: 10,
    marginRight: 20
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold"
  },
  headerSubtitle: {
    color: "#aaa",
    fontSize: 14
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20
  },
  searchInput: {
    marginLeft: 10,
    color: "#fff",
    flex: 1
  },

  scrollContent: {
    paddingBottom: 50
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    marginBottom: 20
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  supplierInfo: { flex: 1 },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold"
  },
  companyName: {
    color: "#888",
    fontSize: 13
  },
  gradeBadge: {
    width: 45,
    height: 45,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  gradeText: {
    fontSize: 22,
    fontWeight: "bold"
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 20
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metricBox: {
    alignItems: "center",
    flex: 1
  },
  label: {
    color: "#777",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold"
  },
  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold"
  },
  viewMoreRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10
  },
  viewMoreText: {
    color: "#f3be0f",
    fontSize: 13,
    fontWeight: "bold",
    marginRight: 5
  }
});