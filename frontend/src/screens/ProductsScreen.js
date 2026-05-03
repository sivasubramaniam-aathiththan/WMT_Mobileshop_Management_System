import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, SafeAreaView, Modal,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

export default function ProductsScreen({ navigation, route }) {
  const { logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [cart, setCart]         = useState([]);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  // Handle cart update from ProductDetail
  useEffect(() => {
    if (route.params?.updatedCart) {
      setCart(route.params.updatedCart);
      navigation.setParams({ updatedCart: null });
    }
  }, [route.params?.updatedCart]);

  // Handle return from successful order
  useEffect(() => {
    if (route.params?.orderSuccess) {
      setCart([]);
      setOrderDone(true);
      fetchProducts();
      navigation.setParams({ orderSuccess: false });
    }
  }, [route.params?.orderSuccess]);

  const fetchProducts = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/product/allproducts`);
      setProducts(res.data.products);
    } catch {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      const currentQty = existing?.qty || 0;
      
      if (currentQty >= product.stock) return prev;
      
      if (existing) {
        return prev.map((i) => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, product: product._id, qty: 1 }];
    });
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const renderProduct = ({ item }) => {
    const inCart   = cart.some((i) => i._id === item._id);
    const cartQty  = cart.find((i) => i._id === item._id)?.qty || 0;
    const liveStock = item.stock - cartQty;
    const discount = item.mrp > item.price
      ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate("ProductDetail", { product: item, cart })}
        activeOpacity={0.85}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}` }}
            style={s.cardImg}
            resizeMode="cover"
          />
        ) : (
          <View style={s.cardImgPlaceholder}>
            <Text style={{ fontSize: 40 }}>📦</Text>
          </View>
        )}

        <View style={s.cardBody}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.name || item.title}</Text>
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>Rs. {item.price?.toLocaleString()}</Text>
            {item.mrp > item.price && (
              <Text style={s.mrp}>Rs. {item.mrp?.toLocaleString()}</Text>
            )}
            {discount > 0 && (
              <View style={s.discountBadge}>
                <Text style={s.discountText}>{discount}% off</Text>
              </View>
            )}
          </View>

          <Text style={[s.stock, liveStock < 5 && liveStock > 0 && { color: "#cc8800" }]}>
            {liveStock <= 0 ? "Out of stock" : liveStock < 5 ? `Only ${liveStock} left!` : `${liveStock} in stock`}
          </Text>

          <TouchableOpacity
            style={[s.addBtn, liveStock <= 0 && s.addBtnDisabled]}
            onPress={() => liveStock > 0 && addToCart(item)}
            disabled={liveStock <= 0}
          >
            <Text style={s.addBtnText}>
              {liveStock <= 0
                ? inCart ? `In Cart (${cartQty}) - No Stock` : "Out of Stock"
                : inCart
                ? `In Cart (${cartQty})`
                : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.page}>

      {/* Order Success Modal */}
      <Modal visible={orderDone} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalIcon}>✅</Text>
            <Text style={s.modalTitle}>Order Placed!</Text>
            <Text style={s.modalSub}>Your order has been placed successfully.</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setOrderDone(false)}>
              <Text style={s.modalBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Navbar */}
      <View style={s.nav}>
        <Text style={s.navBrand}>shop<Text style={{ color: "#e8ff47" }}>.</Text></Text>
        <View style={s.navRight}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("MyOrders")}>
            <Text style={s.navBtnText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.navBtn, s.cartBtn]}
          onPress={() => navigation.navigate("Cart", { cart })}
          >
            <Text style={s.navBtnText}>🛒 {cartCount > 0 ? cartCount : ""}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading && <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#e8ff47" />}
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
              <Text style={s.pageTitle}>All Products</Text>
              <Text style={s.pageSubtitle}>{products.length} items available</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: "#0a0a0a" },
  nav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  navBrand:  { fontSize: 20, fontWeight: "700", color: "#fff" },
  navRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  navBtn: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  cartBtn:   { },
  navBtnText:{ color: "#fff", fontSize: 13, fontWeight: "500" },
  logoutText:{ color: "#555", fontSize: 13 },
  header:    { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  pageSubtitle:{ fontSize: 13, color: "#555", marginTop: 2 },
  list:      { paddingHorizontal: 8, paddingBottom: 24 },
  row:       { justifyContent: "space-between", paddingHorizontal: 4 },
  card: {
    width: "48%", backgroundColor: "#141414", borderRadius: 12,
    borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 12, overflow: "hidden",
  },
  cardImg:   { width: "100%", height: 130 },
  cardImgPlaceholder: {
    width: "100%", height: 130, backgroundColor: "#1a1a1a",
    justifyContent: "center", alignItems: "center",
  },
  cardBody:  { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 },
  cardDesc:  { fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 16 },
  priceRow:  { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 4 },
  price:     { fontSize: 16, fontWeight: "700", color: "#e8ff47" },
  mrp:       { fontSize: 12, color: "#444", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#0f2a00", borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2 },
  discountText:  { fontSize: 11, color: "#8abf00", fontWeight: "600" },
  stock:     { fontSize: 11, color: "#444", marginBottom: 8 },
  addBtn: {
    backgroundColor: "#e8ff47", borderRadius: 8, padding: 9, alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.35 },
  addBtnText:     { color: "#0a0a0a", fontWeight: "700", fontSize: 13 },
  errorText: { color: "#ff6b6b", textAlign: "center", marginTop: 40, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalCard:    { backgroundColor: "#141414", borderRadius: 16, padding: 32, alignItems: "center", borderWidth: 1, borderColor: "#2a2a2a", width: "80%" },
  modalIcon:    { fontSize: 48, marginBottom: 12 },
  modalTitle:   { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 8 },
  modalSub:     { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  modalBtn:     { backgroundColor: "#e8ff47", borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  modalBtnText: { color: "#0a0a0a", fontWeight: "700", fontSize: 15 },
});