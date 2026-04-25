import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <Image
        source={require("../assets/images/bookgo_logo.png")}   // <-- Add logo here
        style={styles.logo}
      />

      {/* App Title */}
      <Text style={styles.title}>Book & Go - Intercity Bus Transport Management System</Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/")}   // Go to Dashboard
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 30,
    borderRadius: 32,
  },
  title: {
    color: "#f3be0f",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#f3be0f",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});