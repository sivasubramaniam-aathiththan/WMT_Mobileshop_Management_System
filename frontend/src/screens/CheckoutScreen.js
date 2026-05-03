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
  page:    { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", backgroundColor: "#0f0f0f",
  },
  backText:    { color: "#fff", fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  stepLabel:   { color: "#555", fontSize: 14 },
  stepBar:     { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 12 },
  stepDot:     { width: 30, height: 4, borderRadius: 2, backgroundColor: "#2a2a2a" },
  stepDotActive:{ backgroundColor: "#e8ff47" },
  scroll:      { padding: 16, paddingBottom: 8 },
  card:        { backgroundColor: "#141414", borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#1e1e1e" },
  formGroup:   { marginBottom: 12 },
  label:       { fontSize: 13, color: "#888", marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    borderRadius: 10, padding: 12, color: "#fff", fontSize: 14,
  },
  row:         { flexDirection: "row" },
  cardVisual: {
    backgroundColor: "#16213e", borderRadius: 12, padding: 20, marginBottom: 18,
  },
  cardChip:    { color: "#e8ff47", fontSize: 20, marginBottom: 16, letterSpacing: -4, opacity: 0.85 },
  cardNumber:  { color: "#fff", fontSize: 15, letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 },
  cardBottom:  { flexDirection: "row", justifyContent: "space-between" },
  cardBottomText:{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 },
  secureNote:  { fontSize: 12, color: "#555", textAlign: "center", marginTop: 8 },
  reviewSection:{ backgroundColor: "#1a1a1a", borderRadius: 10, padding: 12, marginBottom: 10 },
  reviewLabel: { fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontWeight: "600" },
  reviewValue: { fontSize: 14, color: "#ccc", lineHeight: 22 },
  reviewItem:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  reviewItemName: { fontSize: 13, color: "#aaa" },
  reviewItemPrice:{ fontSize: 13, color: "#e8ff47", fontWeight: "600" },
  summaryCard: { backgroundColor: "#141414", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e1e1e" },
  summaryTitle:{ fontSize: 15, fontWeight: "600", color: "#fff", marginBottom: 10 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  summaryItemName: { fontSize: 13, color: "#888", flex: 1 },
  summaryItemPrice:{ fontSize: 13, color: "#e8ff47", fontWeight: "600" },
  summaryTotal:{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "600", color: "#fff" },
  summaryTotalAmount:{ fontSize: 18, fontWeight: "700", color: "#e8ff47" },
  footer:      { padding: 16, borderTopWidth: 1, borderTopColor: "#1e1e1e", backgroundColor: "#0f0f0f" },
  nextBtn:     { backgroundColor: "#e8ff47", borderRadius: 12, padding: 16, alignItems: "center" },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
  errorBox:    { backgroundColor: "#2a1010", borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: "#4a1a1a" },
  errorText:   { color: "#ff6b6b", fontSize: 13 },
});