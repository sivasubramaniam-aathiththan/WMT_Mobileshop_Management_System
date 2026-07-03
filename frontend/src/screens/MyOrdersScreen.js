import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

const STATUS_CONFIG = {
  pending:    { bg: "rgba(245,158,11,0.15)",  color: "#fbbf24", icon: "⏳", border: "rgba(245,158,11,0.3)" },
  confirmed:  { bg: "rgba(59,130,246,0.15)",  color: "#60a5fa", icon: "✅", border: "rgba(59,130,246,0.3)" },
  processing: { bg: "rgba(139,92,246,0.15)",  color: "#a78bfa", icon: "⚙️", border: "rgba(139,92,246,0.3)" },
  shipped:    { bg: "rgba(6,182,212,0.15)",   color: "#22d3ee", icon: "🚚", border: "rgba(6,182,212,0.3)" },
  delivered:  { bg: "rgba(16,185,129,0.15)",  color: "#34d399", icon: "📦", border: "rgba(16,185,129,0.3)" },
  cancelled:  { bg: "rgba(239,68,68,0.15)",   color: "#f87171", icon: "❌", border: "rgba(239,68,68,0.3)" },
};

export default function MyOrdersScreen({ navigation }) {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/order/myorders`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data.orders);
    } catch { setError("Failed to load orders."); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  const cancelOrder = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/order/${id}/status`, { status: "cancelled" }, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Failed to cancel."); }
  };

  const deleteOrder = async (id) => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const res = await axios.delete(`${API_BASE_URL}/order/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 200) fetchOrders();
        } catch (e) { Alert.alert("Error", e.response?.data?.message || "Failed to delete."); }
      }},
    ]);
  };

  const markArrived = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/order/${id}/status`, { status: "delivered" }, { headers: { Authorization: `Bearer ${token}` } });
      fetchOrders();
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Failed to update."); }
  };

  const renderOrder = ({ item }) => {
    const st         = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isOpen     = expanded === item._id;
    const isPending  = item.status === "pending";
    const isCancelled = item.status === "cancelled";

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardHead} onPress={() => toggle(item._id)} activeOpacity={0.8}>
          <View style={[s.statusIconWrap, { backgroundColor: st.bg, borderColor: st.border }]}>
            <Text style={{ fontSize: 18 }}>{st.icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={s.orderDate}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={[s.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
              <Text style={[s.statusText, { color: st.color }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={s.orderTotal}>Rs. {item.totalAmount?.toLocaleString()}</Text>
          </View>
          <Text style={s.expandIcon}>{isOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.cardBody}>
            <Text style={s.sectionLabel}>Items</Text>
            {item.items.map((i, idx) => (
              <View key={idx} style={s.item}>
                <View style={s.itemThumb}>
                  {i.image
                    ? <Image source={{ uri: i.image.startsWith("http") ? i.image : `${BASE_URL}/${i.image}` }} style={s.itemImg} resizeMode="cover" />
                    : <Text>📦</Text>}
                </View>
                <View style={s.itemInfo}>
                  <Text style={s.itemTitle}>{i.title}</Text>
                  <Text style={s.itemMeta}>Rs. {i.price?.toLocaleString()} × {i.qty}</Text>
                </View>
                <Text style={s.itemTotal}>Rs. {(i.price * i.qty).toLocaleString()}</Text>
              </View>
            ))}

            <Text style={s.sectionLabel}>Delivery Address</Text>
            <View style={s.detailBox}>
              <Text style={s.detailText}>
                {item.address.fullName} · {item.address.phone}{"\n"}
                {item.address.street}, {item.address.city}, {item.address.state} {item.address.zip}
              </Text>
            </View>

            <Text style={s.sectionLabel}>Payment</Text>
            <View style={s.detailBox}>
              <Text style={s.detailText}>{item.payment.cardHolder}{"\n"}Card ending ....{item.payment.lastFour}</Text>
              <View style={s.paidBadge}><Text style={s.paidText}>✓ Paid</Text></View>
            </View>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Order total</Text>
              <Text style={s.totalAmount}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            </View>

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, s.cancelBtn, !isPending && s.disabledBtn]}
                onPress={() => isPending && cancelOrder(item._id)}
                disabled={!isPending}
              >
                <Text style={[s.actionBtnText, !isPending && s.disabledText]}>✕ Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, s.deleteBtn, !isCancelled && s.disabledBtn]}
                onPress={() => isCancelled && deleteOrder(item._id)}
                disabled={!isCancelled}
              >
                <Text style={[s.actionBtnText, !isCancelled && s.disabledText]}>🗑 Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.arrivedBtn]} onPress={() => markArrived(item._id)}>
                <Text style={s.actionBtnText}>📦 Arrived</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.blob} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Orders 📦</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#7c3aed" />}
      {!!error  && <Text style={s.errorText}>{error}</Text>}

      {!loading && orders.length === 0 && (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}><Text style={{ fontSize: 52 }}>📭</Text></View>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySubtitle}>Start shopping to see your orders here</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={s.shopBtnText}>Start Shopping →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && orders.length > 0 && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={s.subtitle}>{orders.length} order{orders.length !== 1 ? "s" : ""} placed</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:         { flex: 1, backgroundColor: "#0f0c29" },
  blob:         { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "#7c3aed", opacity: 0.2 },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  backBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  backText:     { color: "#fff", fontSize: 18 },
  headerTitle:  { fontSize: 18, fontWeight: "800", color: "#fff" },
  subtitle:     { color: "#6b7280", fontSize: 13, marginBottom: 14 },
  card:         { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 12 },
  cardHead:     { flexDirection: "row", alignItems: "center", padding: 14 },
  statusIconWrap:{ width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  orderId:      { fontSize: 14, fontWeight: "700", color: "#f1f5f9", fontFamily: "monospace" },
  orderDate:    { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText:   { fontSize: 11, fontWeight: "700" },
  orderTotal:   { fontSize: 14, fontWeight: "800", color: "#a78bfa" },
  expandIcon:   { fontSize: 10, color: "#6b7280", marginLeft: 8 },
  cardBody:     { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  sectionLabel: { fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, fontWeight: "700", marginTop: 14, marginBottom: 8 },
  item:         { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  itemThumb:    { width: 44, height: 44, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  itemImg:      { width: "100%", height: "100%" },
  itemInfo:     { flex: 1 },
  itemTitle:    { fontSize: 13, fontWeight: "600", color: "#f1f5f9" },
  itemMeta:     { fontSize: 12, color: "#6b7280" },
  itemTotal:    { fontSize: 13, fontWeight: "800", color: "#a78bfa" },
  detailBox:    { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  detailText:   { fontSize: 13, color: "#9ca3af", lineHeight: 20 },
  paidBadge:    { backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 6, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  paidText:     { fontSize: 12, color: "#34d399", fontWeight: "700" },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
  totalLabel:   { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  totalAmount:  { fontSize: 16, fontWeight: "800", color: "#a78bfa" },
  actionRow:    { flexDirection: "row", gap: 8, marginTop: 14 },
  actionBtn:    { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  cancelBtn:    { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.4)" },
  deleteBtn:    { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  arrivedBtn:   { backgroundColor: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.4)" },
  disabledBtn:  { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText:{ fontSize: 12, fontWeight: "700", color: "#f1f5f9" },
  disabledText: { color: "#374151" },
  empty:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyIconWrap:{ width: 100, height: 100, borderRadius: 24, backgroundColor: "rgba(124,58,237,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: "rgba(124,58,237,0.3)" },
  emptyTitle:   { fontSize: 20, fontWeight: "800", color: "#fff" },
  emptySubtitle:{ fontSize: 14, color: "#6b7280", textAlign: "center" },
  shopBtn:      { backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  shopBtnText:  { color: "#fff", fontWeight: "800", fontSize: 15 },
  errorText:    { color: "#fca5a5", textAlign: "center", marginTop: 40, fontSize: 14 },
});
