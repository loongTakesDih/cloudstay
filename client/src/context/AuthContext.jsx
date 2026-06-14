import { useEffect, useState } from "react";
import api, {
  completeHostOnboarding as completeHostOnboardingRequest,
} from "../api/api";
import { AuthContext } from "./AuthContextDef";

const TOKEN_KEY = "cloudstay_token";

const setAuthToken = (nextToken) => {
  if (nextToken) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const normalizeAuthResponse = (data) => {
  const source = data?.user ?? data;

  if (!source) {
    return {
      token: data?.token,
      user: null,
    };
  }

  return {
    token: data?.token ?? source?.token,
    user: {
      userId: source.userId ?? source.UserId ?? source.id ?? source.Id,
      username: source.username ?? source.Username ?? "",
      email: source.email ?? source.Email ?? "",
      role: source.role ?? source.Role ?? "User",
      isHost: toBoolean(source.isHost ?? source.IsHost),
      createdAt: source.createdAt ?? source.CreatedAt ?? source.created_at,
    },
  };
};

const isUnauthorizedError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const getRedirectPath = () => {
    return "/dashboard";
  };

  const saveAuth = (authData) => {
    const { token: nextToken, user: userData } = normalizeAuthResponse(authData);

    if (nextToken) {
      setAuthToken(nextToken);
      setToken(nextToken);
    }

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
    return "/become-host";
  };

  const completeHostOnboarding = async (payload) => {
    const data = await completeHostOnboardingRequest(payload);
    saveAuth(data.user ?? data);

    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        setToken(storedToken);

        const response = await api.get("/auth/me");
        const { user: latestUser } = normalizeAuthResponse(response.data);

        setUser(latestUser);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          setAuthToken(null);
          setToken(null);
          setUser(null);
        } else {
          console.warn("Could not refresh current user state", error);
        }
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
        completeHostOnboarding,
        logout,
        getRedirectPath,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
