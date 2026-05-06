import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Image, TextInput,
  StyleSheet, ActivityIndicator, SafeAreaView, Alert, ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_URL } from '../config';

export default function AdminDashboardScreen({ navigation }) {
  const { user, token, logout } = useAuth();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" });
  const [addLoading, setAddLoading]     = useState(false);
  const [formError, setFormError]       = useState("");
  const [formSuccess, setFormSuccess]   = useState("");
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
    if (!form.name || !form.price || !form.stock || !form.category || !form.imageUrl) { setFormError("Name, price, stock, category, and image URL are required."); return; }

    setAddLoading(true);
    try {
      const data = new FormData();
      data.append("name",        form.name);
      data.append("description", form.description);
      data.append("price",       form.price);
      data.append("mrp",         form.mrp || form.price);
      data.append("stock",       form.stock);
      data.append("category",    form.category);
      data.append("imageUrl",    form.imageUrl);

      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/product/update/${editingProduct._id}`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setFormSuccess("Product updated!");
      } else {
        await axios.post(`${API_BASE_URL}/product/new`, data, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setFormSuccess("Product added!");
      }

      setForm({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" });
      setEditingProduct(null);
      fetchProducts();
      setTimeout(() => { setShowForm(false); setFormSuccess(""); }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${editingProduct ? "update" : "add"} product.`);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description || "", price: String(product.price), mrp: String(product.mrp || product.price), stock: String(product.stock), category: product.category || "", imageUrl: product.image ? (product.image.startsWith("http") ? product.image : `${BASE_URL}/${product.image}`) : "" });
    setShowForm(true);
    setFormError("");
    setFormSuccess("");
  };

  const handleDelete = (product) => {
    Alert.alert("Delete Product", `Delete "${product.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const authToken = token || await AsyncStorage.getItem("token");
            if (!authToken) {
              Alert.alert("Login required", "Please login again as admin and try deleting.");
              return;
            }

            await axios.delete(`${API_BASE_URL}/product/${product._id}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            setProducts((prev) => prev.filter((p) => p._id !== product._id));
          } catch (err) {
            Alert.alert("Error", err.response?.data?.message || "Failed to delete.");
            fetchProducts();
          }
        },
      },
    ]);
  };

  const renderProduct = ({ item }) => (
    <View style={s.productRow}>
      <View style={s.productThumb}>
        {item.image
          ? <Image source={{ uri: item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          : <Text style={{ fontSize: 20 }}>📦</Text>
        }
      </View>
      <View style={s.productInfo}>
          <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.productPrice}>Rs. {item.price?.toLocaleString()}</Text>
        <View style={[s.stockBadge, { backgroundColor: item.stock === 0 ? "#2a1010" : item.stock < 5 ? "#2a1a00" : "#0f2a00" }]}>
          <Text style={[s.stockText, { color: item.stock === 0 ? "#ff6b6b" : item.stock < 5 ? "#cc8800" : "#8abf00" }]}>
            {item.stock === 0 ? "Out of stock" : `${item.stock} units`}
          </Text>
        </View>
      </View>
      <View style={s.actionBtns}>
        <TouchableOpacity style={[s.editBtn]} onPress={() => handleEdit(item)}>
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.deleteBtn]} onPress={() => handleDelete(item)}>
          <Text style={s.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.page}>
      {/* Nav */}
      <View style={s.nav}>
        <View>
          <Text style={s.navBrand}>shop<Text style={{ color: "#e8ff47" }}>.</Text></Text>
          <Text style={s.navBadge}>ADMIN</Text>
        </View>
        <View style={s.navRight}>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("AdminOrders")}>
            <Text style={s.navBtnText}>📋 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("UserManagement")}>
            <Text style={s.navBtnText}>👥 Users</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.main}>
          {/* Header */}
          <View style={s.headerRow}>
            <View>
              <Text style={s.pageTitle}>Dashboard</Text>
              <Text style={s.pageSubtitle}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={() => { setShowForm(!showForm); setFormError(""); setFormSuccess(""); setEditingProduct(null); setForm({ name: "", description: "", price: "", mrp: "", stock: "", category: "", imageUrl: "" }); }}>
              <Text style={s.addBtnText}>{showForm ? "Cancel" : "+ Add Product"}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={s.stats}>
            {[
              { label: "Total",     value: products.length,                              color: "#e8ff47" },
              { label: "In Stock",  value: products.filter((p) => p.stock > 0).length,  color: "#8abf00" },
              { label: "No Stock",  value: products.filter((p) => p.stock === 0).length, color: "#ff6b6b" },
            ].map(({ label, value, color }) => (
              <View key={label} style={s.statCard}>
                <Text style={s.statLabel}>{label}</Text>
                <Text style={[s.statValue, { color }]}>{loading ? "—" : value}</Text>
              </View>
            ))}
          </View>

          {/* Add form */}
          {showForm && (
            <View style={s.formCard}>
              <Text style={s.formTitle}>{editingProduct ? "Edit Product" : "Add New Product"}</Text>
              {!!formError   && <View style={s.errorBox}><Text style={s.errorText}>{formError}</Text></View>}
              {!!formSuccess && <View style={s.successBox}><Text style={s.successText}>{formSuccess}</Text></View>}

              <View style={s.formGroup}>
                <Text style={s.formLabel}>Image URL *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#444"
                  value={form.imageUrl}
                  onChangeText={(value) => setForm({ ...form, imageUrl: value })}
                />
              </View>

              {[
                { key: "name",        label: "Name *",        placeholder: "Product name" },
                { key: "description", label: "Description",   placeholder: "Product description" },
                { key: "category",    label: "Category *",    placeholder: "e.g. electronics" },
                { key: "price",       label: "Price (Rs.) *", placeholder: "4500", keyboard: "number-pad" },
                { key: "mrp",         label: "MRP (Rs.)",     placeholder: "6000", keyboard: "number-pad" },
                { key: "stock",       label: "Stock *",       placeholder: "10",   keyboard: "number-pad" },
              ].map(({ key, label, placeholder, keyboard }) => (
                <View key={key} style={s.formGroup}>
                  <Text style={s.formLabel}>{label}</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder={placeholder}
                    placeholderTextColor="#444"
                    keyboardType={keyboard || "default"}
                    value={form[key]}
                    onChangeText={(v) => setForm({ ...form, [key]: v })}
                  />
                </View>
              ))}


              <TouchableOpacity
                style={[s.submitBtn, addLoading && { opacity: 0.6 }]}
                onPress={handleAddProduct}
                disabled={addLoading}
              >
                {addLoading
                  ? <ActivityIndicator color="#0a0a0a" />
                  : <Text style={s.submitBtnText}>{editingProduct ? "Update Product →" : "Add Product →"}</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Products */}
          <Text style={s.sectionTitle}>All Products</Text>
          {loading && <ActivityIndicator color="#e8ff47" />}
          {!loading && products.map((item) => (
            <View key={item._id}>{renderProduct({ item })}</View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: "#0a0a0a" },
  nav: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  navBrand:  { fontSize: 20, fontWeight: "700", color: "#fff" },
  navBadge:  { fontSize: 10, color: "#ff8c00", fontWeight: "700" },
  navRight:  { flexDirection: "row", alignItems: "center", gap: 10 },
  navBtn:    { backgroundColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#2a2a2a" },
  navBtnText:{ color: "#fff", fontSize: 13 },
  logoutText:{ color: "#555", fontSize: 13 },
  main:      { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  pageSubtitle:{ fontSize: 12, color: "#555", marginTop: 2 },
  addBtn:    { backgroundColor: "#e8ff47", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText:{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 },
  stats:     { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard:  { flex: 1, backgroundColor: "#141414", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1e1e1e" },
  statLabel: { fontSize: 12, color: "#555", marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: "700", fontFamily: "monospace" },
  formCard:  { backgroundColor: "#141414", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 12 },
  imgPicker: { width: "100%", height: 150, backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 2, borderColor: "#2a2a2a", borderStyle: "dashed", overflow: "hidden", marginBottom: 14 },
  imgPreview:{ width: "100%", height: "100%" },
  imgPlaceholder:{ flex: 1, justifyContent: "center", alignItems: "center" },
  imgPlaceholderText:{ color: "#555", fontSize: 13, marginTop: 8 },
  formGroup: { marginBottom: 10 },
  formLabel: { fontSize: 13, color: "#888", marginBottom: 5, fontWeight: "500" },
  formInput: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 11, color: "#fff", fontSize: 14 },
  submitBtn: { backgroundColor: "#e8ff47", borderRadius: 10, padding: 13, alignItems: "center", marginTop: 4 },
  submitBtnText:{ color: "#0a0a0a", fontWeight: "700", fontSize: 15 },
  sectionTitle:{ fontSize: 13, fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  productRow:{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#141414", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 8 },
  productThumb:{ width: 50, height: 50, borderRadius: 8, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  productInfo:{ flex: 1 },
  productName: { fontSize: 14, fontWeight: "500", color: "#fff", marginBottom: 3 },
  productPrice:{ fontSize: 13, color: "#e8ff47", fontWeight: "600", marginBottom: 4 },
  stockBadge:  { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  stockText:   { fontSize: 11, fontWeight: "600" },
  actionBtns:  { flexDirection: "row", gap: 8 },
  editBtn:     { backgroundColor: "#1a3a6a", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#2a5a8a" },
  editBtnText: { color: "#4a9eff", fontSize: 12, fontWeight: "600" },
  deleteBtn:   { backgroundColor: "#2a1010", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#4a1a1a" },
  deleteBtnText:{ color: "#ff6b6b", fontSize: 12, fontWeight: "600" },
  errorBox:    { backgroundColor: "#2a1010", borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#4a1a1a" },
  errorText:   { color: "#ff6b6b", fontSize: 13 },
  successBox:  { backgroundColor: "#0f2a00", borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#2a4a00" },
  successText: { color: "#8abf00", fontSize: 13 },
});
