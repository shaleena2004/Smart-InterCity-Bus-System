import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Colors } from "../constants/Colors";
import { API_BASE } from "../services/api";

export default function SignUpScreen() {
  const router = useRouter();
  const { role, adminType } = useLocalSearchParams();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (isAdmin) {
      router.replace({ pathname: "/login", params: { role: "admin", adminType } });
    }
  }, [isAdmin, adminType, router]);

  // ✅ STATES
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ SIGNUP FUNCTION
  const handleSignup = async () => {
    console.log("Signup button clicked ");
    console.log(name, username, phone, email, password, role, adminType);

    setErrorMessage(""); // clear previous errors

    // ✅ Limitation checks (validations)
    if (!name || !password || (isAdmin ? !username : !phone)) {
      setErrorMessage("Please fill all required fields");
      return;
    }
    if (name.length < 3) {
      setErrorMessage("Name must be at least 3 characters long");
      return;
    }
    if (!isAdmin && phone.length !== 10) {
      setErrorMessage("Phone number must be exactly 10 digits");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username: isAdmin ? username : undefined,
          phone: isAdmin ? phone || undefined : phone,
          email,
          password,
          role: role || "passenger",
          adminType: isAdmin ? adminType : undefined,
        }),
      });

      console.log("Response Status:", response.status);

      const data = await response.json();
      console.log("Response Data:", data);

      if (response.ok) {
        router.replace({ pathname: "/login", params: { role, adminType } });
      } else {
        setErrorMessage(data.message || "Signup failed");
      }
    } catch (error) {
      console.log("ERROR:", error);
      setErrorMessage("Cannot connect to the backend server. Make sure it is running.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="bus" size={24} color="#000" />
          </View>
          <Text style={styles.appName}>BOOK&GO</Text>
          <Text style={styles.subtext}>CREATE NEW ACCOUNT</Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          <Input
            label="FULL NAME"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />

          {isAdmin ? (
            <Input
              label="USERNAME"
              placeholder="admin username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              style={{ marginTop: 10 }}
            />
          ) : (
            <Input
              label="MOBILE NUMBER"
              placeholder="+94 7X XXX XXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              style={{ marginTop: 10 }}
            />
          )}

          <Input
            label={isAdmin ? "PHONE (OPTIONAL)" : "EMAIL (OPTIONAL)"}
            placeholder={isAdmin ? "+94 7X XXX XXXX" : "name@example.com"}
            keyboardType={isAdmin ? "phone-pad" : "email-address"}
            autoCapitalize={isAdmin ? "none" : "none"}
            value={isAdmin ? phone : email}
            onChangeText={isAdmin ? setPhone : setEmail}
            style={{ marginTop: 10 }}
          />

          <View style={styles.passwordContainer}>
            <Input
              label="CREATE PASSWORD"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {isAdmin && adminType ? (
            <Text style={styles.adminRoleText}>Admin type: {adminType.replace(/-/g, ' ')}</Text>
          ) : null}

          {errorMessage ? (
            <Text style={{ color: "#ff4444", marginTop: 15, textAlign: "center", fontWeight: "bold" }}>
              {errorMessage}
            </Text>
          ) : null}

          {/* SIGNUP BUTTON */}
          <Button
            title="Sign Up"
            onPress={handleSignup}
            style={{ marginTop: 20 }}
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/login", params: { role, adminType } })
            }
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  backBtn: {
    position: "absolute",
    top: 30,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconBox: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtext: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  passwordContainer: {
    position: "relative",
    marginTop: 10,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 40,
  },
  signupButton: {
    backgroundColor: "#FFC107",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    color: "#000",
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    marginTop: 40,
  },
  loginText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  loginBold: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  adminRoleText: {
    color: Colors.primary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
