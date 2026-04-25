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
import * as Print from 'expo-print'; // <-- jspdf වෙනුවට අලුතින් ආපු Expo Print එක
import api from "../../services/api";

// ඔයාගේ Theme Colors ටික
const COLORS = {
  background: "#0f0f0f",
  card: "#1a1a1a",
  border: "#292929",
  text: "#ffffff",
  textMuted: "#aaaaaa",
  primary: "#f3be0f",
  success: "#1faa59",
  danger: "#ff4d4d",
  inputBg: "#222222",
};

export default function SupplierReport() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [allSuppliers, setAllSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive'
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/api/suppliers");
      const data = res.data || [];
      setAllSuppliers(data);
      setFilteredSuppliers(data);

      const now = new Date();
      setGeneratedAt(now.toLocaleDateString() + " at " + now.toLocaleTimeString());
    } catch (err) {
      console.log("Error fetching suppliers:", err);
    }
  };

  // --- Filtering Logic ---
  useEffect(() => {
    let result = allSuppliers;

    // Filter by Status
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status?.toLowerCase() === statusFilter);
    }

    // Search by Name or Company
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.companyName?.toLowerCase().includes(query)
      );
    }

    setFilteredSuppliers(result);
  }, [searchQuery, statusFilter, allSuppliers]);

  // --- Summary Data ---
  const totalCount = allSuppliers.length;
  const activeCount = allSuppliers.filter((s) => s.status?.toLowerCase() === "active").length;
  const inactiveCount = totalCount - activeCount;

  // --- Chart Data ---
  const chartData = [
    {
      name: "Active",
      population: activeCount,
      color: COLORS.success,
      legendFontColor: COLORS.textMuted,
      legendFontSize: 14,
    },
    {
      name: "Inactive",
      population: inactiveCount,
      color: COLORS.danger,
      legendFontColor: COLORS.textMuted,
      legendFontSize: 14,
    },
  ];

  // --- Export Functions ---
  const downloadPDF = async () => {
    try {
      const tableRows = filteredSuppliers.map(s => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${s.name || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${s.companyName || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${s.email || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${s.phone || '-'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: bold; color: ${s.status === 'active' ? '#1faa59' : '#ff4d4d'};">
            ${s.status?.toUpperCase() || '-'}
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
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
              th { background-color: #f3be0f; color: #000; padding: 12px; text-align: left; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Supplier Master Report</h1>
              <div class="date">Generated on: ${generatedAt}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
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

      // Print/Save as PDF Dialog එක Open කරනවා
      await Print.printAsync({
        html: htmlContent,
      });

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadCSV = () => {
    const headers = ["Name", "Company", "Email", "Phone", "Status"];
    const rows = filteredSuppliers.map(s =>
      [s.name, s.companyName, s.email, s.phone, s.status?.toUpperCase()].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Supplier_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* Header & Export Buttons */}
      <View style={[styles.headerRow, !isDesktop && { flexDirection: "column", alignItems: "flex-start" }]}>
        <View>
          <Text style={styles.header}>Supplier Analytics Report</Text>
          <Text style={styles.subHeader}>Real-time supplier status and directory</Text>
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
          <Ionicons name="people" size={30} color={COLORS.primary} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Total Suppliers</Text>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="checkmark-circle" size={30} color={COLORS.success} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Active</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>{activeCount}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="close-circle" size={30} color={COLORS.danger} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Inactive / Pending</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{inactiveCount}</Text>
          </View>
        </View>
      </View>

      {/* Chart & Filtering Row */}
      <View style={[styles.middleSection, !isDesktop && { flexDirection: "column" }]}>

        {/* Pie Chart */}
        <View style={[styles.chartContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Status Distribution</Text>
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
             <Text style={styles.textMuted}>No data available for chart</Text>
          )}
        </View>

        {/* Filters */}
        <View style={[styles.filterContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Search & Filter</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or company..."
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
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Data List */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Directory List ({filteredSuppliers.length})</Text>

      {filteredSuppliers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.textMuted}>No suppliers found matching your filters.</Text>
        </View>
      ) : (
        filteredSuppliers.map((s) => (
          <View key={s._id} style={styles.listCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.companyName}>{s.companyName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: s.status === "active" ? 'rgba(31, 170, 89, 0.2)' : 'rgba(255, 77, 77, 0.2)' }]}>
                 <Text style={[styles.statusText, { color: s.status === "active" ? COLORS.success : COLORS.danger }]}>
                    ● {s.status?.toUpperCase() || "UNKNOWN"}
                 </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Contact Person</Text>
                 <Text style={styles.value}>{s.name}</Text>
               </View>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Phone</Text>
                 <Text style={styles.value}>{s.phone}</Text>
               </View>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Email</Text>
                 <Text style={styles.value}>{s.email}</Text>
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
  companyName: { color: COLORS.text, fontSize: 18, fontWeight: "bold" },
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