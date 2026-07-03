import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Alert, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';

const ROLE_CONFIG = {
  admin: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.3)", icon: "👑" },
  user:  { bg: "rgba(6,182,212,0.15)",  color: "#22d3ee", border: "rgba(6,182,212,0.3)",  icon: "👤" },
};

const FIELDS = [
  { key: "name",     label: "Full Name",       placeholder: "John Doe",        icon: "👤" },
  { key: "email",    label: "Email",           placeholder: "you@example.com", icon: "✉️", keyboard: "email-address" },
  { key: "password", label: "Password",        placeholder: "Min. 8 chars",    icon: "🔒", secure: true },
  { key: "contact",  label: "Phone",           placeholder: "0771234567",      icon: "📱", keyboard: "phone-pad" },
  { key: "role",     label: "Role (user/admin)", placeholder: "user",          icon: "🎭" },
];

export default function UserManagementScreen({ navigation }) {
  const { token } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ name: "", email: "", password: "", contact: "", role: "user" });
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users);
    } catch { Alert.alert("Error", "Failed to fetch users"); } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.contact) {
      Alert.alert("Error", "All fields are required"); return;
    }
    setFormLoading(true);
    try {
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/admin/users/${editingUser._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/admin/users`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setForm({ name: "", email: "", password: "", contact: "", role: "user" });
      setEditingUser(null); setShowForm(false);
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save user");
    } finally { setFormLoading(false); }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", contact: user.contact, role: user.role });
    setShowForm(true);
  };

  const handleDelete = (user) => {
    Alert.alert("Delete User", `Delete ${user.name}?`, [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/admin/users/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
          setUsers(users.filter((u) => u._id !== user._id));
        } catch { Alert.alert("Error", "Failed to delete user"); }
      }},
    ]);
  };

  const renderUser = ({ item, index }) => {
    const role = ROLE_CONFIG[item.role] || ROLE_CONFIG.user;
    const colors = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#10b981"];
    const accent = colors[index % colors.length];
    return (
      <View style={[s.userCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
        <View style={s.userCardTop}>
          <View style={[s.avatarWrap, { backgroundColor: accent + "22" }]}>
            <Text style={s.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.userName}>{item.name}</Text>
            <Text style={s.userEmail}>{item.email}</Text>
            <Text style={s.userContact}>📱 {item.contact}</Text>
          </View>
          <View style={[s.roleBadge, { backgroundColor: role.bg, borderColor: role.border }]}>
            <Text style={[s.roleText, { color: role.color }]}>{role.icon} {item.role}</Text>
          </View>
        </View>
        <View style={s.userActions}>
          <TouchableOpacity style={s.editBtn} onPress={() => handleEdit(item)}>
            <Text style={s.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={s.deleteBtnText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.page}>
      <View style={s.blob1} /><View style={s.blob2} />
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Management 👥</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setShowForm(!showForm); setEditingUser(null); setForm({ name: "", email: "", password: "", contact: "", role: "user" }); }}>
          <Text style={s.addBtnText}>{showForm ? "✕" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 60 }} />
        : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              showForm ? (
                <View style={s.formCard}>
                  <Text style={s.formTitle}>{editingUser ? "✏️ Edit User" : "➕ Add New User"}</Text>
                  {FIELDS.map(({ key, label, placeholder, icon, keyboard, secure }) => (
                    <View key={key}>
                      <Text style={s.formLabel}>{icon} {label}</Text>
                      <View style={s.inputWrap}>
                        <TextInput
                          style={s.formInput}
                          placeholder={placeholder}
                          placeholderTextColor="#6b7280"
                          keyboardType={keyboard || "default"}
                          autoCapitalize="none"
                          secureTextEntry={!!secure}
                          value={form[key]}
                          onChangeText={(v) => setForm({ ...form, [key]: v })}
                        />
                      </View>
                    </View>
                  ))}
                  <View style={s.formActions}>
                    <TouchableOpacity style={s.cancelFormBtn} onPress={() => { setShowForm(false); setEditingUser(null); }}>
                      <Text style={s.cancelFormBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.saveBtn, formLoading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={formLoading}>
                      {formLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.saveBtnText}>{editingUser ? "Update →" : "Create →"}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={s.subtitle}>{users.length} registered user{users.length !== 1 ? "s" : ""}</Text>
              )
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>👥</Text>
                <Text style={s.emptyText}>No users found</Text>
              </View>
            }
          />
        )
      }
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  blob1:       { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: "#ec4899", opacity: 0.15 },
  blob2:       { position: "absolute", bottom: 100, left: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: "#7c3aed", opacity: 0.2 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center", alignItems: "center" },
  backText:    { color: "#fff", fontSize: 18 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  addBtn:      { backgroundColor: "#7c3aed", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  subtitle:    { color: "#6b7280", fontSize: 13, marginBottom: 14 },
  formCard:    { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 20 },
  formTitle:   { fontSize: 17, fontWeight: "800", color: "#fff", marginBottom: 16 },
  formLabel:   { fontSize: 13, color: "#c4b5fd", marginBottom: 6, fontWeight: "600", marginTop: 10 },
  inputWrap:   { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  formInput:   { padding: 13, color: "#fff", fontSize: 14 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelFormBtn:{ flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cancelFormBtnText:{ color: "#9ca3af", fontWeight: "700" },
  saveBtn:     { flex: 1, backgroundColor: "#7c3aed", borderRadius: 12, padding: 13, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  userCard:    { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 10 },
  userCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarWrap:  { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  avatarText:  { fontSize: 20, fontWeight: "800", color: "#fff" },
  userName:    { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  userEmail:   { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  userContact: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  roleBadge:   { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  roleText:    { fontSize: 11, fontWeight: "700" },
  userActions: { flexDirection: "row", gap: 8 },
  editBtn:     { flex: 1, backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 10, padding: 9, alignItems: "center", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)" },
  editBtnText: { color: "#60a5fa", fontSize: 13, fontWeight: "700" },
  deleteBtn:   { flex: 1, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 9, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  deleteBtnText:{ color: "#f87171", fontSize: 13, fontWeight: "700" },
  empty:       { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText:   { color: "#6b7280", fontSize: 15 },
});
