import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from '../config';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]       = useState({ name: "", email: "", password: "", contact: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleChange = (key, val) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    setError("");
    const { name, email, password, contact } = form;
    if (!name || !email || !password || !contact) {
      setError("All fields are required."); return;
    }
    setLoading(true);
    try {
      const assignedRole = form.role === "admin" ? "admin" : "user";
      const res = await axios.post(`${API_BASE_URL}/user/register`, { ...form, role: assignedRole });
      // Pass token + email to OTP screen
      navigation.navigate("VerifyOtp", {
        activationToken: res.data.activationToken,
        email: form.email,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <Text style={s.brand}>shop<Text style={s.dot}>.</Text></Text>

        <View style={s.card}>
          <Text style={s.title}>Create account</Text>
          <Text style={s.subtitle}>Start shopping in seconds</Text>

          {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

          {[
            { key: "name",     label: "Full name",   placeholder: "John Doe" },
            { key: "contact",  label: "Contact",      placeholder: "0771234567",  keyboard: "phone-pad" },
            { key: "email",    label: "Email",        placeholder: "you@example.com", keyboard: "email-address" },
            { key: "password", label: "Password",     placeholder: "Min. 8 characters", secure: true },
            { key: "role",     label: "Role (optional — type 'admin' for admin access)", placeholder: "user" },
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <TextInput
                style={s.input}
                placeholder={placeholder}
                placeholderTextColor="#444"
                keyboardType={keyboard || "default"}
                autoCapitalize="none"
                secureTextEntry={!!secure}
                value={form[key]}
                onChangeText={(v) => handleChange(key, v)}
              />
            </View>
          ))}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0a0a0a" />
              : <Text style={s.btnText}>Create Account →</Text>
            }
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:     { flex: 1, backgroundColor: "#0a0a0a" },
  scroll:   { flexGrow: 1, justifyContent: "center", padding: 24 },
  brand:    { fontSize: 32, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 32, letterSpacing: -0.5 },
  dot:      { color: "#e8ff47" },
  card:     { backgroundColor: "#141414", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#222" },
  title:    { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  label:    { fontSize: 13, color: "#888", marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 12, color: "#fff", fontSize: 14, marginBottom: 14,
  },
  btn: {
    backgroundColor: "#e8ff47", borderRadius: 10, padding: 14,
    alignItems: "center", marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:  { color: "#0a0a0a", fontWeight: "700", fontSize: 15 },
  row:      { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  mutedText:{ color: "#444", fontSize: 14 },
  link:     { color: "#e8ff47", fontSize: 14, fontWeight: "700" },
  errorBox: { backgroundColor: "#2a1010", borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#4a1a1a" },
  errorText:{ color: "#ff6b6b", fontSize: 13 },
});