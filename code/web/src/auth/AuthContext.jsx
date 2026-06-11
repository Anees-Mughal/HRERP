import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "../api/client";
import { svc } from "../api/service";

const AuthContext = createContext(null);

export const ROLE_HOME = {
  SuperAdmin: "/dashboard",
  CompanyAdmin: "/dashboard",
  HRManager: "/dashboard",
  DeptManager: "/dashboard",
  Employee: "/me",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [loading, setLoading] = useState(false);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const data = await svc.login(identifier, password);
      tokenStore.set(data);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    window.location.assign("/login");
  };

  useEffect(() => {
    const onStorage = () => setUser(tokenStore.getUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      user, loading, login, logout,
      isAuthenticated: !!user,
      homePath: user ? ROLE_HOME[user.role] || "/dashboard" : "/login",
      isAdmin: ["SuperAdmin", "CompanyAdmin", "HRManager"].includes(user?.role),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
