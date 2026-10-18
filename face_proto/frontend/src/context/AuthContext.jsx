import { createContext, useContext, useEffect, useState } from "react";
import { clearToken, getMe, getToken, login as apiLogin, setToken, signup as apiSignup } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function rehydrate() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await getMe();
        if (me && me.id) {
          setUser(me);
        } else {
          clearToken();
        }
      } catch {
        // Backend unreachable — treat as logged out, don't block the UI
        clearToken();
      } finally {
        setLoading(false);
      }
    }
    rehydrate();
  }, []);

  async function login(email, password) {
    const data = await apiLogin(email, password);
    if (data.ok) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  async function signup(name, email, password) {
    const data = await apiSignup(name, email, password);
    if (data.ok) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
