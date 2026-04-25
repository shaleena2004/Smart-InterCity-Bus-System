import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import api from "../services/api";
import Svg, { Circle } from "react-native-svg";

/* =========================================================
   CIRCULAR PROGRESS COMPONENT
========================================================= */
const CircularProgress = ({ percentage, color }) => {
  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <Svg width="60" height="60" viewBox="0 0 60 60">
        <Circle
          cx="30"
          cy="30"
          r={radius}
          stroke="rgba(243,190,15,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx="30"
          cy="30"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </Svg>
      <View style={styles.circularIconContainer}>
        <Ionicons name="time" size={16} color={color} />
      </View>
    </View>
  );
};

/* =========================================================
   PERFORMANCE SCREEN
========================================================= */
export default function Performance() {
  const { supplierId } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [performance, setPerformance] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [perfRes, supRes] = await Promise.all([
        api.get(`/api/performance/${supplierId}`),
        api.get(`/api/suppliers/${supplierId}`)
      ]);
      setPerformance(perfRes.data);
      setSupplier(supRes.data);
    } catch (error) {
      console.log("Error loading performance data", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [supplierId])
  );

  const handleDownloadPDF = () => {
    if (Platform.OS === "web") {
      window.print();
    } else {
      alert("PDF download is available on the web version.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f3be0f" />
      </View>
    );
  }

  if (!performance || !supplier) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#fff" }}>
          Performance data not available.
        </Text>
      </View>
    );
  }

  /* =========================================================
     DESTRUCTURE NEW BACKEND RESPONSE
  ========================================================= */
  const { grade, score, trips, incidents, feedbacks } = performance;

  const onTimePercentage = trips.onTimePercentage;
  const delayedPercentage = trips.delayedPercentage;

  const getGradeColor = grade => {
    if (grade === "A+") return "#1faa59";
    if (grade === "A") return "#43a047";
    if (grade === "B") return "#f3be0f";
    if (grade === "C") return "#ff9800";
    return "#f44336";
  };

  const gradeColor = getGradeColor(grade);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#f3be0f" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Performance Report</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Hero Section */}
          <View
            style={[
              styles.heroSection,
              isDesktop && { flexDirection: "row", gap: 30 }
            ]}
          >
            <View style={styles.profileSection}>
              <View style={styles.profileImageWrapper}>
                {supplier.profilePic ? (
                  <Image
                    source={{ uri: supplier.profilePic }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Ionicons
                    name="business"
                    size={45}
                    color="#f3be0f"
                  />
                )}
              </View>

              <Text style={styles.supplierName}>
                {supplier.companyName || supplier.name}
              </Text>

              <Text style={styles.supplierSub}>
                <Text style={{ color: "#f3be0f" }}>
                  ID: {supplier._id.substring(0, 8).toUpperCase()}
                </Text>{" "}
                • Current Quarter
              </Text>
            </View>

            <View style={styles.gradeCard}>
              <Text style={styles.gradeTitle}>EFFICIENCY GRADE</Text>
              <Text
                style={[
                  styles.gradeLargeText,
                  { color: gradeColor }
                ]}
              >
                {grade}
              </Text>
              <Text style={styles.gradeSubtitle}>
                Calculated from operational data
              </Text>
            </View>
          </View>

          {/* KPI ROW 1 — Trip Completion (UPDATED ✅) */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Trip Completion</Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.kpiValue}>
                  {onTimePercentage}%
                </Text>
                <CircularProgress
                  percentage={onTimePercentage}
                  color="#f3be0f"
                />
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPositive}>
                  ON‑TIME {onTimePercentage}%
                </Text>
                <Text style={styles.breakdownNegative}>
                  DELAYED {delayedPercentage}%
                </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Trips</Text>
              <Text style={styles.kpiValue}>{trips.total}</Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPositive}>
                  ON‑TIME {trips.onTime}
                </Text>
                <Text style={styles.breakdownNegative}>
                  DELAYED {trips.delayed}
                </Text>
              </View>
            </View>
          </View>

          {/* KPI ROW 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Incidents</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: "#ff9800" }
                ]}
              >
                {incidents.total}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Feedbacks</Text>
              <Text style={styles.kpiValue}>
                {feedbacks.total}
              </Text>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownPositive}>
                  POSITIVE {feedbacks.positive}
                </Text>
                <Text style={styles.breakdownNegative}>
                  NEGATIVE {feedbacks.negative}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadPDF}
          >
            <Text style={styles.downloadBtnText}>
              Download Full Performance PDF
            </Text>
            <Ionicons
              name="download-outline"
              size={20}
              color="#f3be0f"
            />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES (EXTENDED FROM YOUR ORIGINAL)
========================================================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 40 },
  contentWrapper: { maxWidth: 1150, alignSelf: "center", padding: 30 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30
  },
  backBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(243,190,15,0.1)"
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold"
  },

  heroSection: { marginBottom: 30 },
  profileSection: { alignItems: "center" },
  profileImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#f3be0f",
    justifyContent: "center",
    alignItems: "center"
  },
  profileImage: { width: "100%", height: "100%" },

  supplierName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 10
  },
  supplierSub: { color: "#aaa", fontSize: 13 },

  gradeCard: {
    backgroundColor: "#1a1a1a",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  gradeTitle: { color: "#f3be0f", letterSpacing: 2 },
  gradeLargeText: { fontSize: 80, fontWeight: "bold" },
  gradeSubtitle: { color: "#888", marginTop: 8 },

  kpiRow: { flexDirection: "row", gap: 15, marginBottom: 15 },
  kpiCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 25,
    borderRadius: 16
  },
  kpiLabel: { color: "#888", marginBottom: 8 },
  kpiValue: { fontSize: 28, color: "#fff", fontWeight: "bold" },

  breakdownRow: {
    marginTop: 10
  },
  breakdownPositive: {
    color: "#1faa59",
    fontSize: 13,
    fontWeight: "bold"
  },
  breakdownNegative: {
    color: "#ff9800",
    fontSize: 13,
    fontWeight: "bold"
  },

  downloadBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#f3be0f",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center"
  },
  downloadBtnText: {
    color: "#f3be0f",
    fontWeight: "bold",
    marginRight: 10
  },

  circularProgressContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10
  },
  circularIconContainer: { position: "absolute" }
});