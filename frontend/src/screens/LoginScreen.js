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
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError("Server not responding. Check your connection.");
      } else if (!err.response) {
        setError(`Cannot reach server at ${API_BASE_URL}. Make sure backend is running.`);
      } else {
        setError(err.response?.data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <Text style={s.brand}>shop<Text style={s.dot}>.</Text></Text>

        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

          <Text style={s.label}>Email address</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="Your password"
            placeholderTextColor="#444"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0a0a0a" />
              : <Text style={s.btnText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <View style={s.row}>
            <Text style={s.mutedText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={s.link}>Create one</Text>
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