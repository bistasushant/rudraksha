"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface Admin {
  email: string;
  name: string;
  role: "admin" | "editor" | "user";
  token?: string;
  image?: string;
}

interface AuthContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin | null) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string; token?: string }>;
  logout: () => Promise<void>;
  updateEmail: (newEmail: string) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.error) {
        const adminData = {
          email: data.data.email,
          name: data.data.name,
          role: data.data.role,
          token: data.data.token,
          image: data.data.image || "",
        };

        // Store admin data in localStorage
        localStorage.setItem("user", JSON.stringify(adminData));
        localStorage.setItem("authToken", data.data.token);

        // Also store username and role in localStorage for backward compatibility
        localStorage.setItem("username", adminData.name);
        localStorage.setItem("role", adminData.role);

        setAdmin(adminData);
        return { success: true, token: data.data.token };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      // Clear all authentication data
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("accountType");

      // Reset admin state
      setAdmin(null);

      // Redirect to home page
      window.location.href = "/admin";
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed");
    }
  };

  const updateEmail = (newEmail: string) => {
    if (admin) {
      const updatedAdmin = { ...admin, email: newEmail };
      setAdmin(updatedAdmin);
      localStorage.setItem("user", JSON.stringify(updatedAdmin));
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        // First check for user in localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAdmin(parsedUser);

          // Ensure username and role are also set in localStorage
          if (!localStorage.getItem("username") && parsedUser.name) {
            localStorage.setItem("username", parsedUser.name);
          }

          if (!localStorage.getItem("role") && parsedUser.role) {
            localStorage.setItem("role", parsedUser.role);
          }
        } else {
          // Try to build admin object from separate localStorage items
          const username = localStorage.getItem("username");
          const role = localStorage.getItem("role");
          const token = localStorage.getItem("authToken");

          if (username && role && token) {
            const constructedAdmin = {
              name: username,
              email: username, // Use username as email if no email is stored
              role: role as "admin" | "editor" | "user",
              token: token,
            };

            setAdmin(constructedAdmin);
            // Save the consolidated admin object back to localStorage
            localStorage.setItem("user", JSON.stringify(constructedAdmin));
          }
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        // Clear invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ admin, setAdmin, login, logout, updateEmail, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
