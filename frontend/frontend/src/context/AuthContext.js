import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true); // wait for AsyncStorage to load

  // Load saved token on app start
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedUser  = await AsyncStorage.getItem("user");
        if (savedToken) {
          setToken(savedToken);
          axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
        }
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.log("Auth load error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (newToken, userData) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        loading,
        isLoggedIn: !!token,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}