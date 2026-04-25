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

// Theme Colors (Matches your dark theme)
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

// Colors for the Pie Chart
const CHART_COLORS = ["#f3be0f", "#1faa59", "#ff4d4d", "#4a90e2", "#9b59b6", "#e67e22"];

export default function PaymentsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [mergedData, setMergedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      // Fetch both payment summary and suppliers to map names
      const [summaryRes, suppliersRes] = await Promise.all([
        api.get("/api/revenue-allocation/summary"),
        api.get("/api/suppliers")
      ]);

      const summary = summaryRes.data || [];
      const suppliers = suppliersRes.data || [];

      // Merge data to get supplier names instead of just IDs
      const formattedData = summary.map(item => {
        const supplier = suppliers.find(s => s._id === item._id);
        return {
          ...item,
          supplierName: supplier ? supplier.name : "Unknown Supplier",
          companyName: supplier ? supplier.companyName : "Unknown Company",
        };
      });

      setMergedData(formattedData);
      setFilteredData(formattedData);

      const now = new Date();
      setGeneratedAt(now.toLocaleDateString() + " at " + now.toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering Logic ---
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const result = mergedData.filter(
        (item) =>
          item.supplierName.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query) ||
          item._id.toLowerCase().includes(query)
      );
      setFilteredData(result);
    } else {
      setFilteredData(mergedData);
    }
  }, [searchQuery, mergedData]);

  // --- Summary Calculations ---
  const totalPendingAmount = mergedData.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalBookings = mergedData.reduce((sum, item) => sum + item.bookingCount, 0);
  const suppliersOwedCount = mergedData.length;

  // --- Chart Data ---
  const chartData = mergedData.map((item, index) => ({
    name: item.companyName.length > 12 ? item.companyName.substring(0, 12) + ".." : item.companyName,
    population: item.pendingAmount,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: COLORS.textMuted,
    legendFontSize: 12,
  }));

  // --- Export Functions ---
  const downloadPDF = async () => {
    try {
      const tableRows = filteredData.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.companyName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.supplierName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.bookingCount}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold; color: #1faa59;">Rs. ${item.pendingAmount.toFixed(2)}</td>
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
              .summary-box { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 8px; border-left: 5px solid #f3be0f; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Supplier Payment Settlement Report</h1>
              <div class="date">Generated on: ${generatedAt}</div>
            </div>
            <div class="summary-box">
              <strong>Total Pending Amount:</strong> Rs. ${totalPendingAmount.toFixed(2)} <br/>
              <strong>Total Suppliers Awaiting Payment:</strong> ${suppliersOwedCount} <br/>
              <strong>Total Bookings Covered:</strong> ${totalBookings}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th style="text-align: center;">Bookings</th>
                  <th style="text-align: right;">Pending Amount (Rs)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <div class="footer">Financial Report securely generated by Book and Go Management System</div>
          </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF.");
    }
  };

  const downloadCSV = () => {
    const headers = ["Company Name", "Contact Person", "Supplier ID", "Total Bookings", "Pending Amount (Rs)"];
    const rows = filteredData.map(item =>
      [
        `"${item.companyName}"`,
        `"${item.supplierName}"`,
        item._id,
        item.bookingCount,
        item.pendingAmount
      ].join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Pending_Payments_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>Fetching Payment Records...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* Header & Export Buttons */}
      <View style={[styles.headerRow, !isDesktop && { flexDirection: "column", alignItems: "flex-start" }]}>
        <View>
          <Text style={styles.header}>Revenue & Payments</Text>
          <Text style={styles.subHeader}>Manage and settle supplier pending allocations</Text>
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
        <View style={[styles.summaryCard, isDesktop && { flex: 1.5 }]}>
          <Ionicons name="wallet" size={30} color={COLORS.success} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Total Pending Payout</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>Rs. {totalPendingAmount.toLocaleString()}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="people" size={30} color={COLORS.primary} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Suppliers Owed</Text>
            <Text style={styles.summaryValue}>{suppliersOwedCount}</Text>
          </View>
        </View>
        <View style={[styles.summaryCard, isDesktop && { flex: 1 }]}>
          <Ionicons name="ticket" size={30} color={COLORS.info} style={styles.cardIcon} />
          <View>
            <Text style={styles.summaryTitle}>Total Bookings</Text>
            <Text style={[styles.summaryValue, { color: COLORS.text }]}>{totalBookings}</Text>
          </View>
        </View>
      </View>

      {/* Chart & Filtering Row */}
      <View style={[styles.middleSection, !isDesktop && { flexDirection: "column" }]}>

        {/* Pie Chart */}
        <View style={[styles.chartContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Pending Payout Distribution</Text>
          {mergedData.length > 0 ? (
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
             <Text style={styles.textMuted}>No pending payments available</Text>
          )}
        </View>

        {/* Filters & Search */}
        <View style={[styles.filterContainer, isDesktop && { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Search Records</Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by supplier or company..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Text style={[styles.textMuted, { fontSize: 12, marginTop: 10 }]}>
             Showing {filteredData.length} records. Payments are automatically generated when a booking status changes to COMPLETED.
          </Text>
        </View>
      </View>

      {/* Data List */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Pending Allocations List</Text>

      {filteredData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.textMuted}>No pending payments found.</Text>
        </View>
      ) : (
        filteredData.map((item) => (
          <View key={item._id} style={styles.listCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <Text style={styles.supplierName}>{item.supplierName}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amountLabel}>Pending Amount</Text>
                <Text style={styles.amountValue}>Rs. {item.pendingAmount.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Supplier ID</Text>
                 <Text style={styles.value} selectable={true}>{item._id}</Text>
               </View>
               <View style={styles.infoCol}>
                 <Text style={styles.label}>Completed Bookings</Text>
                 <View style={styles.bookingBadge}>
                    <Text style={styles.bookingBadgeText}>{item.bookingCount} Bookings</Text>
                 </View>
               </View>
            </View>
          </View>
        ))
      )}
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

  listCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 15, marginBottom: 15 },
  companyName: { color: COLORS.text, fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  supplierName: { color: COLORS.textMuted, fontSize: 13 },

  amountLabel: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4, textAlign: 'right' },
  amountValue: { color: COLORS.success, fontSize: 22, fontWeight: "bold" },

  cardBody: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  infoCol: { minWidth: 150, marginTop: 5 },
  label: { color: COLORS.textMuted, fontSize: 12, marginBottom: 6 },
  value: { color: COLORS.text, fontSize: 13, fontWeight: "500" },

  bookingBadge: { backgroundColor: 'rgba(74, 144, 226, 0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start' },
  bookingBadgeText: { color: COLORS.info, fontSize: 12, fontWeight: "bold" },

  emptyState: { padding: 30, alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
});