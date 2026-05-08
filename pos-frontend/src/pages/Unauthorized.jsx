import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", gap: "16px"
    }}>
      <h2 style={{ fontSize: "24px", color: "#eb5757" }}>⛔ Access Denied</h2>
      <p style={{ color: "#666" }}>You don't have permission to view this page.</p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "10px 24px", background: "#2f80ed", color: "white",
          border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px"
        }}
      >
        Go Back
      </button>
    </div>
  );
}

export default Unauthorized;