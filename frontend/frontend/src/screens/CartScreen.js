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
        <Text style={s.headerTitle}>Your Cart ({count})</Text>
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
  page:        { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  empty:       { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  emptyIcon:   { fontSize: 48 },
  emptyText:   { color: "#555", fontSize: 15 },
  shopBtn:     { backgroundColor: "#e8ff47", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  shopBtnText: { color: "#0a0a0a", fontWeight: "700" },
  item: {
    flexDirection: "row", gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
  },
  itemThumb: {
    width: 60, height: 60, borderRadius: 8, backgroundColor: "#1a1a1a",
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  itemInfo:    { flex: 1 },
  itemName:    { fontSize: 14, fontWeight: "500", color: "#fff", marginBottom: 4 },
  itemPrice:   { fontSize: 14, fontWeight: "700", color: "#e8ff47", marginBottom: 8 },
  qtyRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28, height: 28, backgroundColor: "#1a1a1a", borderRadius: 6,
    borderWidth: 1, borderColor: "#2a2a2a", justifyContent: "center", alignItems: "center",
  },
  qtyBtnText:  { color: "#fff", fontSize: 16 },
  qtyNum:      { fontSize: 14, fontWeight: "600", color: "#fff", minWidth: 20, textAlign: "center" },
  removeText:  { color: "#444", fontSize: 13, marginLeft: 4 },
  stockWarning: { color: "#cc8800", fontSize: 11, marginTop: 4 },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: "#1e1e1e",
    backgroundColor: "#0f0f0f",
  },
  totalRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel:   { fontSize: 16, fontWeight: "600", color: "#fff" },
  totalAmount:  { fontSize: 20, fontWeight: "700", color: "#e8ff47" },
  checkoutBtn:  { backgroundColor: "#e8ff47", borderRadius: 12, padding: 16, alignItems: "center" },
  checkoutBtnText: { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
});