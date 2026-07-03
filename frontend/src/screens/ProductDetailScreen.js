import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator,
} from "react-native";
import axios from "axios";
import { BASE_URL, API_BASE_URL } from '../config';
import { useAuth } from "../context/AuthContext";

const Stars = ({ rating, onSelect }) => (
  <View style={{ flexDirection: "row", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <TouchableOpacity key={s} onPress={() => onSelect && onSelect(s)} disabled={!onSelect}>
        <Text style={{ fontSize: 20, color: s <= rating ? "#e8ff47" : "#333" }}>★</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function ProductDetailScreen({ navigation, route }) {
  const { product, cart: initialCart } = route.params;
  const { token, user } = useAuth();
  const [qty, setQty]             = useState(1);
  const [localCart, setLocalCart] = useState(initialCart || []);

  const [reviews, setReviews]     = useState([]);
  const [revLoading, setRevLoading] = useState(true);
  const [rating, setRating]       = useState(5);
  const [comment, setComment]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const inCartQty      = localCart?.find((i) => i._id === product._id)?.qty || 0;
  const availableStock = product.stock - inCartQty;

  const handleAddToCart = () => {
    if (availableStock < qty) return;
    const updatedCart = (() => {
      const existing = localCart.find((i) => i._id === product._id);
      if (existing)
        return localCart.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      return [...localCart, { ...product, product: product._id, qty }];
    })();
    setLocalCart(updatedCart);
    navigation.navigate("Products", { updatedCart });
  };

  const fetchReviews = useCallback(async () => {
    setRevLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/reviews/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data.reviews);
    } catch { } finally { setRevLoading(false); }
  }, [product._id, token]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const myReview = reviews.find((r) => r.user === user?._id || r.user?._id === user?._id);

  const handleSubmitReview = async () => {
    if (!comment.trim()) return Alert.alert("Error", "Please write a comment.");
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/reviews/${product._id}`, { rating, comment }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComment(""); setRating(5);
      fetchReviews();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to submit review.");
    } finally { setSubmitting(false); }
  };

  const handleEditReview = async (id) => {
    if (!editComment.trim()) return Alert.alert("Error", "Please write a comment.");
    setSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}/reviews/${id}`, { rating: editRating, comment: editComment }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingId(null);
      fetchReviews();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to update review.");
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = (id) => {
    Alert.alert("Delete Review", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/reviews/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchReviews();
          } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Failed to delete review.");
          }
        },
      },
    ]);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <SafeAreaView style={s.page}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {product.image ? (
          <Image
            source={{ uri: product.image.startsWith("http") ? product.image : `${BASE_URL}/${product.image}` }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={s.imgPlaceholder}><Text style={{ fontSize: 72 }}>📦</Text></View>
        )}

        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={s.body}>
          <Text style={s.title}>{product.name || product.title}</Text>
          <Text style={s.desc}>{product.description}</Text>

          <View style={s.priceRow}>
            <Text style={s.price}>Rs. {product.price?.toLocaleString()}</Text>
            {product.mrp > product.price && (
              <Text style={s.mrp}>Rs. {product.mrp?.toLocaleString()}</Text>
            )}
            {discount > 0 && (
              <View style={s.discountBadge}>
                <Text style={s.discountText}>{discount}% off</Text>
              </View>
            )}
          </View>

          <View style={s.metaBox}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Stock</Text>
              <Text style={[s.metaVal, product.stock < 5 && { color: "#cc8800" }]}>
                {product.stock === 0 ? "Out of stock" : `${product.stock} units total`}
              </Text>
            </View>
            {inCartQty > 0 && (
              <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
                <Text style={s.metaLabel}>Already in Cart</Text>
                <Text style={[s.metaVal, { color: "#4a9eff" }]}>{inCartQty} units</Text>
              </View>
            )}
            {availableStock !== product.stock && (
              <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
                <Text style={s.metaLabel}>Available to Add</Text>
                <Text style={[s.metaVal, { color: availableStock > 0 ? "#8abf00" : "#ff6b6b" }]}>
                  {availableStock > 0 ? `${availableStock} units` : "Out of stock"}
                </Text>
              </View>
            )}
            <View style={[s.metaRow, { borderTopWidth: 1, borderTopColor: "#1e1e1e" }]}>
              <Text style={s.metaLabel}>You save</Text>
              <Text style={[s.metaVal, { color: "#e8ff47" }]}>
                Rs. {(product.mrp - product.price)?.toLocaleString()}
              </Text>
            </View>
          </View>

          {availableStock > 0 && (
            <View style={s.qtyRow}>
              <Text style={s.qtyLabel}>Quantity</Text>
              <View style={s.qtyControls}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[s.qtyBtn, qty >= availableStock && { opacity: 0.35 }]}
                  onPress={() => qty < availableStock && setQty((q) => q + 1)}
                  disabled={qty >= availableStock}
                >
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[s.addBtn, (availableStock <= 0 || qty > availableStock) && s.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={availableStock <= 0 || qty > availableStock}
          >
            <Text style={s.addBtnText}>
              {availableStock <= 0
                ? "Out of Stock"
                : `Add ${qty} to Cart — Rs. ${(product.price * qty).toLocaleString()}`}
            </Text>
          </TouchableOpacity>

          {/* ── REVIEWS ── */}
          <View style={s.reviewsHeader}>
            <Text style={s.sectionTitle}>Reviews</Text>
            {avgRating && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={s.avgRating}>{avgRating}</Text>
                <Stars rating={Math.round(avgRating)} />
                <Text style={s.reviewCount}>({reviews.length})</Text>
              </View>
            )}
          </View>

          {/* Add review form — only if user hasn't reviewed yet */}
          {!myReview && (
            <View style={s.reviewForm}>
              <Text style={s.reviewFormTitle}>Write a Review</Text>
              <Stars rating={rating} onSelect={setRating} />
              <TextInput
                style={s.reviewInput}
                placeholder="Share your experience..."
                placeholderTextColor="#444"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[s.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#0a0a0a" />
                  : <Text style={s.submitBtnText}>Submit Review</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Review list */}
          {revLoading
            ? <ActivityIndicator color="#e8ff47" style={{ marginTop: 16 }} />
            : reviews.length === 0
              ? <Text style={s.noReviews}>No reviews yet. Be the first!</Text>
              : reviews.map((r) => {
                  const isOwner = r.user === user?._id || r.user?._id === user?._id;
                  const isEditing = editingId === r._id;
                  return (
                    <View key={r._id} style={s.reviewCard}>
                      <View style={s.reviewTop}>
                        <View>
                          <Text style={s.reviewerName}>{r.name}</Text>
                          <Stars rating={r.rating} />
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <Text style={s.reviewDate}>
                            {new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </Text>
                          {isOwner && !isEditing && (
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <TouchableOpacity onPress={() => { setEditingId(r._id); setEditRating(r.rating); setEditComment(r.comment); }}>
                                <Text style={s.editText}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeleteReview(r._id)}>
                                <Text style={s.deleteText}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>

                      {isEditing ? (
                        <View style={{ marginTop: 10 }}>
                          <Stars rating={editRating} onSelect={setEditRating} />
                          <TextInput
                            style={[s.reviewInput, { marginTop: 8 }]}
                            value={editComment}
                            onChangeText={setEditComment}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#444"
                          />
                          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                            <TouchableOpacity
                              style={[s.submitBtn, { flex: 1, opacity: submitting ? 0.6 : 1 }]}
                              onPress={() => handleEditReview(r._id)}
                              disabled={submitting}
                            >
                              <Text style={s.submitBtnText}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[s.submitBtn, { flex: 1, backgroundColor: "#1a1a1a" }]}
                              onPress={() => setEditingId(null)}
                            >
                              <Text style={[s.submitBtnText, { color: "#888" }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={s.reviewComment}>{r.comment}</Text>
                      )}
                    </View>
                  );
                })
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: "#0a0a0a" },
  image:          { width: "100%", height: 280 },
  imgPlaceholder: { width: "100%", height: 280, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" },
  backBtn: {
    position: "absolute", top: 16, left: 16,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 20,
    width: 40, height: 40, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#333",
  },
  backBtnText:    { color: "#fff", fontSize: 18 },
  body:           { padding: 20 },
  title:          { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 8, letterSpacing: -0.3 },
  desc:           { fontSize: 14, color: "#666", lineHeight: 22, marginBottom: 16 },
  priceRow:       { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  price:          { fontSize: 26, fontWeight: "700", color: "#e8ff47" },
  mrp:            { fontSize: 15, color: "#444", textDecorationLine: "line-through" },
  discountBadge:  { backgroundColor: "#0f2a00", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  discountText:   { fontSize: 13, color: "#8abf00", fontWeight: "700" },
  metaBox:        { backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14, marginBottom: 16 },
  metaRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  metaLabel:      { fontSize: 13, color: "#666" },
  metaVal:        { fontSize: 14, fontWeight: "600", color: "#fff" },
  qtyRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  qtyLabel:       { fontSize: 15, fontWeight: "500", color: "#fff" },
  qtyControls:    { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn:         { width: 36, height: 36, backgroundColor: "#1a1a1a", borderRadius: 8, borderWidth: 1, borderColor: "#2a2a2a", justifyContent: "center", alignItems: "center" },
  qtyBtnText:     { color: "#fff", fontSize: 18, fontWeight: "600" },
  qtyNum:         { fontSize: 18, fontWeight: "700", color: "#fff", minWidth: 30, textAlign: "center" },
  addBtn:         { backgroundColor: "#e8ff47", borderRadius: 12, padding: 16, alignItems: "center" },
  addBtnDisabled: { opacity: 0.35 },
  addBtnText:     { color: "#0a0a0a", fontWeight: "700", fontSize: 16 },
  // reviews
  reviewsHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 14, borderTopWidth: 1, borderTopColor: "#1e1e1e", paddingTop: 20 },
  sectionTitle:   { fontSize: 16, fontWeight: "700", color: "#fff" },
  avgRating:      { fontSize: 18, fontWeight: "700", color: "#e8ff47" },
  reviewCount:    { fontSize: 13, color: "#555" },
  reviewForm:     { backgroundColor: "#141414", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 16 },
  reviewFormTitle:{ fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 10 },
  reviewInput:    { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 10, padding: 12, color: "#fff", fontSize: 14, marginTop: 10, textAlignVertical: "top" },
  submitBtn:      { backgroundColor: "#e8ff47", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 10 },
  submitBtnText:  { color: "#0a0a0a", fontWeight: "700", fontSize: 14 },
  noReviews:      { color: "#555", fontSize: 14, textAlign: "center", marginVertical: 20 },
  reviewCard:     { backgroundColor: "#141414", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 10 },
  reviewTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  reviewerName:   { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 },
  reviewDate:     { fontSize: 11, color: "#555" },
  reviewComment:  { fontSize: 13, color: "#888", lineHeight: 20, marginTop: 6 },
  editText:       { fontSize: 12, color: "#4a9eff", fontWeight: "600" },
  deleteText:     { fontSize: 12, color: "#ff6b6b", fontWeight: "600" },
});
