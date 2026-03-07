import { useNavigate } from "react-router";
import { getUser } from "../helpers/user.helper";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .admin-card {
          transition: transform 0.18s ease, background 0.18s ease;
          cursor: pointer; border: none; text-align: left;
        }
        .admin-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.08) !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <p
            style={{
              color: "#475569",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Admin Master
          </p>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 34,
              fontWeight: 900,
              color: "#fff",
              margin: 0,
            }}
          >
            RentCheck HQ 🛡️ {user.name ? `— ${user.name}` : ""}
          </h1>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
            Control total del sistema
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {[
            {
              icon: "🏢",
              label: "Rentadoras",
              description: "Gestiona todas las empresas",
              onClick: () => navigate("/adm/renters"),
            },
          ].map((card, i) => (
            <button
              key={i}
              onClick={card.onClick}
              className="admin-card fade-up"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: "24px 20px",
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>{card.icon}</p>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                }}
              >
                {card.label}
              </p>
              <p style={{ color: "#475569", fontSize: 12, margin: "4px 0 0" }}>
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}