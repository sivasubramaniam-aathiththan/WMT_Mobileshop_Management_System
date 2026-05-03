import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

const STATUS_COLORS = {
  pending:    { bg: "#2a1a00", color: "#cc8800" },
  confirmed:  { bg: "#0f1a2e", color: "#4a9eff" },
  processing: { bg: "#1a0f2a", color: "#aa6eff" },
  shipped:    { bg: "#0a1a2a", color: "#4a9eff" },
  delivered:  { bg: "#0f2a00", color: "#8abf00" },
  cancelled:  { bg: "#2a1010", color: "#ff6b6b" },
};

export default function MyOrdersScreen({ navigation }) {
  const { token } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/order/myorders`, {
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

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  const renderOrder = ({ item }) => {
    const st     = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const isOpen = expanded === item._id;

    return (
      <View style={s.card}>
        <TouchableOpacity style={s.cardHead} onPress={() => toggle(item._id)} activeOpacity={0.8}>
          <View>
            <Text style={s.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
            <Text style={s.orderDate}>
              {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>
          <View style={s.headRight}>
            <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={[s.statusText, { color: st.color }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={s.orderTotal}>Rs. {item.totalAmount?.toLocaleString()}</Text>
            <Text style={s.expandIcon}>{isOpen ? "▲" : "▼"}</Text>
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={s.cardBody}>
            <Text style={s.sectionLabel}>Items</Text>
            {item.items.map((i, idx) => (
              <View key={idx} style={s.item}>
                <View style={s.itemThumb}>
                  {i.image ? (
                    <Image source={{ uri: `${BASE_URL}/${i.image}` }} style={s.itemImg} resizeMode="cover" />
                  ) : <Text>📦</Text>}
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
              <Text style={s.detailText}>
                {item.payment.cardHolder}{"\n"}
                Card ending ....{item.payment.lastFour}
              </Text>
              <View style={s.paidBadge}><Text style={s.paidText}>✓ Paid</Text></View>
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
        <Text style={s.headerTitle}>My Orders</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#e8ff47" />}
      {!!error && <Text style={s.errorText}>{error}</Text>}

      {!loading && orders.length === 0 && (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>📦</Text>
          <Text style={s.emptyText}>No orders yet</Text>
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
  page:    { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  subtitle:    { color: "#555", fontSize: 13, marginBottom: 12 },
  card:        { backgroundColor: "#141414", borderRadius: 12, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 12 },
  cardHead:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  orderId:     { fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: "monospace" },
  orderDate:   { fontSize: 12, color: "#555", marginTop: 2 },
  headRight:   { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 12, fontWeight: "600" },
  orderTotal:  { fontSize: 14, fontWeight: "700", color: "#e8ff47" },
  expandIcon:  { fontSize: 10, color: "#555" },
  cardBody:    { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#1e1e1e" },
  sectionLabel:{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  item:        { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  itemThumb:   { width: 44, height: 44, borderRadius: 6, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  itemImg:     { width: "100%", height: "100%" },
  itemInfo:    { flex: 1 },
  itemTitle:   { fontSize: 13, fontWeight: "500", color: "#fff" },
  itemMeta:    { fontSize: 12, color: "#555" },
  itemTotal:   { fontSize: 13, fontWeight: "700", color: "#e8ff47" },
  detailBox:   { backgroundColor: "#1a1a1a", borderRadius: 8, padding: 10 },
  detailText:  { fontSize: 13, color: "#888", lineHeight: 20 },
  paidBadge:   { backgroundColor: "#0f2a00", borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 6 },
  paidText:    { fontSize: 12, color: "#8abf00", fontWeight: "600" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: "#1e1e1e" },
  totalLabel:  { fontSize: 15, fontWeight: "600", color: "#fff" },
  totalAmount: { fontSize: 16, fontWeight: "700", color: "#e8ff47" },
  empty:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emptyText:   { color: "#555", fontSize: 15 },
  shopBtn:     { backgroundColor: "#e8ff47", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  shopBtnText: { color: "#0a0a0a", fontWeight: "700" },
  errorText:   { color: "#ff6b6b", textAlign: "center", marginTop: 40, fontSize: 14 },
});