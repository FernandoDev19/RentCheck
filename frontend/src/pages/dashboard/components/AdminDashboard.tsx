import { useNavigate } from "react-router";
import { getUser } from "../helpers/user.helper";
import { useSearch } from "../hooks/useSearch";
import type { UserActiveType } from "../../../shared/types/user-active.type";

const CARDS = [
  {
    icon: "🔍",
    label: "Buscar Cliente",
    description: "Consulta historial, score y alertas",
    path: null, // handled by onClick
    color: "#0f172a",
  },
  {
    icon: "🏢",
    label: "Rentadoras",
    description: "Gestiona todas las empresas",
    path: "/adm/renters",
    color: "#4f46e5",
  },
  {
    icon: "🏠",
    label: "Sedes",
    description: "Sedes de todas las rentadoras",
    path: "/adm/branches",
    color: "#0891b2",
  },
  {
    icon: "👥",
    label: "Clientes",
    description: "Historial unificado de clientes",
    path: "/adm/customers",
    color: "#059669",
  },
  {
    icon: "👤",
    label: "Empleados",
    description: "Usuarios y accesos por sede",
    path: "/adm/employees",
    color: "#7c3aed",
  },
  {
    icon: "🚗",
    label: "Vehículos",
    description: "Inventario global de vehículos",
    path: "/adm/vehicles",
    color: "#b45309",
  },
  {
    icon: "📋",
    label: "Rentas",
    description: "Historial global de rentas",
    path: "/adm/rentals",
    color: "#be185d",
  },
  {
    icon: "✍️",
    label: "Feedbacks pendientes",
    description: "Rentas devueltas sin calificar",
    path: "/adm/feedbacks",
    color: "#d97706",
  },
  {
    icon: "🔑",
    label: "Usuarios del sistema",
    description: "Todos los usuarios registrados",
    path: "/adm/users",
    color: "#0f172a",
  },
  {
    icon: "💎",
    label: "Planes",
    description: "Gestiona los planes de suscripción",
    path: "/adm/plans",
    color: "#6d28d9",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user: UserActiveType = getUser();
  const { handleSearch } = useSearch();

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
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          cursor: pointer; border: none; text-align: left; width: 100%;
        }
        .admin-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.10); }
        .admin-card:active { transform: scale(0.98); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-item { animation: fadeUp 0.35s ease both; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        {/* Header */}
        <div
          className="fade-item"
          style={{ marginBottom: 40, animationDelay: "0s" }}
        >
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
            Admin Master — Control total
          </p>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 900,
              color: "#0f172a",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            RentCheck HQ 🛡️
          </h1>
          {user?.name && (
            <p style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
              Bienvenido, <strong>{user.name}</strong>
            </p>
          )}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {CARDS.map((card, i) => (
            <button
              key={card.label}
              onClick={() => (card.path ? navigate(card.path) : handleSearch())}
              className="admin-card fade-item"
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: "22px 20px",
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  marginBottom: 14,
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.color + "15",
                }}
              >
                {card.icon}
              </div>

              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 4px",
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {card.description}
              </p>

              {/* Accent dot */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: card.color,
                  marginTop: 14,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
