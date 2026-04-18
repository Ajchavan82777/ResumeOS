"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store";
import type { User, Profile, Subscription } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPro: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Set a cookie that Next.js middleware can read
function setTokenCookie(token: string | null) {
  if (token) {
    // 7 days, SameSite=Lax works for same-origin requests
    document.cookie = `access_token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  } else {
    document.cookie = `access_token=; path=/; max-age=0`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const {
    user, profile, subscription, accessToken, isAuthenticated,
    setAuth, updateProfile: storeUpdateProfile, clearAuth,
  } = useAuthStore();
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("access_token") || accessToken;
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        // Set cookie so middleware sees the token
        setTokenCookie(token);
        const { data } = await authApi.me();
        setAuth(
          data.user,
          data.profile || {},
          data.subscription || { plan: "free", status: "active" },
          token
        );
      } catch (err: any) {
        // Token expired or invalid — clear everything
        clearAuth();
        setTokenCookie(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const token = data.access_token;

    // Store token in both localStorage and cookie
    localStorage.setItem("access_token", token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setTokenCookie(token);

    setAuth(
      data.user,
      data.user?.profile || {},
      data.user?.subscription || { plan: "free", status: "active" },
      token
    );
    toast.success("Welcome back!");

    // Check for redirect param
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "/dashboard";
    router.push(redirect);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register({ email, password, full_name: fullName });
    toast.success("Account created! Please sign in.");
    router.push("/auth/login");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors on logout
    }
    clearAuth();
    setTokenCookie(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    toast.success("Signed out successfully");
    router.push("/");
  };

  const updateProfile = (data: Partial<Profile>) => {
    storeUpdateProfile(data);
  };

  const isPro = subscription?.plan === "pro" || subscription?.plan === "enterprise";

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, isAuthenticated, isLoading, isPro,
      login, register, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
