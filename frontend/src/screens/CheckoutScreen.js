import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';

const formatCard   = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (v) => v.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");

const Field = ({ label, value, onChangeText, placeholder, keyboard, secure }) => (
  <View style={s.formGroup}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={s.input}
      placeholder={placeholder}
      placeholderTextColor="#444"
      keyboardType={keyboard || "default"}
      autoCapitalize="none"
      secureTextEntry={!!secure}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

export default function CheckoutScreen({ navigation, route }) {
  const { cart } = route.params;
  const { token } = useAuth();

  const [step, setStep]     = useState(1);
  const [address, setAddress] = useState({ fullName: "", phone: "", street: "", city: "", state: "", zip: "" });
  const [payment, setPayment] = useState({ cardHolder: "", cardNumber: "", expiry: "", cvv: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const setAddr = (k, v) => setAddress({ ...address, [k]: v });
  const setPay  = (k, v) => {
    if (k === "cardNumber") v = formatCard(v);
    if (k === "expiry")     v = formatExpiry(v);
    if (k === "cvv")        v = v.replace(/\D/g, "").slice(0, 3);
    setPayment({ ...payment, [k]: v });
  };

  const validateAddress = () => {
    const { fullName, phone, street, city, state, zip } = address;
    if (!fullName || !phone || !street || !city || !state || !zip) return "All address fields are required.";
    return "";
  };

  const validatePayment = () => {
    const { cardHolder, cardNumber, expiry, cvv } = payment;
    if (!cardHolder || !cardNumber || !expiry || !cvv) return "All payment fields are required.";
    if (cardNumber.replace(/\s/g, "").length !== 16) return "Enter a valid 16-digit card number.";
    if (cvv.length !== 3) return "CVV must be 3 digits.";
    return "";
  };

  const handleNext = () => {
    setError("");
    if (step === 1) { const e = validateAddress(); if (e) { setError(e); return; } }
    if (step === 2) { const e = validatePayment();  if (e) { setError(e); return; } }
    setStep((s) => s + 1);
  };

  const handlePlaceOrder = async () => {
    setLoading(true); setError("");
    try {
      await axios.post(
        `${API_BASE_URL}/order/place`,
        { items: cart, address, payment },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      navigation.navigate("Products", { orderSuccess: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {step === 1 ? "Delivery Address" : step === 2 ? "Payment" : "Review Order"}
          </Text>
          <Text style={s.stepLabel}>{step}/3</Text>
        </View>

        {/* Step bar */}
        <View style={s.stepBar}>
          {[1,2,3].map((n) => (
            <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

          {/* STEP 1: ADDRESS */}
          {step === 1 && (
            <View style={s.card}>
              <Field label="Full name"       value={address.fullName} onChangeText={(v) => setAddr("fullName", v)} placeholder="John Doe" />
              <Field label="Phone"           value={address.phone}    onChangeText={(v) => setAddr("phone", v)}    placeholder="0771234567" keyboard="phone-pad" />
              <Field label="Street address"  value={address.street}   onChangeText={(v) => setAddr("street", v)}   placeholder="123 Main Street" />
              <Field label="City"            value={address.city}     onChangeText={(v) => setAddr("city", v)}     placeholder="Colombo" />
              <Field label="State"           value={address.state}    onChangeText={(v) => setAddr("state", v)}    placeholder="Western" />
              <Field label="ZIP code"        value={address.zip}      onChangeText={(v) => setAddr("zip", v)}      placeholder="10100" keyboard="number-pad" />
            </View>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 2 && (
            <View style={s.card}>
              {/* Card visual */}
              <View style={s.cardVisual}>
                <Text style={s.cardChip}>▪▪▪</Text>
                <Text style={s.cardNumber}>{payment.cardNumber || "•••• •••• •••• ••••"}</Text>
                <View style={s.cardBottom}>
                  <Text style={s.cardBottomText}>{payment.cardHolder || "CARD HOLDER"}</Text>
                  <Text style={s.cardBottomText}>{payment.expiry || "MM/YY"}</Text>
                </View>
              </View>

              <Field label="Card holder name" value={payment.cardHolder}  onChangeText={(v) => setPay("cardHolder", v)}  placeholder="John Doe" />
              <Field label="Card number"      value={payment.cardNumber}  onChangeText={(v) => setPay("cardNumber", v)}  placeholder="1234 5678 9012 3456" keyboard="number-pad" />
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Expiry" value={payment.expiry} onChangeText={(v) => setPay("expiry", v)} placeholder="MM/YY" keyboard="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="CVV" value={payment.cvv} onChangeText={(v) => setPay("cvv", v)} placeholder="•••" secure keyboard="number-pad" />
                </View>
              </View>
              <Text style={s.secureNote}>🔒 Your details are encrypted and secure</Text>
            </View>
          )}

          {/* STEP 3: REVIEW */}
          {step === 3 && (
            <View style={s.card}>
              <View style={s.reviewSection}>
                <Text style={s.reviewLabel}>Delivering to</Text>
                <Text style={s.reviewValue}>
                  {address.fullName} · {address.phone}{"\n"}
                  {address.street}, {address.city}, {address.state} {address.zip}
                </Text>
              </View>
              <View style={s.reviewSection}>
                <Text style={s.reviewLabel}>Payment</Text>
                <Text style={s.reviewValue}>
                  {payment.cardHolder}{"\n"}
                  •••• {payment.cardNumber.slice(-4)}
                </Text>
              </View>
              <View style={s.reviewSection}>
                <Text style={s.reviewLabel}>Items ({cart.length})</Text>
                {cart.map((item) => (
                  <View key={item._id} style={s.reviewItem}>
                    <Text style={s.reviewItemName}>{item.name || item.title} ×{item.qty}</Text>
                    <Text style={s.reviewItemPrice}>Rs. {(item.price * item.qty).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Order summary */}
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item._id} style={s.summaryItem}>
                <Text style={s.summaryItemName}>{item.name || item.title} ×{item.qty}</Text>
                <Text style={s.summaryItemPrice}>Rs. {(item.price * item.qty).toLocaleString()}</Text>
              </View>
            ))}
            <View style={s.summaryTotal}>
              <Text style={s.summaryTotalLabel}>Total</Text>
              <Text style={s.summaryTotalAmount}>Rs. {total.toLocaleString()}</Text>
            </View>
          </View>

        </ScrollView>

        {/* Footer button */}
        <View style={s.footer}>
          {step < 3 ? (
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextBtnText}>
                {step === 1 ? "Continue to Payment →" : "Review Order →"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, loading && s.nextBtnDisabled]}
              onPress={handlePlaceOrder}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#0a0a0a" />
                : <Text style={s.nextBtnText}>Place Order — Rs. {total.toLocaleString()}</Text>
              }
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: "#0f0c29" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15,12,41,0.95)",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  stepLabel:   { color: "#6b7280", fontSize: 14 },
  stepBar:     { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 14 },
  stepDot:     { width: 36, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)" },
  stepDotActive:{ backgroundColor: "#7c3aed" },
  scroll:      { padding: 16, paddingBottom: 8 },
  card:        { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  formGroup:   { marginBottom: 12 },
  label:       { fontSize: 13, color: "#c4b5fd", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12, padding: 13, color: "#fff", fontSize: 14,
  },
  row:         { flexDirection: "row" },
  cardVisual: {
    backgroundColor: "#1e1b4b", borderRadius: 16, padding: 20, marginBottom: 18,
    borderWidth: 1, borderColor: "rgba(124,58,237,0.4)",
  },
  cardChip:    { color: "#a78bfa", fontSize: 20, marginBottom: 16, letterSpacing: -4, opacity: 0.85 },
  cardNumber:  { color: "#fff", fontSize: 15, letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 },
  cardBottom:  { flexDirection: "row", justifyContent: "space-between" },
  cardBottomText:{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 },
  secureNote:  { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 8 },
  reviewSection:{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  reviewLabel: { fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: "700" },
  reviewValue: { fontSize: 14, color: "#d1d5db", lineHeight: 22 },
  reviewItem:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  reviewItemName: { fontSize: 13, color: "#9ca3af" },
  reviewItemPrice:{ fontSize: 13, color: "#a78bfa", fontWeight: "700" },
  summaryCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  summaryTitle:{ fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 10 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  summaryItemName: { fontSize: 13, color: "#9ca3af", flex: 1 },
  summaryItemPrice:{ fontSize: 13, color: "#a78bfa", fontWeight: "700" },
  summaryTotal:{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  summaryTotalAmount:{ fontSize: 20, fontWeight: "800", color: "#a78bfa" },
  footer:      { padding: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15,12,41,0.95)" },
  nextBtn:     { backgroundColor: "#7c3aed", borderRadius: 14, padding: 16, alignItems: "center" },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errorBox:    { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  errorText:   { color: "#fca5a5", fontSize: 13 },
});