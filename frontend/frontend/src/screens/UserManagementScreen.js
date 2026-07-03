import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet, SafeAreaView, ActivityIndicator
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';

export default function UserManagementScreen({ navigation }) {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", contact: "", role: "user" });
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.contact) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setFormLoading(true);
    try {
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/admin/users/${editingUser._id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "User updated");
      } else {
        await axios.post(`${API_BASE_URL}/admin/users`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "User created");
      }
      setForm({ name: "", email: "", password: "", contact: "", role: "user" });
      setEditingUser(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", contact: user.contact, role: user.role });
    setShowForm(true);
  };

  const handleDelete = (user) => {
    Alert.alert("Delete User", `Delete ${user.name}?`, [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/admin/users/${user._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== user._id));
            Alert.alert("Success", "User deleted");
          } catch (err) {
            Alert.alert("Error", "Failed to delete user");
          }
        }
      }
    ]);
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userText}>Name: {item.name}</Text>
      <Text style={styles.userText}>Email: {item.email}</Text>
      <Text style={styles.userText}>Role: {item.role}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e8ff47" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.btnText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Contact"
            value={form.contact}
            onChangeText={(text) => setForm({ ...form, contact: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Role (user/admin)"
            value={form.role}
            onChangeText={(text) => setForm({ ...form, role: text })}
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingUser(null); setForm({ name: "", email: "", password: "", contact: "", role: "user" }); }}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={formLoading}>
              <Text style={styles.btnText}>{formLoading ? "Saving..." : editingUser ? "Update" : "Create"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { color: "#e8ff47", fontSize: 18 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  addBtn: { backgroundColor: "#e8ff47", padding: 10, borderRadius: 5 },
  form: { backgroundColor: "#1a1a1a", padding: 20, borderRadius: 10, marginBottom: 20 },
  input: { backgroundColor: "#fff", padding: 10, marginBottom: 10, borderRadius: 5 },
  formActions: { flexDirection: "row", justifyContent: "space-between" },
  cancelBtn: { backgroundColor: "#666", padding: 10, borderRadius: 5, flex: 1, marginRight: 10 },
  saveBtn: { backgroundColor: "#e8ff47", padding: 10, borderRadius: 5, flex: 1 },
  list: { paddingBottom: 20 },
  userCard: { backgroundColor: "#1a1a1a", padding: 15, borderRadius: 10, marginBottom: 10 },
  userText: { color: "#fff", marginBottom: 5 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  editBtn: { backgroundColor: "#ffa500", padding: 8, borderRadius: 5, flex: 1, marginRight: 10 },
  deleteBtn: { backgroundColor: "#ff4444", padding: 8, borderRadius: 5, flex: 1 },
  btnText: { color: "#000", textAlign: "center", fontWeight: "bold" },
});