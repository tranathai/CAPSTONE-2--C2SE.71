import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, users } from "../lib/api.js";

const AuthContext = createContext(null);

/** API /users/me trả role_name; đăng nhập trả role — gộp một chỗ để layout/RequireRole ổn định */
function normalizeUser(u) {
  if (!u || typeof u !== "object") return u;
  const rawRole = u.role ?? u.role_name;
  const role = rawRole === "teacher" || rawRole === "mentor" ? "supervisor" : rawRole;
  return role !== undefined ? { ...u, role } : u;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? normalizeUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  const login = useCallback((token, userData) => {
    const u = normalizeUser(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    users.me()
      .then((raw) => {
        const u = normalizeUser(raw);
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
