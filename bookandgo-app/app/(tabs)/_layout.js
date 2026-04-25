import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                // යට තියෙන Tab bar එක නොපෙනී යාමට display: 'none' යොදා ඇත
                tabBarStyle: {
                    display: "none",
                },
                tabBarActiveTintColor: "#f3be0f",
                tabBarInactiveTintColor: "#888",
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === "index") iconName = "home";
                    if (route.name === "supplier-list") iconName = "people";
                    if (route.name === "bus-list") iconName = "bus";
                    if (route.name === "performance") iconName = "analytics";
                    if (route.name === "reports") iconName = "document-text";
                    if (route.name === "payments") iconName = "wallet";
                    if (route.name === "complaints") iconName = "warning";

                    return <Ionicons name={iconName} size={26} color={color} />;
                },
            })}
        >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="supplier-list" options={{ title: "Suppliers" }} />
            <Tabs.Screen name="bus-list" options={{ title: "Buses" }} />
            <Tabs.Screen name="performance" options={{ title: "Performance" }} />
            <Tabs.Screen name="reports" options={{ title: "Reports" }} />
            <Tabs.Screen name="payments" options={{ title: "Payments" }} />
            <Tabs.Screen name="complaints" options={{ title: "Complaints" }} />
        </Tabs>
    );
}