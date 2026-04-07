import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Colors } from "../constants/Colors";
import { API_BASE } from "../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const { role, adminType } = useLocalSearchParams();
  const isDriver = role === "driver";
  const isAdmin = role === "admin";

  // ✅ STATES
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ LOGIN FUNCTION
  const handleLogin = async () => {
    console.log("Login clicked");
    console.log(isAdmin ? username : phone, password);

    setErrorMessage("");

    if (isAdmin) {
      if (!username || !password) {
        setErrorMessage("Please enter username and password");
        return;
      }
    } else {
      if (!phone || !password) {
        setErrorMessage("Please enter phone and password");
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(isAdmin ? { username } : { phone }),
          password,
        }),
      });

      console.log("Response Status:", response.status);

      const data = await response.json();
      console.log("Response Data:", data);

      if (response.ok) {
        const userRole = data.user?.role;
        const userAdminType = data.user?.adminType;
        const userAdminRole = data.user?.adminRole;

        const sessionPayload = {
          role: userRole || role,
          adminType: userAdminType,
          adminRole: userAdminRole,
          username: data.user?.username || username,
          name: data.user?.name,
          phone: data.user?.phone || phone,
          _id: data.user?._id
        };

        await AsyncStorage.setItem('user_session', JSON.stringify(sessionPayload));

        if (userRole === 'admin' || userRole === 'super-admin' || userRole === 'staff' || userRole === 'manager') {
          router.replace({ pathname: '/admin', params: { role: sessionPayload.role, adminType: sessionPayload.adminType, adminRole: sessionPayload.adminRole, username: sessionPayload.username } });
        } else {
          router.replace({ pathname: '/home', params: { role: sessionPayload.role, phone: sessionPayload.phone } });
        }
      } else {
        setErrorMessage(data.message || "Login failed");
      }
    } catch (error) {
      console.log("ERROR:", error);
      setErrorMessage("Cannot connect to the backend server. Make sure it is running.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >

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
            <Ionicons name="bus" size={32} color="#000" />
          </View>
          <Text style={styles.appName}>BOOK&GO</Text>
          <Text style={styles.subtext}>Commute with confidence</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          {isAdmin ? "Admin Login" : isDriver ? "Driver Login" : "Passenger Login"}
        </Text>

        {/* FORM */}
        <View style={styles.form}>
          {isAdmin ? (
            <Input
              label="USERNAME"
              placeholder="admin username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          ) : (
            <Input
              label="MOBILE NUMBER"
              placeholder="+94 7X XXX XXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          )}

          <View style={styles.passwordContainer}>
            <Input
              label="PASSWORD"
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {errorMessage ? (
            <Text style={{ color: "#ff4444", marginBottom: 15, textAlign: "center", fontWeight: "bold" }}>
              {errorMessage}
            </Text>
          ) : null}

          {/* LOGIN BUTTON */}
          <Button
            title="Login"
            onPress={handleLogin}
            style={styles.loginBtn}
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          {isAdmin ? (
            <Text style={styles.signupText}>
              Admin accounts must be created by the User Management Admin.
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: "/signup", params: { role, adminType } })
              }
            >
              <Text style={styles.signupText}>
                Don&apos;t have an account?{" "}
                <Text style={styles.signupBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          )}
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
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconBox: {
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  subtext: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  title: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    width: '100%',
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
  forgotPassword: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 25,
  },
  forgotText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loginBtn: {
    marginTop: 10,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
  },
  signupText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  signupBold: {
    color: Colors.primary,
    fontWeight: "bold",
  },
});