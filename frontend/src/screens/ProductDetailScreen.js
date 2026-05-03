import React, { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from "react-native";
import { BASE_URL } from '../config';

export default function ProductDetailScreen({ navigation, route }) {
  const { product, cart: initialCart } = route.params;
  const [qty, setQty] = useState(1);
  const [localCart, setLocalCart] = useState(initialCart || []);

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const inCartQty = localCart?.find((i) => i._id === product._id)?.qty || 0;
  const availableStock = product.stock - inCartQty;

  const handleAddToCart = () => {
    if (availableStock < qty) return;
    
    const updatedCart = (() => {
      const existing = localCart.find((i) => i._id === product._id);
      if (existing) {
        return localCart.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...localCart, { ...product, product: product._id, qty }];
    })();
    
    setLocalCart(updatedCart);
    navigation.navigate("Products", { updatedCart });
  };

  return (
    <SafeAreaView style={s.page}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image */}
        {product.image ? (
          <Image
            source={{ uri: product.image.startsWith("http") ? product.image : `${BASE_URL}/${product.image}` }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={s.imgPlaceholder}>
            <Text style={{ fontSize: 72 }}>📦</Text>
          </View>
        )}

        {/* Back button */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={s.body}>
          <Text style={s.title}>{product.name || product.title}</Text>
          <Text style={s.desc}>{product.description}</Text>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>Rs. {product.price?.toLocaleString()}</Text>
            {product.mrp > product.price && (
              <Text style={s.mrp}>Rs. {product.mrp?.toLocaleString()}</Text>
            )}
            {discount > 0 && (
              <View style={s.discountBadge}>
                <Text style={s.discountText}>{discount}% off</Text>
              </View>
            )}
          </View>

           {/* Meta */}
          <View style={s.metaBox}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Stock</Text>
              <Text style={[s.metaVal, product.stock < 5 && { color: "#cc8800" }]}>
                {product.stock === 0 ? "Out of stock" : `${product.stock} units total`}
              </Text>
            </View>

            {inCartQty > 0 && (
              <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
                <Text style={s.metaLabel}>Already in Cart</Text>
                <Text style={[s.metaVal, { color: "#4a9eff" }]}>{inCartQty} units</Text>
              </View>
            )}

            {availableStock !== product.stock && (
              <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
                <Text style={s.metaLabel}>Available to Add</Text>
                <Text style={[s.metaVal, { color: availableStock > 0 ? "#8abf00" : "#ff6b6b" }]}>
                  {availableStock > 0 ? `${availableStock} units` : "Out of stock"}
                </Text>
              </View>
            )}

            <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
              <Text style={s.metaLabel}>You save</Text>
              <Text style={[s.metaVal, { color: "#e8ff47" }]}>
                Rs. {(product.mrp - product.price)?.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Qty selector */}
          {availableStock > 0 && (
            <View style={s.qtyRow}>
              <Text style={s.qtyLabel}>Quantity</Text>
              <View style={s.qtyControls}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[s.qtyBtn, qty >= availableStock && { opacity: 0.35 }]}
                  onPress={() => qty < availableStock && setQty((q) => q + 1)}
                  disabled={qty >= availableStock}
                >
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Add to cart */}
          <TouchableOpacity
            style={[s.addBtn, (availableStock <= 0 || qty > availableStock) && s.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={availableStock <= 0 || qty > availableStock}
          >
            <Text style={s.addBtnText}>
              {availableStock <= 0
                ? "Out of Stock"
                : `Add ${qty} to Cart — Rs. ${(product.price * qty).toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:          { flex: 1, backgroundColor: "#0a0a0a" },
  image:         { width: "100%", height: 280 },
  imgPlaceholder:{ width: "100%", height: 280, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  backBtn: {
    position: "absolute", top: 16, left: 16,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
    width: 40, height: 40, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#333",
  },
  backBtnText:   { color: "#fff", fontSize: 18 },
  body:          { padding: 20 },
  title:         { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 8, letterSpacing: -0.3 },
  desc:          { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 16 },
  priceRow:      { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  price:         { fontSize: 26, fontWeight: "700", color: "#e8ff47" },
  mrp:           { fontSize: 15, color: "#444", textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#0f2a00", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  discountText:  { fontSize: 13, color: "#8abf00", fontWeight: "700" },
  metaBox:       { backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14, marginBottom: 16 },
  metaRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  metaLabel:     { fontSize: 13, color: "#666" },
  metaVal:       { fontSize: 14, fontWeight: "600", color: "#fff" },
  qtyRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  qtyLabel:      { fontSize: 15, fontWeight: "500", color: "#fff" },
  qtyControls:   { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn: {
    width: 36, height: 36, backgroundColor: "#1a1a1a", borderRadius: 8,
    borderWidth: 1, borderColor: "#2a2a2a", justifyContent: "center", alignItems: "center",
  },
  qtyBtnText:    { color: "#fff", fontSize: 18, fontWeight: "600" },
  qtyNum:        { fontSize: 18, fontWeight: "700", color: "#fff", minWidth: 30, textAlign: "center" },
  addBtn: {
    backgroundColor: "#e8ff47", borderRadius: 12, padding: 16, alignItems: "center",
  },
  addBtnDisabled:{ opacity: 0.35 },
  addBtnText:    { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
});