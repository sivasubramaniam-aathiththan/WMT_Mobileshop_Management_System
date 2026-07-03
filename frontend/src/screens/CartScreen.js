import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, SafeAreaView,
} from "react-native";
import { BASE_URL } from '../config';

export default function CartScreen({ navigation, route }) {
  const { cart: initialCart } = route.params;
  const [cart, setCart] = useState(initialCart || []);

  const updateQty = (id, delta, maxStock) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i._id === id) {
          const newQty = i.qty + delta;
          if (newQty > maxStock) return i;
          return { ...i, qty: newQty };
        }
        return i;
      }).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i._id !== id));

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <SafeAreaView style={s.page}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Cart 🛒 ({count})</Text>
        <View style={{ width: 30 }} />
      </View>

      {cart.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🛒</Text>
          <Text style={s.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={s.shopBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const atMaxStock = item.qty >= item.stock;
              return (
              <View style={s.item}>
                <View style={s.itemThumb}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}` }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ fontSize: 22 }}>📦</Text>
                  )}
                </View>

                <View style={s.itemInfo}>
                  <Text style={s.itemName} numberOfLines={1}>{item.name || item.title}</Text>
                  <Text style={s.itemPrice}>Rs. {(item.price * item.qty).toLocaleString()}</Text>

                  <View style={s.qtyRow}>
                    <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item._id, -1, item.stock)}>
                      <Text style={s.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.qtyNum}>{item.qty}</Text>
                    <TouchableOpacity 
                      style={[s.qtyBtn, atMaxStock && { opacity: 0.3 }]} 
                      onPress={() => updateQty(item._id, 1, item.stock)}
                      disabled={atMaxStock}
                    >
                      <Text style={s.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(item._id)}>
                      <Text style={s.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  {atMaxStock && (
                    <Text style={s.stockWarning}>Max stock reached</Text>
                  )}
                </View>
              </View>
            );
            }}
          />

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalAmount}>Rs. {total.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={s.checkoutBtn}
              onPress={() => navigation.navigate("Checkout", { cart })}
            >
              <Text style={s.checkoutBtnText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15,12,41,0.95)",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  empty:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emptyIcon:   { fontSize: 52 },
  emptyText:   { color: "#6b7280", fontSize: 15 },
  shopBtn:     { backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { color: "#fff", fontWeight: "800" },
  item: {
    flexDirection: "row", gap: 12, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  itemThumb: {
    width: 64, height: 64, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  itemInfo:    { flex: 1 },
  itemName:    { fontSize: 14, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 },
  itemPrice:   { fontSize: 15, fontWeight: "800", color: "#a78bfa", marginBottom: 8 },
  qtyRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 30, height: 30, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center",
  },
  qtyBtnText:  { color: "#fff", fontSize: 16 },
  qtyNum:      { fontSize: 14, fontWeight: "700", color: "#fff", minWidth: 20, textAlign: "center" },
  removeText:  { color: "#f87171", fontSize: 13, marginLeft: 4, fontWeight: "600" },
  stockWarning:{ color: "#fbbf24", fontSize: 11, marginTop: 4 },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,12,41,0.95)",
  },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  totalLabel:   { fontSize: 16, fontWeight: "700", color: "#fff" },
  totalAmount:  { fontSize: 22, fontWeight: "800", color: "#a78bfa" },
  checkoutBtn:  { backgroundColor: "#7c3aed", borderRadius: 14, padding: 16, alignItems: "center" },
  checkoutBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});