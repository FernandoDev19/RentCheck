import { useNavigate } from "react-router";
import { getUser } from "../helpers/user.helper";
import { useSearch } from "../hooks/useSearch";
import { useCreateRental } from "../../rentals/hooks/useCreateRental";
import { useVehicleAvailability } from "../../vehicles/hooks/useVehicleAvailability";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const { handleSearch, searching } = useSearch();
  const { handleCreateClick } = useCreateRental();
  const { openAvailabilityModal } = useVehicleAvailability();

  const actions = [
    {
      id: "search",
      icon: "🔍",
      label: "Buscar Cliente",
      description: "Consulta historial, score y alertas",
      gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      onClick: handleSearch,
    },
        {
      icon: "🚗",
      label: "Ver disponibilidad",
      description: "Consulta qué vehículos estarán disponibles por fecha",
      color: "from-sky-600 to-sky-800",
      gradient: "linear-gradient(135deg, #00ff9f 0%, rgb(62, 164, 53) 100%)",
      border: "border-sky-500",
      onClick: () => openAvailabilityModal(),
    },
    {
      id: "create",
      icon: "➕",
      label: "Nueva Renta",
      description: "Registra un cliente y crea una renta",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
      onClick: () => handleCreateClick(() => {}),
    },
    {
      id: "pending",
      icon: "✍️",
      label: "Pendientes por Calificar",
      description: "Rentas devueltas sin feedback",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      onClick: () => navigate("/employee/feedbacks"),
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
        .action-btn {
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease;
          cursor: pointer;
          border: none;
          width: 100%;
          text-align: left;
        }
        .action-btn:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 24px 48px rgba(0,0,0,0.18);
        }
        .action-btn:active { transform: scale(0.98); }
        .action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu0 { animation: fadeUp 0.4s ease 0.05s both; }
        .fu1 { animation: fadeUp 0.4s ease 0.15s both; }
        .fu2 { animation: fadeUp 0.4s ease 0.25s both; }
        .fu3 { animation: fadeUp 0.4s ease 0.35s both; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        {/* Header */}
        <div className="fu0" style={{ marginBottom: 40 }}>
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
            Panel de operaciones
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
            Hola, {user.name ?? "Empleado"} 👋
          </h1>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
            ¿Qué vas a hacer hoy?
          </p>
        </div>

        {/* 3 Big Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {actions.map((action, i) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={searching}
              className={`action-btn fu${i + 1}`}
              style={{
                background: action.gradient,
                borderRadius: 20,
                padding: "24px 28px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    fontSize: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.15)",
                    flexShrink: 0,
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 800,
                      margin: 0,
                    }}
                  >
                    {action.label}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 13,
                      margin: "3px 0 0",
                    }}
                  >
                    {action.description}
                  </p>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
