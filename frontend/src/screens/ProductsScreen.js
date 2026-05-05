import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView, Modal,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

const CATEGORY_COLORS = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

export default function ProductsScreen({ navigation, route }) {
  const { logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [cart, setCart]         = useState([]);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (route.params?.updatedCart) { setCart(route.params.updatedCart); navigation.setParams({ updatedCart: null }); }
  }, [route.params?.updatedCart]);

  useEffect(() => {
    if (route.params?.orderSuccess) { setCart([]); setOrderDone(true); fetchProducts(); navigation.setParams({ orderSuccess: false }); }
  }, [route.params?.orderSuccess]);

  const fetchProducts = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/product/allproducts`);
      setProducts(res.data.products);
    } catch { setError("Failed to load products."); } finally { setLoading(false); }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if ((existing?.qty || 0) >= product.stock) return prev;
      if (existing) return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, product: product._id, qty: 1 }];
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const renderProduct = ({ item, index }) => {
    const inCart    = cart.some((i) => i._id === item._id);
    const cartQty   = cart.find((i) => i._id === item._id)?.qty || 0;
    const liveStock = item.stock - cartQty;
    const discount  = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
    const accentColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate("ProductDetail", { product: item, cart })}
        activeOpacity={0.88}
      >
        <View style={[s.cardImgWrap, { borderColor: accentColor + "44" }]}>
          {item.image ? (
            <Image
              source={{ uri: item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}` }}
              style={s.cardImg}
              resizeMode="cover"
            />
          ) : (
            <View style={[s.cardImgPlaceholder, { backgroundColor: accentColor + "22" }]}>
              <Text style={{ fontSize: 40 }}>📦</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={[s.discountBadge, { backgroundColor: accentColor }]}>
              <Text style={s.discountText}>{discount}%</Text>
            </View>
          )}
          {liveStock <= 0 && <View style={s.outOverlay}><Text style={s.outText}>Out of Stock</Text></View>}
        </View>

        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.name || item.title}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>

          <View style={s.priceRow}>
            <Text style={[s.price, { color: accentColor }]}>Rs. {item.price?.toLocaleString()}</Text>
            {item.mrp > item.price && <Text style={s.mrp}>Rs. {item.mrp?.toLocaleString()}</Text>}
          </View>

          <Text style={[s.stock, liveStock > 0 && liveStock < 5 && { color: "#f59e0b" }, liveStock <= 0 && { color: "#ef4444" }]}>
            {liveStock <= 0 ? "Out of stock" : liveStock < 5 ? `⚡ Only ${liveStock} left!` : `✓ ${liveStock} in stock`}
          </Text>

          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: liveStock <= 0 ? "#1f2937" : accentColor }, liveStock <= 0 && s.addBtnDisabled]}
            onPress={() => liveStock > 0 && addToCart(item)}
            disabled={liveStock <= 0}
          >
            <Text style={[s.addBtnText, liveStock <= 0 && { color: "#4b5563" }]}>
              {liveStock <= 0 ? "Unavailable" : inCart ? `🛒 In Cart (${cartQty})` : "+ Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.topBlob} />

      {/* Order Success Modal */}
      <Modal visible={orderDone} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}><Text style={{ fontSize: 48 }}>🎉</Text></View>
            <Text style={s.modalTitle}>Order Placed!</Text>
            <Text style={s.modalSub}>Your order has been placed successfully.</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setOrderDone(false)}>
              <Text style={s.modalBtnText}>Continue Shopping →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navbar */}
      <View style={s.nav}>
        <View>
          <Text style={s.navBrand}>i shop<Text style={s.navDot}>.</Text></Text>
          <Text style={s.navSub}>Discover & Shop</Text>
        </View>
        <View style={s.navRight}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("MyOrders")}>
            <Text style={s.navBtnText}>📦 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, s.cartBtn]} onPress={() => navigation.navigate("Cart", { cart })}>
            <Text style={s.navBtnText}>🛒{cartCount > 0 ? ` ${cartCount}` : ""}</Text>
            {cartCount > 0 && <View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#7c3aed" />}
      {!!error  && <Text style={s.errorText}>{error}</Text>}

      {!loading && (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          extraData={cart}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={s.header}>
              <Text style={s.pageTitle}>All Products 🛍️</Text>
              <Text style={s.pageSubtitle}>{products.length} items available for you</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  topBlob:     { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "#7c3aed", opacity: 0.2 },
  nav:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15,12,41,0.95)" },
  navBrand:    { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  navDot:      { color: "#a78bfa" },
  navSub:      { fontSize: 11, color: "#6b7280", marginTop: 1 },
  navRight:    { flexDirection: "row", alignItems: "center", gap: 8 },
  navBtn:      { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  cartBtn:     { position: "relative" },
  navBtnText:  { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
  cartBadge:   { position: "absolute", top: -6, right: -6, backgroundColor: "#ec4899", borderRadius: 10, width: 18, height: 18, justifyContent: "center", alignItems: "center" },
  cartBadgeText:{ color: "#fff", fontSize: 10, fontWeight: "800" },
  logoutBtn:   { paddingHorizontal: 8, paddingVertical: 7 },
  logoutText:  { color: "#6b7280", fontSize: 13 },
  header:      { paddingHorizontal: 4, paddingTop: 20, paddingBottom: 12 },
  pageTitle:   { fontSize: 24, fontWeight: "800", color: "#fff" },
  pageSubtitle:{ fontSize: 13, color: "#6b7280", marginTop: 4 },
  list:        { paddingHorizontal: 12, paddingBottom: 32 },
  row:         { justifyContent: "space-between", gap: 12 },
  card:        { width: "47%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14, overflow: "hidden" },
  cardImgWrap: { position: "relative", borderBottomWidth: 1 },
  cardImg:     { width: "100%", height: 140 },
  cardImgPlaceholder: { width: "100%", height: 140, justifyContent: "center", alignItems: "center" },
  discountBadge:{ position: "absolute", top: 8, left: 8, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  discountText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  outOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  outText:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  cardBody:    { padding: 10 },
  cardTitle:   { fontSize: 13, fontWeight: "700", color: "#f1f5f9", marginBottom: 3 },
  cardDesc:    { fontSize: 11, color: "#6b7280", marginBottom: 8, lineHeight: 15 },
  priceRow:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  price:       { fontSize: 15, fontWeight: "800" },
  mrp:         { fontSize: 11, color: "#4b5563", textDecorationLine: "line-through" },
  stock:       { fontSize: 11, color: "#10b981", marginBottom: 8, fontWeight: "600" },
  addBtn:      { borderRadius: 10, padding: 9, alignItems: "center" },
  addBtnDisabled:{ opacity: 0.5 },
  addBtnText:  { color: "#fff", fontWeight: "700", fontSize: 12 },
  errorText:   { color: "#fca5a5", textAlign: "center", marginTop: 40, fontSize: 14 },
  modalOverlay:{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalCard:   { backgroundColor: "#1e1b4b", borderRadius: 24, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "rgba(124,58,237,0.4)", width: "82%" },
  modalIconWrap:{ width: 80, height: 80, borderRadius: 20, backgroundColor: "rgba(124,58,237,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle:  { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 8 },
  modalSub:    { fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 24 },
  modalBtn:    { backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  modalBtnText:{ color: "#fff", fontWeight: "800", fontSize: 15 },
});
