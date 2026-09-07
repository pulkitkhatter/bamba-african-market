import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type AdminRole } from "../lib/api";

interface AuthState {
  email: string | null;
  role: AdminRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        setEmail(res.email);
        setRole(res.role);
      })
      .catch(() => {
        setEmail(null);
        setRole(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(loginEmail: string, password: string) {
    const res = await api.login(loginEmail, password);
    setEmail(res.email);
    setRole(res.role);
  }

  async function logout() {
    await api.logout();
    setEmail(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ email, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
