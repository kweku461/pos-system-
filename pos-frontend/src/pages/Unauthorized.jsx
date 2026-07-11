import { useNavigate } from "react-router-dom";
import { FiLock } from "react-icons/fi";

function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", gap: "14px",
      background: "var(--bg)",
    }}>
      <span style={{
        width: "64px", height: "64px", borderRadius: "16px",
        background: "var(--danger-soft)", color: "var(--danger)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "28px", border: "1px solid var(--danger-border)",
      }}>
        <FiLock />
      </span>
      <h2 style={{ fontSize: "22px", color: "var(--text)", fontWeight: 700 }}>
        Access Denied
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
        You don't have permission to view this page.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "10px 24px", background: "var(--primary)", color: "white",
          border: "none", borderRadius: "8px", cursor: "pointer",
          fontSize: "14px", fontWeight: 600, marginTop: "6px",
        }}
      >
        Go Back
      </button>
    </div>
  );
}

export default Unauthorized;
