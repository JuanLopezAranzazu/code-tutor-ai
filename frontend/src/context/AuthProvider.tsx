import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  fetchMe,
  loginRequest,
  registerRequest,
  setAuthToken,
} from "../api/client";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "../types";

const TOKEN_KEY = "code-tutor-ai:token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(() => {
    return localStorage.getItem(TOKEN_KEY) !== null;
  });

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      return;
    }

    setAuthToken(stored);

    fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await loginRequest(email, password);

    localStorage.setItem(TOKEN_KEY, res.access_token);
    setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }

  async function register(email: string, password: string, name?: string) {
    const res = await registerRequest(email, password, name);

    localStorage.setItem(TOKEN_KEY, res.access_token);
    setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
