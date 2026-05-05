import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert, ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

const STAT_COLORS = ["#7c3aed", "#06b6d4", "#ef4444"];

export default function AdminDashboardScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" });
  const [addLoading, setAddLoading]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/product/allproducts`);
      setProducts(res.data.products);
    } catch { } finally { setLoading(false); }
  };

  const handleAddProduct = async () => {
    setFormError(""); setFormSuccess("");
    if (!form.name || !form.price || !form.stock || !form.category || !form.imageUrl) {
      setFormError("Name, price, stock, category, and image URL are required."); return;
    }
    setAddLoading(true);
    try {
      const payload = { name: form.name, description: form.description, price: form.price, mrp: form.mrp || form.price, stock: form.stock, category: form.category, imageUrl: form.imageUrl };
      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/product/update/${editingProduct._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setFormSuccess("Product updated!");
      } else {
        await axios.post(`${API_BASE_URL}/product/new`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setFormSuccess("Product added!");
      }
      setForm({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" });
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${editingProduct ? "update" : "add"} product.`);
    } finally { setAddLoading(false); }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description || "", price: String(product.price), mrp: String(product.mrp || product.price), stock: String(product.stock), category: product.category || "", imageUrl: product.image ? (product.image.startsWith("http") ? product.image : `${BASE_URL}/${product.image}`) : "" });
    setShowForm(true); setFormError(""); setFormSuccess("");
  };

  const handleDelete = (product) => {
    Alert.alert("Delete Product", `Delete "${product.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const authToken = token || await AsyncStorage.getItem("token");
          await axios.delete(`${API_BASE_URL}/product/${product._id}`, { headers: { Authorization: `Bearer ${authToken}` } });
          setProducts((prev) => prev.filter((p) => p._id !== product._id));
        } catch (err) {
          Alert.alert("Error", err.response?.data?.message || "Failed to delete.");
          fetchProducts();
        }
      }},
    ]);
  };

  const CATEGORIES = [
    { label: "iPhone",   icon: "🍎" },
    { label: "Samsung",  icon: "🌀" },
    { label: "Huawei",   icon: "🔷" },
    { label: "Redmi",    icon: "🔴" },
    { label: "Oppo",     icon: "🟢" },
    { label: "OnePlus",  icon: "🔁" },
    { label: "Sony",  icon: "🟢" },
     { label: "Other",   icon: "🔷" },

    

  ];

  const FORM_FIELDS = [
    { key: "name",        label: "Product Name *",  placeholder: "e.g. iPhone 15",     icon: "📦" },
    { key: "description", label: "Description",     placeholder: "Product description", icon: "📝" },
    { key: "price",       label: "Price (Rs.) *",   placeholder: "4500",               icon: "💰", keyboard: "number-pad" },
    { key: "mrp",         label: "MRP (Rs.)",       placeholder: "6000",               icon: "🏷", keyboard: "number-pad" },
    { key: "stock",       label: "Stock *",         placeholder: "10",                 icon: "📊", keyboard: "number-pad" },
  ];

  const renderProduct = ({ item }) => (
    <View style={s.productRow}>
      <View style={s.productThumb}>
        {item.image
          ? <Image source={{ uri: item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          : <Text style={{ fontSize: 22 }}>📦</Text>}
      </View>
      <View style={s.productInfo}>
        <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.productPrice}>Rs. {item.price?.toLocaleString()}</Text>
        <View style={[s.stockBadge, { backgroundColor: item.stock === 0 ? "rgba(239,68,68,0.15)" : item.stock < 5 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", borderColor: item.stock === 0 ? "rgba(239,68,68,0.3)" : item.stock < 5 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)" }]}>
          <Text style={[s.stockText, { color: item.stock === 0 ? "#f87171" : item.stock < 5 ? "#fbbf24" : "#34d399" }]}>
            {item.stock === 0 ? "Out of stock" : `${item.stock} units`}
          </Text>
        </View>
      </View>
      <View style={s.actionBtns}>
        <TouchableOpacity style={s.editBtn} onPress={() => handleEdit(item)}>
          <Text style={s.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={s.deleteBtnText}>🗑 Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const stats = [
    { label: "Total",    value: products.length,                              emoji: "📦" },
    { label: "In Stock", value: products.filter((p) => p.stock > 0).length,  emoji: "✅" },
    { label: "No Stock", value: products.filter((p) => p.stock === 0).length, emoji: "❌" },
  ];

  return (
    <SafeAreaView style={s.page}>
      <View style={s.blob1} /><View style={s.blob2} />
      <View style={s.nav}>
        <View>
          <Text style={s.navBrand}>i shop<Text style={s.navDot}>.</Text></Text>
          <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
        </View>
        <View style={s.navRight}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("AdminOrders")}>
            <Text style={s.navBtnText}>📋 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("UserManagement")}>
            <Text style={s.navBtnText}>👥 Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.main}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>Dashboard 🚀</Text>
              <Text style={s.pageSubtitle}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); setEditingProduct(null); setForm({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" }); }}>
              <Text style={s.addBtnText}>{showForm ? "✕ Cancel" : "+ Add Product"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.stats}>
            {stats.map(({ label, value, emoji }, i) => (
              <View key={label} style={[s.statCard, { borderColor: STAT_COLORS[i] + "44" }]}>
                <Text style={s.statEmoji}>{emoji}</Text>
                <Text style={[s.statValue, { color: STAT_COLORS[i] }]}>{loading ? "—" : value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {showForm && (
            <View style={s.formCard}>
              <Text style={s.formTitle}>{editingProduct ? "✏️ Edit Product" : "➕ Add New Product"}</Text>
              {!!formError   && <View style={s.errorBox}><Text style={s.errorText}>⚠️ {formError}</Text></View>}
              {!!formSuccess && <View style={s.successBox}><Text style={s.successText}>✅ {formSuccess}</Text></View>}

              <Text style={s.formLabel}>🖼️ Image URL *</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.formInput}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#6b7280"
                  value={form.imageUrl}
                  onChangeText={(v) => setForm({ ...form, imageUrl: v })}
                />
              </View>
              {!!form.imageUrl && (
                <Image source={{ uri: form.imageUrl }} style={s.imgPreview} resizeMode="cover" />
              )}

              <Text style={s.formLabel}>🏷️ Category *</Text>
              <View style={s.categoryGrid}>
                {CATEGORIES.map(({ label, icon }) => (
                  <TouchableOpacity
                    key={label}
                    style={[s.categoryBtn, form.category === label && s.categoryBtnActive]}
                    onPress={() => setForm({ ...form, category: label })}
                  >
                    <Text style={s.categoryIcon}>{icon}</Text>
                    <Text style={[s.categoryLabel, form.category === label && s.categoryLabelActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {FORM_FIELDS.map(({ key, label, placeholder, icon, keyboard }) => (
                <View key={key}>
                  <Text style={s.formLabel}>{icon} {label}</Text>
                  <View style={s.inputWrap}>
                    <TextInput
                      style={s.formInput}
                      placeholder={placeholder}
                      placeholderTextColor="#6b7280"
                      keyboardType={keyboard || "default"}
                      value={form[key]}
                      onChangeText={(v) => setForm({ ...form, [key]: v })}
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity style={[s.submitBtn, addLoading && { opacity: 0.6 }]} onPress={handleAddProduct} disabled={addLoading}>
                {addLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>{editingProduct ? "Update Product →" : "Add Product →"}</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.sectionTitle}>All Products</Text>
          {loading && <ActivityIndicator color="#7c3aed" />}
          {!loading && products.map((item) => (
            <View key={item._id}>{renderProduct({ item })}</View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  blob1:       { position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "#7c3aed", opacity: 0.2 },
  blob2:       { position: "absolute", bottom: 100, right: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: "#06b6d4", opacity: 0.15 },
  nav:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  navBrand:    { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  navDot:      { color: "#a78bfa" },
  adminBadge:  { backgroundColor: "rgba(245,158,11,0.2)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 2, borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" },
  adminBadgeText:{ fontSize: 9, color: "#fbbf24", fontWeight: "800", letterSpacing: 1 },
  navRight:    { flexDirection: "row", alignItems: "center", gap: 8 },
  navBtn:      { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  navBtnText:  { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },
  logoutBtn:   { paddingHorizontal: 8, paddingVertical: 7 },
  logoutText:  { color: "#6b7280", fontSize: 13 },
  main:        { padding: 16 },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle:   { fontSize: 24, fontWeight: "800", color: "#fff" },
  pageSubtitle:{ fontSize: 12, color: "#6b7280", marginTop: 3 },
  addBtn:      { backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  stats:       { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard:    { flex: 1, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, borderWidth: 1, alignItems: "center" },
  statEmoji:   { fontSize: 22, marginBottom: 6 },
  statValue:   { fontSize: 26, fontWeight: "800", fontFamily: "monospace" },
  statLabel:   { fontSize: 11, color: "#6b7280", marginTop: 2 },
  formCard:    { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 24 },
  formTitle:   { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 16 },
  formLabel:   { fontSize: 13, color: "#c4b5fd", marginBottom: 6, fontWeight: "600", marginTop: 10 },
  inputWrap:   { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  formInput:   { padding: 13, color: "#fff", fontSize: 14 },
  imgPreview:  { width: "100%", height: 160, borderRadius: 12, marginTop: 10, backgroundColor: "rgba(255,255,255,0.05)" },
  categoryGrid:{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  categoryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  categoryBtnActive: { backgroundColor: "rgba(124,58,237,0.25)", borderColor: "#7c3aed" },
  categoryIcon:{ fontSize: 16 },
  categoryLabel:{ fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  categoryLabelActive: { color: "#c4b5fd" },
  submitBtn:   { backgroundColor: "#7c3aed", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  submitBtnText:{ color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  productRow:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  productThumb:{ width: 54, height: 54, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "700", color: "#f1f5f9", marginBottom: 3 },
  productPrice:{ fontSize: 13, color: "#a78bfa", fontWeight: "700", marginBottom: 5 },
  stockBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", borderWidth: 1 },
  stockText:   { fontSize: 11, fontWeight: "700" },
  actionBtns:  { gap: 6 },
  editBtn:     { backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(59,130,246,0.3)" },
  editBtnText: { color: "#60a5fa", fontSize: 12, fontWeight: "700" },
  deleteBtn:   { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  deleteBtnText:{ color: "#f87171", fontSize: 12, fontWeight: "700" },
  errorBox:    { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorText:   { color: "#fca5a5", fontSize: 13 },
  successBox:  { backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  successText: { color: "#6ee7b7", fontSize: 13 },
});
