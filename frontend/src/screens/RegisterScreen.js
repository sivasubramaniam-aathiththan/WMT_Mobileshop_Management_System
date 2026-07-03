import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from '../config';

const FIELDS = [
  { key: "name",     label: "Full Name",   placeholder: "John Doe",          icon: "👤" },
  { key: "contact",  label: "Phone",       placeholder: "0771234567",        icon: "📱", keyboard: "phone-pad" },
  { key: "email",    label: "Email",       placeholder: "you@example.com",   icon: "✉️", keyboard: "email-address" },
  { key: "password", label: "Password",    placeholder: "Min. 8 characters", icon: "🔒", secure: true },
  { key: "role",     label: "Role",        placeholder: "user / admin",      icon: "🎭" },
];

export default function RegisterScreen({ navigation }) {
  const [form, setForm]       = useState({ name: "", email: "", password: "", contact: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleRegister = async () => {
    setError("");
    const { name, email, password, contact } = form;
    if (!name || !email || !password || !contact) { setError("All fields are required."); return; }
    setLoading(true);
    try {
      const assignedRole = form.role === "admin" ? "admin" : "user";
      const res = await axios.post(`${API_BASE_URL}/user/register`, { ...form, role: assignedRole });
      navigation.navigate("VerifyOtp", { activationToken: res.data.activationToken, email: form.email });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.blob1} />
      <View style={s.blob2} />
      <View style={s.blob3} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.brandRow}>
          <View style={s.brandIcon}><Text style={{ fontSize: 22 }}>🛍</Text></View>
          <Text style={s.brand}>shop<Text style={s.dot}>.</Text></Text>
        </View>
        <Text style={s.tagline}>Join thousands of happy shoppers</Text>

        <View style={s.card}>
          <Text style={s.title}>Create account ✨</Text>
          <Text style={s.subtitle}>Fill in your details to get started</Text>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorIcon}>⚠️</Text>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          {FIELDS.map(({ key, label, placeholder, icon, keyboard, secure }) => (
            <View key={key}>
              <Text style={s.label}>{label}</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>{icon}</Text>
                <TextInput
                  style={s.input}
                  placeholder={placeholder}
                  placeholderTextColor="#9ca3af"
                  keyboardType={keyboard || "default"}
                  autoCapitalize="none"
                  secureTextEntry={!!secure}
                  value={form[key]}
                  onChangeText={(v) => setForm({ ...form, [key]: v })}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            <View style={s.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Create Account →</Text>
              }
            </View>
          </TouchableOpacity>

          <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} /></View>

          <View style={s.row}>
            <Text style={s.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.link}>Sign in →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: "#0f0c29" },
  blob1:      { position: "absolute", top: -80, left: -60,  width: 260, height: 260, borderRadius: 130, backgroundColor: "#7c3aed", opacity: 0.35 },
  blob2:      { position: "absolute", bottom: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "#06b6d4", opacity: 0.25 },
  blob3:      { position: "absolute", top: "40%", right: -80, width: 180, height: 180, borderRadius: 90, backgroundColor: "#ec4899", opacity: 0.15 },
  scroll:     { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 48 },
  brandRow:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 },
  brandIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  brand:      { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  dot:        { color: "#a78bfa" },
  tagline:    { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 28 },
  card:       { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  title:      { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle:   { fontSize: 14, color: "#9ca3af", marginBottom: 24 },
  label:      { fontSize: 13, color: "#c4b5fd", marginBottom: 6, fontWeight: "600" },
  inputWrap:  { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, marginBottom: 14 },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input:      { flex: 1, padding: 14, color: "#fff", fontSize: 15 },
  btn:        { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnGrad:    { backgroundColor: "#7c3aed", padding: 16, alignItems: "center", borderRadius: 14 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: "#fff", fontWeight: "800", fontSize: 16 },
  divider:    { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  divText:    { color: "#6b7280", fontSize: 13 },
  row:        { flexDirection: "row", justifyContent: "center" },
  mutedText:  { color: "#6b7280", fontSize: 14 },
  link:       { color: "#a78bfa", fontSize: 14, fontWeight: "700" },
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorIcon:  { fontSize: 16 },
  errorText:  { color: "#fca5a5", fontSize: 13, flex: 1 },
});
