import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Button } from "../components/ui/Button";
import { Colors } from "../constants/Colors";

const adminOptions = [
  {
    key: "user-management",
    title: "User Management Admin",
    description: "Manage user accounts and passenger access.",
  },
  {
    key: "finance-management",
    title: "Finance Management Admin",
    description: "Track payments, finance reports, and revenue.",
  },
  {
    key: "bus-supplier-management",
    title: "Bus Supplier Management Admin",
    description: "Approve suppliers, routes, and vehicle details.",
  },
];



export default function AdminEntryScreen() {
  const router = useRouter();
  const [selectedAdmin, setSelectedAdmin] = useState("user-management");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="shield-checkmark" size={26} color="#000" />
          </View>
          <Text style={styles.appName}>BOOK&GO ADMIN</Text>
          <Text style={styles.subtext}>Secure admin access only</Text>
        </View>

        <Text style={styles.title}>Select your admin role</Text>

        {adminOptions.map((option) => {
          const selected = selectedAdmin === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => setSelectedAdmin(option.key)}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                  {option.title}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={24} color="#000" />}
              </View>
              <Text style={[styles.cardDesc, selected && styles.cardDescSelected]}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}



        <View style={styles.footer}>
          <Button
            title="Login"
            onPress={() =>
              router.push({ pathname: "/login", params: { role: "admin", adminType: selectedAdmin } })
            }
            style={styles.primaryButton}
          />
          <Text style={styles.noteText}>
            Admin accounts are created only by User Management Admin. No admin self-signup is allowed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconBox: {
    backgroundColor: Colors.primary,
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  subtext: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  cardTitleSelected: {
    color: "#000",
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  cardDescSelected: {
    color: "#333",
  },
  footer: {
    marginTop: "auto",
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  noteText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 18,
    textAlign: "center",
    lineHeight: 20,
  },
});
