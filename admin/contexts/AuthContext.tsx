"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    const token = localStorage.getItem("admin_access_token");
    if (token) {
      await validateToken(token);
    } else {
      setLoading(false);
      router.replace("/login");
    }
  }

  async function validateToken(token: string) {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setIsAuthenticated(true);
        setCurrentUser(user);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (data.user.role !== "admin") {
      throw new Error("Access denied. Admin only.");
    }

    localStorage.setItem("admin_access_token", data.accessToken);
    setIsAuthenticated(true);
    setCurrentUser(data.user);
    router.push("/dashboard");
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("admin_access_token");
      setIsAuthenticated(false);
      setCurrentUser(null);
      router.replace("/login");
    }
  }

  function getToken() {
    return localStorage.getItem("admin_access_token");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}