import "../styles/login.css";
import swiftLogo from "../assets/swiftpos-logo.jpeg";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";

function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, role, name } = res.data;

      login(token, role, name);
      navigate("/dashboard");

    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  // Already signed in — skip the login form
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">

        <img src={swiftLogo} alt="SwiftPOS" className="brand-logo" />
        <p className="login-subtitle">Sign in to your account</p>

        {error && (
          <div className="login-error">
            <FiAlertCircle /> {error}
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <div className="input-wrap">
            <span className="input-icon"><FiMail /></span>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-wrap">
            <span className="input-icon"><FiLock /></span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

      </div>
    </div>
  );
}

export default Login;
