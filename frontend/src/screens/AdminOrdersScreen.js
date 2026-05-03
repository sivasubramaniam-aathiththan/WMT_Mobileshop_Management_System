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
const STATUS_COLORS = {
  pending:    { bg: "#2a1a00", color: "#cc8800" },
  confirmed:  { bg: "#0f1a2e", color: "#4a9eff" },
  processing: { bg: "#1a0f2a", color: "#aa6eff" },
  shipped:    { bg: "#0a1a2a", color: "#4a9eff" },
  delivered:  { bg: "#0f2a00", color: "#8abf00" },
  cancelled:  { bg: "#2a1010", color: "#ff6b6b" },
};

export default function AdminOrdersScreen({ navigation }) {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState("all");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/order/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/order/${orderId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) =>
        prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const revenue  = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.totalAmount, 0);

  const renderOrder = ({ item }) => {
    const st     = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const isOpen = expanded === item._id;

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardHead} onPress={() => toggle(item._id)} activeOpacity={0.8}>
          <View style={{ flex: 1 }}>
            <Text style={s.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={s.customerName}>{item.user?.name || "Unknown"} · {item.user?.email || ""}</Text>
            <Text style={s.orderDate}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={s.headRight}>
            <Text style={s.orderAmount}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[s.statusText, { color: st.color }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.cardBody}>
            {/* Status picker */}
            <Text style={s.sectionLabel}>Update Status</Text>
            <View style={s.pickerWrap}>
              <Picker
                selectedValue={item.status}
                onValueChange={(val) => handleStatusChange(item._id, val)}
                style={s.picker}
                dropdownIconColor="#fff"
              >
                {STATUSES.map((st) => (
                  <Picker.Item key={st} label={st.charAt(0).toUpperCase() + st.slice(1)} value={st} color="#fff" />
                ))}
              </Picker>
            </View>

            {/* Items */}
            <Text style={s.sectionLabel}>Items</Text>
            {item.items.map((i, idx) => (
              <View key={idx} style={s.item}>
                <View style={s.itemThumb}>
                  {i.image
                    ? <Image source={{ uri: `${BASE_URL}/${i.image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    : <Text>📦</Text>
                  }
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
                <Text style={s.detailText}>
                  {item.address.fullName}{"\n"}{item.address.phone}{"\n"}
                  {item.address.street}{"\n"}{item.address.city}, {item.address.state}
                </Text>
              </View>
              <View style={[s.detailBox, { flex: 1 }]}>
                <Text style={s.sectionLabel}>Payment</Text>
                <Text style={s.detailText}>
                  {item.payment.cardHolder}{"\n"}....{item.payment.lastFour}
                </Text>
                <View style={s.paidBadge}><Text style={s.paidText}>Paid</Text></View>
              </View>
            </View>

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Order total</Text>
              <Text style={s.totalAmount}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Management</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#e8ff47" />}
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
              {/* Stats */}
              <View style={s.stats}>
                <View style={s.statCard}><Text style={s.statLabel}>Revenue</Text><Text style={[s.statValue, { color: "#e8ff47", fontSize: 16 }]}>Rs. {revenue.toLocaleString()}</Text></View>
                <View style={s.statCard}><Text style={s.statLabel}>Total Orders</Text><Text style={[s.statValue, { color: "#e8ff47" }]}>{orders.length}</Text></View>
                <View style={s.statCard}><Text style={s.statLabel}>Pending</Text><Text style={[s.statValue, { color: "#cc8800" }]}>{orders.filter((o) => o.status === "pending").length}</Text></View>
              </View>

              {/* Filter */}
              <View style={s.filterRow}>
                {["all", ...STATUSES].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[s.filterBtn, filter === f && s.filterBtnActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[s.filterBtnText, filter === f && s.filterBtnTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.resultCount}>{filtered.length} orders</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={s.emptyText}>{"No orders with status `"}{filter}{"`"}</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  stats:       { flexDirection: "row", gap: 8, marginBottom: 14 },
  statCard:    { flex: 1, backgroundColor: "#141414", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#1e1e1e" },
  statLabel:   { fontSize: 11, color: "#555", marginBottom: 4 },
  statValue:   { fontSize: 18, fontWeight: "700", fontFamily: "monospace" },
  filterRow:   { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  filterBtn:   { backgroundColor: "#141414", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  filterBtnActive: { backgroundColor: "#e8ff47", borderColor: "#e8ff47" },
  filterBtnText:   { color: "#666", fontSize: 12, fontWeight: "500" },
  filterBtnTextActive: { color: "#0a0a0a", fontWeight: "700" },
  resultCount: { fontSize: 12, color: "#555", marginBottom: 10 },
  card:        { backgroundColor: "#141414", borderRadius: 12, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 10 },
  cardHead:    { padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderId:     { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "monospace" },
  customerName:{ fontSize: 12, color: "#888", marginTop: 2 },
  orderDate:   { fontSize: 11, color: "#555", marginTop: 2 },
  headRight:   { alignItems: "flex-end", gap: 6 },
  orderAmount: { fontSize: 14, fontWeight: "700", color: "#e8ff47" },
  statusBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 11, fontWeight: "600" },
  cardBody:    { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#1e1e1e" },
  sectionLabel:{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, fontWeight: "600", marginTop: 10, marginBottom: 6 },
  pickerWrap:  { backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 4 },
  picker:      { color: "#fff" },
  item:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  itemThumb:   { width: 40, height: 40, borderRadius: 6, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  itemInfo:    { flex: 1 },
  itemTitle:   { fontSize: 13, color: "#fff", fontWeight: "500" },
  itemMeta:    { fontSize: 12, color: "#555" },
  itemTotal:   { fontSize: 13, color: "#e8ff47", fontWeight: "600" },
  row2:        { flexDirection: "row", gap: 8, marginTop: 8 },
  detailBox:   { backgroundColor: "#1a1a1a", borderRadius: 8, padding: 10 },
  detailText:  { fontSize: 12, color: "#888", lineHeight: 18 },
  paidBadge:   { backgroundColor: "#0f2a00", borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  paidText:    { fontSize: 11, color: "#8abf00", fontWeight: "600" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTopWidth: 1, borderTopColor: "#1e1e1e" },
  totalLabel:  { fontSize: 14, fontWeight: "600", color: "#fff" },
  totalAmount: { fontSize: 15, fontWeight: "700", color: "#e8ff47" },
  emptyText:   { color: "#555", textAlign: "center", marginTop: 40, fontSize: 14 },
  errorText:   { color: "#ff6b6b", textAlign: "center", marginTop: 40 },
});