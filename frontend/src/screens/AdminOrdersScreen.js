import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const STATUS_CONFIG = {
  pending:    { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24", icon: "⏳", border: "rgba(245,158,11,0.3)" },
  confirmed:  { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa", icon: "✅", border: "rgba(59,130,246,0.3)" },
  processing: { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa", icon: "⚙️", border: "rgba(139,92,246,0.3)" },
  shipped:    { bg: "rgba(6,182,212,0.15)",   color: "#22d3ee", icon: "🚚", border: "rgba(6,182,212,0.3)" },
  delivered:  { bg: "rgba(16,185,129,0.15)",  color: "#34d399", icon: "📦", border: "rgba(16,185,129,0.3)" },
  cancelled:  { bg: "rgba(239,68,68,0.15)",   color: "#f87171", icon: "❌", border: "rgba(239,68,68,0.3)" },
};

export default function AdminOrdersScreen({ navigation }) {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/order/all`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.orders);
    } catch { setError("Failed to load orders."); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/order/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch { Alert.alert("Error", "Failed to update status."); }
  };

  const handleDeleteOrder = async (id) => {
    Alert.alert("Delete Order", "Delete this delivered order?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/order/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchOrders();
        } catch (e) { Alert.alert("Error", e.response?.data?.message || "Failed to delete."); }
      }},
    ]);
  };

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const revenue  = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totalAmount, 0);

  const renderOrder = ({ item }) => {
    const st     = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isOpen = expanded === item._id;

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardHead} onPress={() => toggle(item._id)} activeOpacity={0.8}>
          <View style={[s.statusIcon, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={{ fontSize: 16 }}>{st.icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={s.customerName}>{item.user?.name || "Unknown"}</Text>
            <Text style={s.orderDate}>{new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={s.orderAmount}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[s.statusText, { color: st.color }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.cardBody}>
            <Text style={s.sectionLabel}>Update Status</Text>
            <View style={s.pickerWrap}>
              <Picker selectedValue={item.status} onValueChange={(val) => handleStatusChange(item._id, val)} style={s.picker} dropdownIconColor="#a78bfa">
                {STATUSES.map((st) => (
                  <Picker.Item key={st} label={st.charAt(0).toUpperCase() + st.slice(1)} value={st} color="#fff" />
                ))}
              </Picker>
            </View>

            <Text style={s.sectionLabel}>Items</Text>
            {item.items.map((i, idx) => (
              <View key={idx} style={s.item}>
                <View style={s.itemThumb}>
                  {i.image ? <Image source={{ uri: i.image.startsWith("http") ? i.image : `${BASE_URL}/${i.image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <Text>📦</Text>}
                </View>
                <View style={s.itemInfo}>
                  <Text style={s.itemTitle}>{i.title}</Text>
                  <Text style={s.itemMeta}>Rs. {i.price?.toLocaleString()} × {i.qty}</Text>
                </View>
                <Text style={s.itemTotal}>Rs. {(i.price * i.qty).toLocaleString()}</Text>
              </View>
            ))}

            <View style={s.row2}>
              <View style={[s.detailBox, { flex: 1 }]}>
                <Text style={s.sectionLabel}>Address</Text>
                <Text style={s.detailText}>{item.address.fullName}{"\n"}{item.address.phone}{"\n"}{item.address.street}{"\n"}{item.address.city}</Text>
              </View>
              <View style={[s.detailBox, { flex: 1 }]}>
                <Text style={s.sectionLabel}>Payment</Text>
                <Text style={s.detailText}>{item.payment.cardHolder}{"\n"}....{item.payment.lastFour}</Text>
                <View style={s.paidBadge}><Text style={s.paidText}>✓ Paid</Text></View>
              </View>
            </View>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Order total</Text>
              <Text style={s.totalAmount}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[s.deleteBtn, item.status !== "delivered" && s.deleteBtnDisabled]}
              onPress={() => item.status === "delivered" && handleDeleteOrder(item._id)}
              disabled={item.status !== "delivered"}
            >
              <Text style={[s.deleteBtnText, item.status !== "delivered" && s.deleteBtnTextDisabled]}>
                🗑️ Delete Order
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.blob1} /><View style={s.blob2} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#7c3aed" />}
      {!!error  && <Text style={s.errorText}>{error}</Text>}

      {!loading && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={s.stats}>
                <View style={[s.statCard, { borderColor: "rgba(124,58,237,0.4)" }]}>
                  <Text style={s.statEmoji}>💰</Text>
                  <Text style={[s.statValue, { color: "#a78bfa" }]}>Rs. {revenue.toLocaleString()}</Text>
                  <Text style={s.statLabel}>Revenue</Text>
                </View>
                <View style={[s.statCard, { borderColor: "rgba(6,182,212,0.4)" }]}>
                  <Text style={s.statEmoji}>📋</Text>
                  <Text style={[s.statValue, { color: "#22d3ee" }]}>{orders.length}</Text>
                  <Text style={s.statLabel}>Total Orders</Text>
                </View>
                <View style={[s.statCard, { borderColor: "rgba(245,158,11,0.4)" }]}>
                  <Text style={s.statEmoji}>⏳</Text>
                  <Text style={[s.statValue, { color: "#fbbf24" }]}>{orders.filter((o) => o.status === "pending").length}</Text>
                  <Text style={s.statLabel}>Pending</Text>
                </View>
              </View>

              <View style={s.filterRow}>
                {["all", ...STATUSES].map((f) => {
                  const cfg = STATUS_CONFIG[f];
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[s.filterBtn, filter === f && { backgroundColor: cfg?.bg || "rgba(124,58,237,0.2)", borderColor: cfg?.border || "rgba(124,58,237,0.5)" }]}
                      onPress={() => setFilter(f)}
                    >
                      <Text style={[s.filterBtnText, filter === f && { color: cfg?.color || "#a78bfa", fontWeight: "700" }]}>
                        {f === "all" ? "All" : cfg?.icon + " " + f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.resultCount}>{filtered.length} orders</Text>
            </View>
          }
          ListEmptyComponent={<Text style={s.emptyText}>No orders with status "{filter}"</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  blob1:       { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "#7c3aed", opacity: 0.2 },
  blob2:       { position: "absolute", bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: "#06b6d4", opacity: 0.15 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  backText:    { color: "#fff", fontSize: 18 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  stats:       { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard:    { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 12, borderWidth: 1, alignItems: "center" },
  statEmoji:   { fontSize: 20, marginBottom: 4 },
  statValue:   { fontSize: 16, fontWeight: "800" },
  statLabel:   { fontSize: 10, color: "#6b7280", marginTop: 2 },
  filterRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  filterBtn:   { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  filterBtnText:{ color: "#6b7280", fontSize: 12 },
  resultCount: { fontSize: 12, color: "#6b7280", marginBottom: 10 },
  card:        { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  cardHead:    { padding: 14, flexDirection: "row", alignItems: "center" },
  statusIcon:  { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  orderId:     { fontSize: 13, fontWeight: "700", color: "#f1f5f9", fontFamily: "monospace" },
  customerName:{ fontSize: 12, color: "#9ca3af", marginTop: 1 },
  orderDate:   { fontSize: 11, color: "#6b7280", marginTop: 1 },
  orderAmount: { fontSize: 14, fontWeight: "800", color: "#a78bfa" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:  { fontSize: 11, fontWeight: "700" },
  cardBody:    { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  sectionLabel:{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, fontWeight: "700", marginTop: 12, marginBottom: 8 },
  pickerWrap:  { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", marginBottom: 4 },
  picker:      { color: "#fff" },
  item:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  itemThumb:   { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  itemInfo:    { flex: 1 },
  itemTitle:   { fontSize: 13, color: "#f1f5f9", fontWeight: "600" },
  itemMeta:    { fontSize: 12, color: "#6b7280" },
  itemTotal:   { fontSize: 13, color: "#a78bfa", fontWeight: "700" },
  row2:        { flexDirection: "row", gap: 8, marginTop: 8 },
  detailBox:   { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  detailText:  { fontSize: 12, color: "#9ca3af", lineHeight: 18 },
  paidBadge:   { backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  paidText:    { fontSize: 11, color: "#34d399", fontWeight: "700" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  totalLabel:  { fontSize: 14, fontWeight: "700", color: "#f1f5f9" },
  totalAmount: { fontSize: 15, fontWeight: "800", color: "#a78bfa" },
  deleteBtn:         { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: "rgba(239,68,68,0.15)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
  deleteBtnDisabled: { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" },
  deleteBtnText:     { fontSize: 13, fontWeight: "700", color: "#f87171" },
  deleteBtnTextDisabled: { color: "#374151" },
  emptyText:   { color: "#6b7280", textAlign: "center", marginTop: 40, fontSize: 14 },
  errorText:   { color: "#fca5a5", textAlign: "center", marginTop: 40 },
});
