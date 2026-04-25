import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import api from "../../services/api";

export default function FeedbackList() {
  const router = useRouter();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  /* ================= LOAD FEEDBACK ================= */

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/performance/complaints");
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error("Error loading feedbacks", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeedbacks();
    }, [])
  );

  /* ================= DERIVED DATA ================= */

  const totalCount = feedbacks.length;
  const positiveCount = feedbacks.filter(f => f.rating === "POSITIVE").length;
  const negativeCount = feedbacks.filter(f => f.rating === "NEGATIVE").length;

  const filteredFeedbacks =
    filter === "ALL"
      ? feedbacks
      : feedbacks.filter(f => f.rating === filter);

  /* ================= RENDER CARD ================= */

  const renderFeedback = (item) => {
    const isPositive = item.rating === "POSITIVE";

    return (
      <View key={item._id} style={styles.card}>
        <View style={styles.row}>
          <Ionicons
            name={isPositive ? "thumbs-up" : "alert-circle"}
            size={22}
            color={isPositive ? "#1faa59" : "#ff4d4d"}
          />
          <Text
            style={[
              styles.rating,
              { color: isPositive ? "#1faa59" : "#ff4d4d" }
            ]}
          >
            {isPositive ? "Positive" : "Negative"}
          </Text>
        </View>

        <Text style={styles.comment}>{item.comment}</Text>

        <Text style={styles.meta}>
          Bus: {item.busId?.busNumber || "N/A"} •{" "}
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Feedback</Text>
          <Text style={styles.subtitle}>Monitor Customer Feedback</Text>
        </View>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={[styles.summaryCard, { borderColor: "#1faa59" }]}>
            <Text style={[styles.summaryNumber, { color: "#1faa59" }]}>
              {positiveCount}
            </Text>
            <Text style={styles.summaryLabel}>Positive</Text>
          </View>

          <View style={[styles.summaryCard, { borderColor: "#ff4d4d" }]}>
            <Text style={[styles.summaryNumber, { color: "#ff4d4d" }]}>
              {negativeCount}
            </Text>
            <Text style={styles.summaryLabel}>Negative</Text>
          </View>
        </View>

        {/* ACTION + FILTER ROW */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.addBtnWide}
            onPress={() => router.push("/complaints/add")}
          >
            <Ionicons name="add" size={22} color="#000" />
            <Text style={styles.addText}>Add Feedback</Text>
          </TouchableOpacity>

          <View style={styles.filterGroup}>
            {["ALL", "POSITIVE", "NEGATIVE"].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterBtn,
                  filter === type && styles.filterBtnActive
                ]}
                onPress={() => setFilter(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === type && styles.filterTextActive
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FEEDBACK LIST */}
        {loading ? (
          <ActivityIndicator size="large" color="#f3be0f" style={{ marginTop: 40 }} />
        ) : filteredFeedbacks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={36} color="#666" />
            <Text style={styles.emptyText}>
              No feedback matches this filter
            </Text>
          </View>
        ) : (
          filteredFeedbacks.map(renderFeedback)
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f"
  },

  header: {
    padding: 20
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold"
  },

  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center"
  },
  summaryNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff"
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#888"
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20
  },
  addBtnWide: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3be0f",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10
  },
  addText: {
    marginLeft: 6,
    fontWeight: "bold",
    color: "#000"
  },

  filterGroup: {
    flexDirection: "row"
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#262626",
    borderRadius: 6,
    marginLeft: 5
  },
  filterBtnActive: {
    backgroundColor: "#f3be0f"
  },
  filterText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "bold"
  },
  filterTextActive: {
    color: "#000"
  },

  card: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  rating: {
    marginLeft: 10,
    fontWeight: "bold",
    fontSize: 14
  },
  comment: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 8
  },
  meta: {
    color: "#888",
    fontSize: 12
  },

  emptyState: {
    marginTop: 60,
    alignItems: "center"
  },
  emptyText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14
  }
});