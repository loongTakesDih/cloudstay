import { useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "./AuthContextDef";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("cloudstay_token"));
  const [loading, setLoading] = useState(true);

  const getRedirectPath = (authUser) => {
    if (authUser?.role === "Admin") return "/admin/dashboard";
    return "/dashboard";
  };

  const saveAuth = (authData) => {
    localStorage.setItem("cloudstay_token", authData.token);
    setToken(authData.token);

    const userData = {
      userId: authData.userId,
      username: authData.username,
      email: authData.email,
      role: authData.role,
      isHost: authData.isHost,
    };

    setUser(userData);

    return getRedirectPath(userData);
  };

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    return saveAuth(response.data);
  };

  const register = async (username, email, password) => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });

    return saveAuth(response.data);
  };

  const becomeHost = async () => {
    const response = await api.post("/auth/become-host");

    localStorage.setItem("cloudstay_token", response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("cloudstay_token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const storedToken = localStorage.getItem("cloudstay_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);

        const response = await api.get("/auth/me");

        setUser(response.data.user ?? response.data);
      } catch (error) {
        console.error("Failed to load current user", error);
        localStorage.removeItem("cloudstay_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        becomeHost,
        logout,
        getRedirectPath,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
