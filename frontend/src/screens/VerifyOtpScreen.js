import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { API_BASE_URL } from '../config';

export default function VerifyOtpScreen({ navigation, route }) {
  const { activationToken, email } = route.params;
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");

  const handleVerify = async () => {
    setError(""); setSuccess("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/user/verify`, { activationToken, otp });
      setSuccess("Account verified! Redirecting to login...");
      setTimeout(() => navigation.replace("Login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.container}>

        <Text style={s.brand}>shop<Text style={s.dot}>.</Text></Text>

        <View style={s.card}>
          <Text style={s.title}>Verify your email</Text>
          <Text style={s.subtitle}>OTP sent to {email}</Text>

          {!!error   && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
          {!!success && <View style={s.successBox}><Text style={s.successText}>{success}</Text></View>}

          <Text style={s.label}>Enter 6-digit OTP</Text>
          <TextInput
            style={s.otpInput}
            placeholder="000000"
            placeholderTextColor="#333"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <Text style={s.timer}>
            {countdown > 0
              ? `OTP expires in ${mins}:${secs}`
              : "OTP expired — please register again"}
          </Text>

          <TouchableOpacity
            style={[s.btn, (loading || countdown === 0) && s.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || countdown === 0}
          >
            {loading
              ? <ActivityIndicator color="#0a0a0a" />
              : <Text style={s.btnText}>Verify Account →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: "#0a0a0a" },
  container:  { flex: 1, justifyContent: "center", padding: 24 },
  brand:      { fontSize: 32, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 32 },
  dot:        { color: "#e8ff47" },
  card:       { backgroundColor: "#141414", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#222" },
  title:      { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle:   { fontSize: 14, color: "#666", marginBottom: 20 },
  label:      { fontSize: 13, color: "#888", marginBottom: 6, fontWeight: "500" },
  otpInput: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 16, color: "#fff", fontSize: 28,
    fontWeight: "700", textAlign: "center", letterSpacing: 12, marginBottom: 12,
  },
  timer:      { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 16 },
  btn: {
    backgroundColor: "#e8ff47", borderRadius: 10, padding: 14, alignItems: "center",
  },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { color: "#0a0a0a", fontWeight: "700", fontSize: 15 },
  backBtn:    { alignItems: "center", marginTop: 16 },
  backText:   { color: "#555", fontSize: 14 },
  errorBox:   { backgroundColor: "#2a1010", borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#4a1a1a" },
  errorText:  { color: "#ff6b6b", fontSize: 13 },
  successBox: { backgroundColor: "#0f2a00", borderRadius: 8, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#2a4a00" },
  successText:{ color: "#8abf00", fontSize: 13 },
});