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
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = String(Math.floor(countdown / 60)).padStart(2, "0");
  const secs = String(countdown % 60).padStart(2, "0");
  const progress = countdown / 300;

  const handleVerify = async () => {
    setError(""); setSuccess("");
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/user/verify`, { activationToken, otp });
      setSuccess("Account verified! Redirecting...");
      setTimeout(() => navigation.replace("Login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.blob1} />
      <View style={s.blob2} />
      <View style={s.container}>

        <View style={s.iconWrap}>
          <Text style={s.iconText}>📧</Text>
        </View>
        <Text style={s.brand}>i shop<Text style={s.dot}>.</Text></Text>

        <View style={s.card}>
          <Text style={s.title}>Check your email</Text>
          <Text style={s.subtitle}>We sent a 6-digit code to</Text>
          <View style={s.emailBadge}><Text style={s.emailText}>{email}</Text></View>

          {!!error   && (
            <View style={s.errorBox}>
              <Text style={s.errorIcon}>⚠️</Text>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          {!!success && (
            <View style={s.successBox}>
              <Text style={s.successIcon}>✅</Text>
              <Text style={s.successText}>{success}</Text>
            </View>
          )}

          <TextInput
            style={s.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor="#4b5563"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <View style={s.timerRow}>
            <View style={s.timerBar}>
              <View style={[s.timerFill, { width: `${progress * 100}%`, backgroundColor: progress > 0.4 ? "#10b981" : progress > 0.2 ? "#f59e0b" : "#ef4444" }]} />
            </View>
            <Text style={[s.timerText, { color: countdown > 60 ? "#10b981" : "#ef4444" }]}>
              {countdown > 0 ? `${mins}:${secs}` : "Expired"}
            </Text>
          </View>

          <TouchableOpacity
            style={[s.btn, (loading || countdown === 0) && s.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || countdown === 0}
          >
            <View style={s.btnGrad}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Verify Account →</Text>
              }
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back to Register</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: "#0f0c29" },
  blob1:      { position: "absolute", top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: "#06b6d4", opacity: 0.3 },
  blob2:      { position: "absolute", bottom: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "#7c3aed", opacity: 0.3 },
  container:  { flex: 1, justifyContent: "center", padding: 24 },
  iconWrap:   { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(6,182,212,0.2)", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(6,182,212,0.4)" },
  iconText:   { fontSize: 34 },
  brand:      { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 24, letterSpacing: -1 },
  dot:        { color: "#a78bfa" },
  card:       { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  title:      { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4, textAlign: "center" },
  subtitle:   { fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 10 },
  emailBadge: { backgroundColor: "rgba(124,58,237,0.2)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(124,58,237,0.4)" },
  emailText:  { color: "#c4b5fd", fontSize: 13, fontWeight: "600" },
  otpInput:   { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 18, color: "#fff", fontSize: 32, fontWeight: "800", textAlign: "center", letterSpacing: 16, marginBottom: 16 },
  timerRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  timerBar:   { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  timerFill:  { height: "100%", borderRadius: 3 },
  timerText:  { fontSize: 13, fontWeight: "700", minWidth: 40, textAlign: "right" },
  btn:        { borderRadius: 14, overflow: "hidden" },
  btnGrad:    { backgroundColor: "#06b6d4", padding: 16, alignItems: "center", borderRadius: 14 },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { color: "#fff", fontWeight: "800", fontSize: 16 },
  backBtn:    { alignItems: "center", marginTop: 16 },
  backText:   { color: "#6b7280", fontSize: 14 },
  errorBox:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorIcon:  { fontSize: 16 },
  errorText:  { color: "#fca5a5", fontSize: 13, flex: 1 },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  successIcon:{ fontSize: 16 },
  successText:{ color: "#6ee7b7", fontSize: 13, flex: 1 },
});
