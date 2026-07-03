import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/user/login`, { email, password }, { timeout: 10000 });
      await login(res.data.token, res.data.user);
    } catch (err) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Server not responding. Check your connection.");
      } else if (!err.response) {
        setError(`Cannot reach server at ${API_BASE_URL}.`);
      } else {
        setError(err.response?.data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.topBlob} />
      <View style={s.bottomBlob} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.brandRow}>
          <View style={s.brandIcon}><Text style={s.brandIconText}>🛍</Text></View>
          <Text style={s.brand}>i shop<Text style={s.dot}>.</Text></Text>
        </View>
        <Text style={s.tagline}>Your favourite store</Text>

        <View style={s.card}>
          <Text style={s.title}>Welcome back 👋</Text>
          <Text style={s.subtitle}>Sign in to continue shopping</Text>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorIcon}>⚠️</Text>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Text style={s.label}>Email address</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>✉️</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={s.label}>Password</Text>
          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput
              style={s.input}
              placeholder="Your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <View style={s.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Sign In →</Text>
              }
            </View>
          </TouchableOpacity>

          <View style={s.divider}><View style={s.divLine} /><Text style={s.divText}>or</Text><View style={s.divLine} /></View>

          <View style={s.row}>
            <Text style={s.mutedText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.link}>Create one →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: "#0f0c29" },
  topBlob:     { position: "absolute", top: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: "#7c3aed", opacity: 0.35 },
  bottomBlob:  { position: "absolute", bottom: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "#06b6d4", opacity: 0.25 },
  scroll:      { flexGrow: 1, justifyContent: "center", padding: 24 },
  brandRow:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 },
  brandIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: "#7c3aed", justifyContent: "center", alignItems: "center" },
  brandIconText:{ fontSize: 22 },
  brand:       { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  dot:         { color: "#a78bfa" },
  tagline:     { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 },
  card:        { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  title:       { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle:    { fontSize: 14, color: "#9ca3af", marginBottom: 24 },
  label:       { fontSize: 13, color: "#c4b5fd", marginBottom: 6, fontWeight: "600" },
  inputWrap:   { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 },
  inputIcon:   { fontSize: 16, marginRight: 10 },
  input:       { flex: 1, padding: 14, color: "#fff", fontSize: 15 },
  btn:         { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnGrad:     { backgroundColor: "#7c3aed", padding: 16, alignItems: "center", borderRadius: 14 },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: "#fff", fontWeight: "800", fontSize: 16 },
  divider:     { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  divLine:     { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  divText:     { color: "#6b7280", fontSize: 13 },
  row:         { flexDirection: "row", justifyContent: "center" },
  mutedText:   { color: "#6b7280", fontSize: 14 },
  link:        { color: "#a78bfa", fontSize: 14, fontWeight: "700" },
  errorBox:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorIcon:   { fontSize: 16 },
  errorText:   { color: "#fca5a5", fontSize: 13, flex: 1 },
});
