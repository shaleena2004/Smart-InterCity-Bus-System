import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import * as Print from 'expo-print';
import api from "../../services/api";

// Theme Colors
const COLORS = {
  background: "#0f0f0f",
  card: "#1a1a1a",
  border: "#292929",
  text: "#ffffff",
  textMuted: "#aaaaaa",
  primary: "#f3be0f",
  success: "#1faa59",
  danger: "#ff4d4d",
  info: "#4a90e2",
  inputBg: "#222222",
};

export default function BusReport() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [allBuses, setAllBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch both buses and suppliers simultaneously
      const [busRes, supRes] = await Promise.all([
        api.get("/api/buses"),
        api.get("/api/suppliers")
      ]);

      const busData = busRes.data || [];
      setAllBuses(busData);
      setFilteredBuses(busData);
      setSuppliers(supRes.data || []);

      const now = new Date();
      setGeneratedAt(now.toLocaleDateString() + " at " + now.toLocaleTimeString());
    } catch (err) {
      console.log("Error fetching bus data:", err);
    }
  };

  const getSupplierName = (id) => {
    // Handle both cases: if supplierId is an object (populated) or just an ID string
    const targetId = typeof id === 'object' && id !== null ? id._id : id;
    const s = suppliers.find((x) => x._id === targetId);
    return s ? s.name : "Unknown Supplier";
  };

  // --- Filtering Logic ---
  useEffect(() => {
    let result = allBuses;

    // Filter by Status
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status?.toLowerCase() === statusFilter);
    }

    // Search by Bus Number or Plate Number
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.busNumber?.toLowerCase().includes(query) ||
          b.plateNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredBuses(result);
  }, [searchQuery, statusFilter, allBuses]);

  // --- Summary Data ---
  const totalCount = allBuses.length;
  const activeCount = allBuses.filter((b) => b.status?.toLowerCase() === "active").length;
  const inactiveCount = totalCount - activeCount;

  // --- Chart Data ---
  const chartData = [
    {
      name: "Active Fleet",
      population: activeCount,
      color: COLORS.success,
      legendFontColor: COLORS.textMuted,
      legendFontSize: 13,
    },
    {
      name: "Maintenance/Offline",
      population: inactiveCount,
      color: COLORS.danger,
      legendFontColor: COLORS.textMuted,
      legendFontSize: 13,
    },
  ];

  // --- Export Functions ---
  const downloadPDF = async () => {
    try {
      const tableRows = filteredBuses.map(b => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: bold;">${b.busNumber || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${b.plateNumber || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${b.busType || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${b.seatCount || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${getSupplierName(b.supplierId)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${b.status === 'active' ? '#1faa59' : '#ff4d4d'};">
            ${b.status?.toUpperCase() || '-'}
          </td>
        </tr>
      `).join("");

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              h1 { color: #1a1a1a; margin-bottom: 5px; }
              .date { color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
              th { background-color: #f3be0f; color: #000; padding: 12px; text-align: left; text-transform: uppercase; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Fleet Management Report</h1>
              <div class="date">Generated on: ${generatedAt}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Bus No.</th>
                  <th>Plate No.</th>
                  <th>Type</th>
                  <th>Seats</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="footer">Report generated securely by Book and Go Management System</div>
          </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadCSV = () => {
    const headers = ["Bus Number", "Plate Number", "Type", "Seats", "Supplier Name", "Status"];
    const rows = filteredBuses.map(b =>
      [
        b.busNumber,
        b.plateNumber,
        b.busType,
        b.seatCount,
        `"${getSupplierName(b.supplierId)}"`, // Quotes to handle spaces/commas in names
        b.status?.toUpperCase()
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Fleet_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* Header & Export Buttons */}
      <View style={[styles.headerRow, !isDesktop && { flexDirection: "column", alignItems: "flex-start" }]}>
        <View>
          <Text style={styles.header}>Fleet Analytics Report</Text>
          <Text style={styles.subHeader}>Real-time bus availability and tracking</Text>
        </View>

        <View style={[styles.exportBtnGroup, !isDesktop && { marginTop: 15 }]}>
          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.primary }]} onPress={downloadCSV}>
            <Ionicons name="document-text" size={16} color="#000" />
            <Text style={[styles.exportBtnText, { color: "#000" }]}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: COLORS.danger }]} onPress={downloadPDF}>
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportBtnText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analytics Summary Cards */}
      <View style={[styles.summaryGrid, !isDesktop && { flexDirection: "column" }]}>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="bus" size={30} color={COLORS.primary} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Total Fleet</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="speedometer" size={30} color={COLORS.success} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Active</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{activeCount}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="build" size={30} color={COLORS.danger} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Maintenance</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{inactiveCount}</Text>
          </View>
        </View>
      </View>

      {/* Chart & Filtering Row */}
      <View style={[styles.middleSection, !isDesktop && { flexDirection: "column" }]}>

        {/* Pie Chart */}
        <View style={[styles.chartContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Fleet Status Overview</Text>
          {totalCount > 0 ? (
            <PieChart
              data={chartData}
              width={isDesktop ? 300 : width - 80}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
          ) : (
             <Text style={styles.textMuted}>No fleet data available</Text>
          )}
        </View>

        {/* Filters */}
        <View style={[styles.filterContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Search & Filter</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Bus No or Plate..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.statusFilters}>
            {['all', 'active', 'inactive'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.filterChipText,
                  statusFilter === status && { color: "#000" }
                ]}>
                  {status === 'inactive' ? 'MAINTENANCE' : status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Data List */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Fleet Directory ({filteredBuses.length})</Text>

      {filteredBuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.textMuted}>No buses found matching your search.</Text>
        </View>
      ) : (
        filteredBuses.map((b) => (
          <View key={b._id} style={styles.listCard}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="bus-outline" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.busName}>{b.busNumber}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: b.status === "active" ? 'rgba(31, 170, 89, 0.2)' : 'rgba(255, 77, 77, 0.2)' }]}>
                 <Text style={[styles.statusText, { color: b.status === "active" ? COLORS.success : COLORS.danger }]}>
                    ● {b.status?.toUpperCase() || "UNKNOWN"}
                 </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Plate Number</Text>
                 <Text style={styles.value}>{b.plateNumber}</Text>
               </View>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Type & Seats</Text>
                 <Text style={styles.value}>{b.busType} ({b.seatCount} Seats)</Text>
               </View>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Supplier</Text>
                 <Text style={[styles.value, { color: COLORS.info }]}>{getSupplierName(b.supplierId)}</Text>
               </View>
            </View>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Report strictly generated for management on {generatedAt}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 25 },
  header: { color: COLORS.text, fontSize: 28, fontWeight: "bold" },
  subHeader: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },

  exportBtnGroup: { flexDirection: "row", gap: 10 },
  exportBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, gap: 8 },
  exportBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  summaryGrid: { flexDirection: "row", gap: 15, marginBottom: 25 },
  summaryCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: 15 },
  cardIcon: { backgroundColor: COLORS.inputBg, padding: 12, borderRadius: 10 },
  summaryTitle: { color: COLORS.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: "bold" },

  middleSection: { flexDirection: "row", gap: 20, marginBottom: 20 },
  chartContainer: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center" },
  filterContainer: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "bold", marginBottom: 15, letterSpacing: 0.5 },
  textMuted: { color: COLORS.textMuted },

  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.inputBg, borderRadius: 8, paddingHorizontal: 15, height: 45, marginBottom: 15 },
  searchInput: { flex: 1, color: COLORS.text, outlineStyle: 'none' },

  statusFilters: { flexDirection: "row", gap: 10 },
  filterChip: { backgroundColor: COLORS.inputBg, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "bold" },

  listCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 15 },
  busName: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "bold" },

  cardBody: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  infoCol: { minWidth: 150 },
  label: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: "500" },

  emptyState: { padding: 30, alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  footer: { marginTop: 30, alignItems: "center", paddingBottom: 20 },
  footerText: { color: COLORS.textMuted, fontSize: 11, fontStyle: "italic" },
});