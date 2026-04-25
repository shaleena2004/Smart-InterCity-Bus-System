import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    useWindowDimensions,
    ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { LineChart } from "react-native-chart-kit";
import { COLORS } from "../../theme/colors";
import api from "../../services/api";

export default function Dashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    /* ---------- STATE ---------- */
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isChartLoading, setIsChartLoading] = useState(true);
    const [topSupplier, setTopSupplier] = useState(null);
    const [topSupplierPerformance, setTopSupplierPerformance] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);

    const [graphData, setGraphData] = useState({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "This Month"],
        datasets: [
            {
                data: [2, 3, 4, 5, 6, 0], // Suppliers
                color: (opacity = 1) => `rgba(243, 190, 15, ${opacity})`,
                strokeWidth: 3
            },
            {
                data: [0, 1, 1, 2, 2, 0], // Active Fleet
                color: (opacity = 1) => `rgba(75, 181, 67, ${opacity})`,
                strokeWidth: 3
            },
            {
                data: [60, 65, 72, 80, 85, 0], // Performance (%)
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                strokeWidth: 3
            }
        ],
        legend: ["Suppliers", "Active Fleet", "Performance (%)"]
    });

    const gradeScore = { "A+": 5, "A": 4, "B": 3, "C": 2, "D": 1 };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsChartLoading(true);
        try {
            const [supRes, busRes, compRes] = await Promise.all([
                api.get('/api/suppliers'),
                api.get('/api/buses'),
                api.get("/api/performance/complaints")
            ]);

            const suppliersData = supRes.data || [];
            const busesData = busRes.data || [];
            const complaintsData = compRes.data || [];

            /* ---------- FIND TOP SUPPLIER ---------- */
            let bestSupplier = null;
            let bestPerf = null;
            let bestRank = -1;

            for (const s of suppliersData) {
                try {
                    const perfRes = await api.get(`/api/performance/${s._id}`);
                    const perf = perfRes.data;
                    const rank = gradeScore[perf.grade] ?? 0;

                    if (rank > bestRank) {
                        bestRank = rank;
                        bestSupplier = s;
                        bestPerf = perf;
                    }
                } catch (e) { console.log("Rank fetch error", e); }
            }

            setTopSupplier(bestSupplier);
            setTopSupplierPerformance(bestPerf);

            /* ---------- UPDATE CHART DATA ---------- */
            const realSuppliersCount = suppliersData.length;
            const realActiveFleetCount = busesData.filter(b => b.status === 'active').length;
            const realAvgPerformance = bestPerf?.trips?.onTimePercentage ?? 0;

            setGraphData(prev => {
                const newData = { ...prev };
                newData.datasets[0].data[5] = realSuppliersCount;
                newData.datasets[1].data[5] = realActiveFleetCount;
                newData.datasets[2].data[5] = realAvgPerformance;
                return newData;
            });

            /* ---------- UPDATE RECENT ACTIVITY ---------- */
            const activities = complaintsData.slice(0, 3).map(c => ({
                id: c._id,
                type: "incident",
                title: "New Complaint",
                subtitle: c.comment || "No details provided",
                date: "Recent"
            }));

            // Add a status activity if no complaints
            activities.push({
                id: "status-update",
                type: "schedule",
                title: "System Synced",
                subtitle: `${suppliersData.length} Suppliers Active`,
                date: "Just now"
            });

            setRecentActivities(activities);
            setIsChartLoading(false);

        } catch (error) {
            console.log("Error fetching dashboard data:", error);
            setIsChartLoading(false);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleNavigation = (path) => {
        setIsSidebarOpen(false);
        if (path) router.push(path);
    };

    const chartWidth = width - 60;
    const chartConfig = {
        backgroundGradientFrom: COLORS.card,
        backgroundGradientTo: COLORS.card,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
        strokeWidth: 2,
        propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.card }
    };

    /* --- Sidebar Component --- */
    const Sidebar = () => {
        if (!isSidebarOpen) return null;
        const isActive = (path) => pathname === path || (path === '/' && pathname === '/index');

        const MenuItem = ({ title, icon, path }) => (
            <TouchableOpacity
                style={[styles.sidebarItem, isActive(path) && styles.sidebarItemActive]}
                onPress={() => handleNavigation(path)}
            >
                <Ionicons name={icon} size={20} color={isActive(path) ? COLORS.primary : "#7a7a7a"} style={styles.sidebarIcon} />
                <Text style={[styles.sidebarItemText, isActive(path) && styles.sidebarItemTextActive]}>{title}</Text>
            </TouchableOpacity>
        );

        return (
            <View style={styles.sidebarOverlay}>
                <TouchableOpacity style={styles.sidebarCloseArea} onPress={toggleSidebar} activeOpacity={1} />
                <View style={styles.sidebarContent}>
                    <View style={styles.sidebarHeader}>
                        <Text style={styles.sidebarTitle}>Menu</Text>
                        <TouchableOpacity onPress={toggleSidebar}><Ionicons name="close" size={24} color="#7a7a7a" /></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.sidebarScroll}>
                        <Text style={styles.sidebarSectionTitle}>MAIN MENU</Text>
                        <MenuItem title="Home" icon="home" path="/" />
                        <MenuItem title="Explore" icon="compass" path="/explore" />
                        <View style={styles.sidebarDivider} />
                        <Text style={styles.sidebarSectionTitle}>MANAGEMENT CONSOLE</Text>
                        <MenuItem title="Suppliers" icon="people" path="/supplier-list" />
                        <MenuItem title="Fleet Status" icon="bus" path="/bus-list" />
                        <MenuItem title="Performance" icon="analytics" path="/supplier-performance-list" />
                        <MenuItem title="Payments" icon="wallet" path="/payments" />
                        <MenuItem title="Feedback" icon="chatbubbles" path="/complaints" />
                        <MenuItem title="Reports" icon="document-text" path="/reports" />
                    </ScrollView>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Sidebar />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.menuIcon} onPress={toggleSidebar}>
                        <Ionicons name="menu" size={26} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Supplier Portal Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.notificationIcon}>
                    <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Top Row: Best Supplier Info */}
                <View style={[styles.topRow, !isDesktop && styles.columnLayout]}>
                    <View style={[styles.profileCard, isDesktop && { flex: 1, marginRight: 20 }]}>
                        {topSupplier ? (
                            <>
                                <View style={styles.profileLogo}>
                                    <Text style={styles.logoText}>{topSupplier.companyName?.charAt(0) || "S"}</Text>
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.profileName}>{topSupplier.name}</Text>
                                    <Text style={styles.profileEmail}>{topSupplier.companyName}</Text>
                                    <Text style={styles.tagActive}>● {topSupplier.status?.toUpperCase() || "ACTIVE"}</Text>
                                </View>
                            </>
                        ) : (
                            <ActivityIndicator color={COLORS.primary} />
                        )}
                    </View>

                    <View style={[styles.performanceCard, isDesktop && { flex: 1.2 }]}>
                        <View style={styles.perfHeader}>
                            <Text style={styles.sectionLabel}>TOP PERFORMANCE</Text>
                            <Text style={styles.trendUp}><Ionicons name="trending-up" size={12} /> Live Data</Text>
                        </View>
                        <View style={styles.gradeRow}>
                            <View style={styles.gradeBox}>
                                <Text style={styles.gradeText}>{topSupplierPerformance?.grade || "N/A"}</Text>
                            </View>
                            <View style={styles.gradeDetails}>
                                <Text style={styles.gradeRemark}>On-Time: {topSupplierPerformance?.trips?.onTimePercentage ?? 0}%</Text>
                                <Text style={styles.gradeSub}>Based on recent operational data</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Chart Section */}
                <Text style={styles.sectionTitle}>GROWTH & COMPARISON OVERVIEW</Text>
                <View style={styles.chartContainer}>
                    {isChartLoading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ padding: 50 }} />
                    ) : (
                        <LineChart
                            data={graphData}
                            width={chartWidth}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chartStyle}
                        />
                    )}
                </View>

                {/* Management Console Grid */}
                <View style={[styles.bottomRow, !isDesktop && styles.columnLayout]}>
                    <View style={[styles.mainContentArea, isDesktop && { flex: 2, marginRight: 20 }]}>
                        <Text style={styles.sectionTitle}>MANAGEMENT CONSOLE</Text>
                        <View style={styles.gridContainer}>
                            {[
                                { title: "Suppliers", icon: "people", path: "/supplier-list" },
                                { title: "Fleet Status", icon: "bus", path: "/bus-list" },
                                { title: "Performance", icon: "analytics", path: "/supplier-performance-list" },
                                { title: "Payments", icon: "wallet", path: "/payments" },
                                { title: "Feedback", icon: "chatbubbles", path: "/complaints", color: "#f3be0f" },
                                { title: "Reports", icon: "document-text", path: "/reports" }
                            ].map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.gridItem} onPress={() => router.push(item.path)}>
                                    <Ionicons name={item.icon} size={32} color={item.color || COLORS.primary} />
                                    <Text style={styles.gridText}>{item.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Recent Activity List */}
                    <View style={[styles.sidebarArea, isDesktop && { flex: 1 }]}>
                        <View style={styles.recentHeaderRow}>
                            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                            <TouchableOpacity onPress={fetchDashboardData}>
                                <Text style={styles.seeAllText}>REFRESH</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.activityList}>
                            {recentActivities.map((activity) => (
                                <View key={activity.id} style={styles.activityItem}>
                                    <View style={[styles.activityIconBg, activity.type === "incident" ? { backgroundColor: "rgba(255, 77, 77, 0.1)" } : {}]}>
                                        <Ionicons
                                            name={activity.type === "incident" ? "alert-circle" : "checkmark-circle"}
                                            size={20}
                                            color={activity.type === "incident" ? "#ff4d4d" : COLORS.success}
                                        />
                                    </View>
                                    <View style={styles.activityDetails}>
                                        <Text style={styles.activityTitle}>{activity.title}</Text>
                                        <Text style={styles.activitySub} numberOfLines={1}>{activity.subtitle}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ... Use the Styles from your 1st Block as they were complete and correctly formatted ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    sidebarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, flexDirection: 'row' },

    sidebarCloseArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },

    sidebarContent: {
        width: 290,
        backgroundColor: COLORS.card,
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        elevation: 15,
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },

    sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 25, paddingHorizontal: 25, },

    sidebarTitle: { color: COLORS.primary, fontSize: 22, fontWeight: 'bold', letterSpacing: 1, },

    closeBtn: { padding: 5 },

    sidebarScroll: { paddingVertical: 10 },

    sidebarSectionTitle: {
            color: '#666',
            fontSize: 11,
            fontWeight: 'bold',
            marginBottom: 10,
            marginTop: 15,
            paddingHorizontal: 25,
            letterSpacing: 1.5,
    },
    sidebarDivider: {
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            marginVertical: 15,
            marginHorizontal: 25,
    },

    sidebarItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 15,
            marginHorizontal: 15,
            borderRadius: 10,
            marginVertical: 3,
    },

    sidebarItemActive: { backgroundColor: 'rgba(243, 190, 15, 0.12)' },
    sidebarIcon: { marginRight: 15, width: 24, textAlign: 'center' },
    sidebarItemText: { color: '#999', fontSize: 15, fontWeight: '600' },
    sidebarItemTextActive: { color: COLORS.primary, fontWeight: 'bold' },
    //sidebarSectionTitle: { color: '#666', fontSize: 11, fontWeight: 'bold', paddingHorizontal: 25, marginTop: 15 },
    //sidebarDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginVertical: 15 },
    scrollContent: { padding: 30, paddingBottom: 50 },
    header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 15,
            paddingHorizontal: 30,
            backgroundColor: COLORS.card,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
    },
    headerLeft: { flexDirection: "row", alignItems: "center" },
    menuIcon: { marginRight: 18 },
    headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: "bold", letterSpacing: 0.5 },
    notificationIcon: { backgroundColor: COLORS.inputBg, borderRadius: 20, width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    notificationDot: { position: "absolute", top: 10, right: 10, width: 8, height: 8, backgroundColor: "#ff4d4d", borderRadius: 4 },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between", // Pushes cards to the absolute edges
        width: "100%",                  // Ensures it spans the full container width
        marginBottom: 20,
    },
    columnLayout: { flexDirection: "column" },
    bottomRow: {
        flexDirection: "row",
        alignItems: "flex-start", // Ensures both columns start at the same top point
        width: "100%",
    },
    profileCard: {
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 25,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border
     },
    profileLogo: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#111", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: COLORS.primary, marginRight: 15 },
    logoText: { color: COLORS.primary, fontWeight: "bold", fontSize: 35 },
    profileInfo: { flex: 1 },
    profileName: { color: COLORS.text, fontSize: 22 , fontWeight: "bold", marginBottom: 8 },
    profileTags: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
    tagId: { color: COLORS.primary, fontSize: 14, marginRight: 15 },
    profileEmail: { color: COLORS.textMuted, fontSize: 13 },
    tagActive: { color: COLORS.success, fontSize: 12, fontWeight: "bold", marginTop: 4 },
    performanceCard: {
        backgroundColor: COLORS.card,
        borderRadius: 15,
        padding: 25,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        marginBottom: 20,
    },
    perfHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    sectionLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
    trendUp: { color: COLORS.success, fontSize: 13, fontWeight: "bold" },
    gradeRow: { flexDirection: "row", alignItems: "center" },
    gradeBox: { backgroundColor: COLORS.primary, width: 70, height: 70, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 20 },
    gradeText: { color: "#000", fontSize: 36, fontWeight: "bold" },
    gradeDetails: { flex: 1 },
    gradeRemark: { color: COLORS.text, fontSize: 18, fontWeight: "bold", marginBottom: 5 },
    gradeSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
    progressBar: { height: 6, backgroundColor: COLORS.inputBg, borderRadius: 3, width: "100%" },
    progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3, width: "75%" },
    mainContentArea: { marginBottom: 20 },
    sidebarArea: { backgroundColor: COLORS.card, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "bold", marginBottom: 20, letterSpacing: 1 },
    gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    gridItem: {
            backgroundColor: COLORS.card, width: "31%", aspectRatio: 1.3, borderRadius: 15,
            justifyContent: "center", alignItems: "center", marginBottom: 20, borderWidth: 1,
            borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    chartStyle: { borderRadius: 15 },
    gridText: { color: COLORS.text, marginTop: 10, fontWeight: "bold", fontSize: 13 },
    sidebarArea: { backgroundColor: COLORS.card, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    recentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
    seeAllText: { color: COLORS.primary, fontSize: 12, fontWeight: "bold" },
    activityList: { marginTop: 5},
    activityItem: {
        flexDirection: "row",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    activityItem: { flexDirection: "row", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: "center" },
    activityIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.inputBg, justifyContent: "center", alignItems: "center", marginRight: 15 },
    activityDetails: { flex: 1 },
    activityTitle: { color: COLORS.text, fontWeight: "bold", fontSize: 14, marginBottom: 3 },
    activitySub: { color: COLORS.textMuted, fontSize: 12 },
    chartContainer: {
            backgroundColor: COLORS.card,
            borderRadius: 15,
            paddingTop: 20,
            paddingBottom: 10,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 35,
    },
    chartStyle: {
            borderRadius: 16,
        }
});