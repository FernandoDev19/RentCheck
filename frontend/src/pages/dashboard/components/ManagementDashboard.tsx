import { useNavigate } from "react-router";
import { getUser } from "../helpers/user.helper";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import { useSearch } from "../hooks/useSearch";

export default function ManagementDashboard({ role }: { role: RolesType }) {
  const navigate = useNavigate();
  const { handleSearch } = useSearch();
  const user = getUser();
  const isOwner = role === ROLES.OWNER;

  const cards = [
    {
      id: "search",
      icon: "🔍",
      label: "Buscar Cliente",
      description: "Consulta historial, score y alertas",
      gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      onClick: handleSearch,
    },
    ...(isOwner
      ? [
          {
            icon: "🏢",
            label: "Sedes",
            description: "Gestiona tus sedes",
            onClick: () => navigate("/owner/branches"),
            bg: "#fff",
            border: "#e2e8f0",
          },
        ]
      : []),
    {
      icon: "👥",
      label: "Clientes",
      description: "Historial unificado",
      onClick: () => navigate(`/${role === ROLES.OWNER ? "owner" : "manager"}/customers`),
      bg: "#fff",
      border: "#e2e8f0",
    },
    {
      icon: "🚗",
      label: "Rentas",
      description: "Todas las rentas",
      onClick: () => navigate(`/${role === ROLES.OWNER ? "owner" : "manager"}/rentals`),
      bg: "#fff",
      border: "#e2e8f0",
    },
    {
      icon: "✍️",
      label: "Pendientes",
      description: "Sin calificar",
      onClick: () => navigate(`/${role === ROLES.OWNER ? "owner" : "manager"}/feedbacks`),
      bg: "#fffbeb",
      border: "#fde68a",
    },
    ...(isOwner
      ? [
          {
            icon: "👤",
            label: "Empleados",
            description: "Usuarios y accesos",
            onClick: () => navigate("/owner/employees"),
            bg: "#fff",
            border: "#e2e8f0",
          },
        ]
      : []),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        .mgmt-card {
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          cursor: pointer; border: none; text-align: left;
        }
        .mgmt-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="py-10 md:py-20 md:px-16" style={{ maxWidth: 680, margin: "0 auto"}}>
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
            {isOwner ? "Panel del propietario" : "Panel del manager"}
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
            Bienvenido, {user.name ?? role} 👋
          </h1>
          <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>
            Visión general de tu operación
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}
        >
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={card.onClick}
              className="mgmt-card fade-up"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
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
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "4px 0 0" }}>
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
