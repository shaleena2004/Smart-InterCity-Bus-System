import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import api from "../../services/api"; // ✅ CORRECT PATH

export default function AddFeedback() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedBus, setSelectedBus] = useState("");
  const [rating, setRating] = useState("POSITIVE");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/buses")
      .then(res => {
        setBuses(res.data);
        if (res.data.length > 0) {
          setSelectedBus(res.data[0]._id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading buses", err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async () => {
    if (!selectedBus) {
      return Alert.alert("Error", "Please select a bus.");
    }

    if (!comment.trim()) {
      return Alert.alert("Error", "Please enter feedback comment.");
    }

    const busDetails = buses.find(b => b._id === selectedBus);
    if (!busDetails || !busDetails.supplierId) {
      return Alert.alert("Error", "Supplier information not found for this bus.");
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/performance/complaint", {
        supplierId:
          typeof busDetails.supplierId === "object"
            ? busDetails.supplierId._id
            : busDetails.supplierId,
        busId: selectedBus,
        rating,    // POSITIVE / NEGATIVE
        comment
      });

      alert(
        "Success",
        "Feedback submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/complaints") // ✅ GO BACK TO LIST
          }
        ]
      );

      setComment("");
      setRating("POSITIVE");
    } catch (err) {
      console.error("Feedback error:", err.response?.data || err.message);
      alert("Error", "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentWrapper}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace("/complaints")}
            >
              <Ionicons name="arrow-back" size={24} color="#f3be0f" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Submit Feedback</Text>
            <View style={{ width: 44 }} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f3be0f" />
            </View>
          ) : (
            <View style={styles.formCard}>

              {/* Info Banner */}
              <View
                style={[
                  styles.infoHeader,
                  rating === "NEGATIVE" && styles.warningHeader
                ]}
              >
                <Ionicons
                  name={rating === "NEGATIVE" ? "alert-circle" : "thumbs-up"}
                  size={24}
                  color={rating === "NEGATIVE" ? "#ff4d4d" : "#1faa59"}
                />
                <Text
                  style={[
                    styles.infoText,
                    rating === "NEGATIVE" && { color: "#ff4d4d" }
                  ]}
                >
                  {rating === "NEGATIVE"
                    ? "Negative feedback will reduce the supplier's performance score."
                    : "Positive feedback helps improve the supplier's performance score."}
                </Text>
              </View>

              {/* Bus selection */}
              <Text style={styles.label}>1. Select Bus:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedBus}
                  onValueChange={setSelectedBus}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  {buses.map(bus => (
                    <Picker.Item
                      key={bus._id}
                      label={`${bus.busNumber} (${bus.plateNumber})`}
                      value={bus._id}
                      color="#000"
                    />
                  ))}
                </Picker>
              </View>

              {/* Feedback type */}
              <Text style={[styles.label, { marginTop: 15 }]}>
                2. Feedback Type:
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={rating}
                  onValueChange={setRating}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                >
                  <Picker.Item label="Positive Feedback" value="POSITIVE" color="#000" />
                  <Picker.Item label="Negative Feedback" value="NEGATIVE" color="#000" />
                </Picker>
              </View>

              {/* Comment */}
              <Text style={[styles.label, { marginTop: 15 }]}>
                3. Feedback Comment:
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience..."
                placeholderTextColor="#777"
                multiline
                numberOfLines={5}
                value={comment}
                onChangeText={setComment}
              />

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="#000" style={{ marginRight: 10 }} />
                    <Text style={styles.submitBtnText}>Submit Feedback</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0f0f",
    flex: 1,
    alignItems: "center"
  },
  scrollContent: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 50
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 800,
    padding: 25
  },
  loadingContainer: {
    padding: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 35,
    marginTop: 10
  },
  backBtn: {
    backgroundColor: "rgba(243, 190, 15, 0.1)",
    padding: 10,
    borderRadius: 10
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold"
  },
  formCard: {
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#292929"
  },
  infoHeader: {
    flexDirection: "row",
    backgroundColor: "rgba(31, 170, 89, 0.1)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31, 170, 89, 0.3)",
    alignItems: "center",
    marginBottom: 25
  },
  infoText: {
    color: "#1faa59",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 15,
    flex: 1
  },
  warningHeader: {
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    borderColor: "rgba(255, 77, 77, 0.3)"
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    backgroundColor: "#262626",
    marginBottom: 20
  },
  picker: {
    color: "#fff",
    backgroundColor: "#262626",
    height: 50
  },
  textArea: {
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    color: "#fff",
    padding: 15,
    fontSize: 15,
    marginBottom: 25,
    minHeight: 120,
    textAlignVertical: "top"
  },
  submitBtn: {
    backgroundColor: "#f3be0f",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 10
  },
  submitBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold"
  }
});