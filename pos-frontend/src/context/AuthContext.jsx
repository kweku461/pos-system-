import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

// Returns true if the JWT is missing, malformed, or past its expiry
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    const name  = localStorage.getItem("name");

    // Don't restore a session whose token has already expired
    if (!token || isTokenExpired(token)) {
      clearStoredSession();
      return null;
    }
    return { token, role, name };
  });

  const login = (token, role, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);
    setUser({ token, role, name });
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
