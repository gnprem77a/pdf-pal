import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "business";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("pdftools-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call when backend is connected
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    
    const mockUser: User = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
      plan: "free",
    };
    
    setUser(mockUser);
    localStorage.setItem("pdftools-user", JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const signup = async (email: string, password: string, name: string) => {
    // TODO: Replace with actual API call when backend is connected
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    
    const mockUser: User = {
      id: "user_" + Math.random().toString(36).substr(2, 9),
      email,
      name,
      plan: "free",
    };
    
    setUser(mockUser);
    localStorage.setItem("pdftools-user", JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("pdftools-user");
  };

  const resetPassword = async (email: string) => {
    // TODO: Replace with actual API call when backend is connected
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    console.log("Password reset email sent to:", email);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, resetPassword }}>
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
