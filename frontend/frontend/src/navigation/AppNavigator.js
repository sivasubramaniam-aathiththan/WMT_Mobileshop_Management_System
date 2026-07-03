import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import LoginScreen           from "../screens/LoginScreen";
import RegisterScreen        from "../screens/RegisterScreen";
import VerifyOtpScreen       from "../screens/VerifyOtpScreen";
import ProductsScreen        from "../screens/ProductsScreen";
import ProductDetailScreen   from "../screens/ProductDetailScreen";
import CartScreen            from "../screens/CartScreen";
import CheckoutScreen        from "../screens/CheckoutScreen";
import MyOrdersScreen        from "../screens/MyOrdersScreen";
import AdminDashboardScreen  from "../screens/AdminDashboardScreen";
import AdminOrdersScreen     from "../screens/AdminOrdersScreen";
import UserManagementScreen  from "../screens/UserManagementScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  // Show spinner while AsyncStorage loads
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" }}>
        <ActivityIndicator size="large" color="#e8ff47" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,      // we build our own headers
          animation: "slide_from_right",
          contentStyle: { backgroundColor: "#0a0a0a" },
        }}
      >
        {!isLoggedIn ? (
          // ── Auth screens ──────────────────────────
          <>
            <Stack.Screen name="Login"     component={LoginScreen} />
            <Stack.Screen name="Register"  component={RegisterScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        ) : isAdmin ? (
          // ── Admin screens ─────────────────────────
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminOrders"    component={AdminOrdersScreen} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} />
          </>
        ) : (
          // ── User screens ──────────────────────────
          <>
            <Stack.Screen name="Products"      component={ProductsScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Cart"          component={CartScreen} />
            <Stack.Screen name="Checkout"      component={CheckoutScreen} />
            <Stack.Screen name="MyOrders"      component={MyOrdersScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}