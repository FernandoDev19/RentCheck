import { useNavigate } from "react-router";
import { getUser } from "../helpers/user.helper";
import { useSearch } from "../hooks/useSearch";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const { handleSearch } = useSearch();

  const actions = [
    {
      icon: "🔍",
      label: "Buscar Cliente",
      description: "Consulta historial, score y alertas",
      onClick: handleSearch,
    },
    {
      icon: "🏢",
      label: "Rentadoras",
      description: "Gestiona todas las empresas",
      onClick: () => navigate("/adm/renters"),
    },
    {
      icon: "🏢",
      label: "Sedes",
      description: "Gestiona tus sedes",
      onClick: () => navigate("/adm/branches"),
    },
    {
      icon: "👥",
      label: "Clientes",
      description: "Historial unificado",
      onClick: () => navigate(`/adm/customers`),
    },
    {
      icon: "👤",
      label: "Empleados",
      description: "Usuarios y accesos",
      onClick: () => navigate("/adm/employees"),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
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

      <div
        className="py-10 md:py-20 md:px-16"
        style={{ maxWidth: 680, margin: "0 auto" }}
      >
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <p
            style={{
              color: "#94a3b8",
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
              color: "#0f172a",
              margin: 0,
            }}
          >
            RentCheck HQ 🛡️ {user.name ? `— ${user.name}` : ""}
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 6, fontSize: 14 }}>
            Control total del sistema
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {actions.map((card, i) => (
            <button
              key={i}
              onClick={card.onClick}
              className="admin-card fade-up"
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: "24px 20px",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>{card.icon}</p>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {card.label}
              </p>
              <p style={{ color: "#64748b", fontSize: 12, margin: "4px 0 0" }}>
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
