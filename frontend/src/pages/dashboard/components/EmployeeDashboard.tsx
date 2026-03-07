import { useNavigate } from "react-router";
import { useState } from "react";
import Swal from "sweetalert2";
import { getUser } from "../helpers/user.helper";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../models/customer.model";
import { customerService } from "../../../services/customer.service";
import { statusBadge } from "../helpers/status-badge.helper";
import { scoreColor } from "../helpers/score-color.helper";
import RentalsByCustomerTable from "../../customers/components/RentalsByCustomerTable";

const MySwal = withReactContent(Swal);

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const user = getUser();

  const handleSearch = async () => {
    const { value: identityNumber, isConfirmed } = await Swal.fire({
      title: "🔍 Buscar Cliente",
      html: `<input id="swal-identity" class="swal2-input" placeholder="Número de cédula / NIT" />`,
      confirmButtonText: "Buscar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const val = (
          document.getElementById("swal-identity") as HTMLInputElement
        ).value.trim();
        if (!val) {
          MySwal.showValidationMessage("Ingresa un número de identificación");
          return false;
        }
        return val;
      },
    });

    if (!isConfirmed || !identityNumber) return;

    setSearching(true);
    try {
      const customer: Customer =
        await customerService.findByIdentity(identityNumber);

      if (
        customer &&
        customer.status !== "normal" &&
        customer.status !== "yellow_alert"
      ) {
        // Recopilar qué critical flags están activos
        const activeFlags = customer.rentals
          ?.flatMap((rental) => rental.rentalFeedback)
          ?.flatMap((fb) => Object.entries(fb?.criticalFlags ?? {}))
          .filter(([_, value]) => value === true)
          .map(([key]) => key);

        const flagLabels: Record<string, string> = {
          vehicleTheft: "🚗 Robo de vehículo",
          impersonation: "🪪 Suplantación de identidad",
          // agrega más si tienes
        };

        const flagsHtml = activeFlags?.length
          ? activeFlags.map((f) => `<li>${flagLabels[f] ?? f}</li>`).join("")
          : "<li>Sin flags específicos</li>";

        // Mostrar advertencia ANTES del swal de crear renta
        await Swal.fire({
          title: "⚠️ Cliente en alerta",
          html: `
            <p style="color:#6b7280; margin-bottom:12px;">
              Este cliente tiene estado <strong style="color:#dc2626">${customer.status}</strong>.
              Se han reportado los siguientes flags críticos:
            </p>
            <ul style="text-align:left; color:#dc2626; font-weight:600; list-style:none; padding:0; 
              background:#fee2e2; border-radius:8px; padding:12px 16px; margin:0;">
              ${flagsHtml}
            </ul>
          `,
          icon: "warning",
        });
      }

      const biometries = customer.biometryRequests ?? [];
      const lastBio = [...biometries].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      const biometryHistoryHtml =
        biometries.length > 0
          ? `
        <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
          ${biometries
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((b) => {
              const label =
                b.status === "pending"
                  ? "⏳ Pendiente"
                  : b.result === "approved"
                    ? "✅ Aprobada"
                    : b.result === "rejected"
                      ? "❌ Rechazada"
                      : "";

              const color =
                b.status === "pending"
                  ? "#92400e"
                  : b.result === "approved"
                    ? "#16a34a"
                    : b.result === "rejected"
                      ? "#dc2626"
                      : "#6b7280";

              return `
              <div style="display:flex; justify-content:space-between; align-items:center;
                background:#f9fafb; border-radius:6px; padding:6px 10px; font-size:12px;">
                <span style="color:#374151;">${new Date(b.createdAt).toLocaleDateString("es-CO")}</span>
                <span style="font-weight:700; color:${color};">${label || b.status}</span>
              </div>
            `;
            })
            .join("")}
        </div>
      `
          : "";

      const bioHtml =
        biometries.length === 0
          ? `<span style="color:#dc2626; font-weight:600;">🔴 Sin biometrías</span>`
          : lastBio.status === "pending"
            ? `<span style="color:#92400e; font-weight:600;">⏳ Pendiente</span>`
            : lastBio.result === "approved"
              ? `<span style="color:#16a34a; font-weight:600;">✅ Aprobada — ${new Date(lastBio.createdAt).toLocaleDateString("es-CO")}</span>`
              : `<span style="color:#dc2626; font-weight:600;">❌ Rechazada — ${new Date(lastBio.createdAt).toLocaleDateString("es-CO")}</span>`;

      const rentalsWithFeedback = (customer.rentals ?? [])
        .filter((r) => r.rentalFeedback) // Solo las que ya tienen el "tatequieto"
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );

      const rentalsHtml =
        rentalsWithFeedback.length === 0
          ? `<p style="color:#6b7280; font-size:12px; margin:0;">Sin historial calificado</p>`
          : rentalsWithFeedback
              .slice(0, 3)
              .map((r) => {
                // Calculamos un promedio rápido de esa renta específica
                const scores = Object.values(r.rentalFeedback!.score);
                const avg = scores.length
                  ? scores.reduce((acc: number, val: number) => acc + (5 - val), 0) /
                    scores.length
                  : 0;

                return `
          <div style="display:flex; justify-content:space-between; align-items:center;
            background:#f9fafb; border-radius:8px; padding:8px 12px; font-size:12px; margin-bottom:6px; border-left: 4px solid ${scoreColor(avg)};">
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#111827;">Nota: ${avg.toFixed(1)} / 5</span>
              <span style="color:#6b7280; font-size:11px;">${new Date(r.actualReturnDate || r.startDate).toLocaleDateString("es-CO")}</span>
            </div>
            <div style="text-align:right;">
              <span style="display:block; font-size:11px; color:#4f46e5; font-weight:600;">${r.renter?.name || "Rentadora"}</span>
              <span style="font-size:10px; color:#9ca3af; font-style:italic;">"${r.rentalFeedback!.comments?.substring(0, 20) || "Sin comentario"}..."</span>
            </div>
          </div>`;
              })
              .join("") +
            (rentalsWithFeedback.length > 3
              ? `<p style="font-size:11px; color:#4f46e5; margin:4px 0 0; text-align:center; font-weight:600; cursor:pointer;">+${rentalsWithFeedback.length - 3} calificaciones más...</p>`
              : "");

      MySwal.fire({
        title: "Resultado de búsqueda",
        html: `
          <div style="text-align:left; font-size:14px; line-height:1.8;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Nombre</span>
                <p style="margin:0; color:#111827; font-weight:600; font-size:15px;">${customer.name} ${customer.lastName}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Identificación</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.identityType ?? ""} ${customer.identityNumber}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Correo</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.email ?? "-"}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Score general</span>
                <p style="margin:0; font-weight:800; font-size:22px; color:${scoreColor(customer.generalScore)};">
                  ${customer.generalScore != null ? Number(customer.generalScore).toFixed(1) : "-"}
                  <span style="font-size:13px; color:#6b7280;">/ 5</span>
                </p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Estado</span>
                <p style="margin:4px 0 0;">${statusBadge(customer.status)}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Última biometría</span>
                <p style="margin:0;">${bioHtml}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Teléfono</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.phone ?? "-"}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Registrado por</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.registeredByUser?.name ?? "-"}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Creado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("es-CO") : "-"}</p>
              </div>
              <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Actualizado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString("es-CO") : "-"}</p>
              </div>
            </div>
            <div style="margin-top:4px;">
              <button id="btn-ver-historial" style="width:100%; padding:10px 12px; background:#4f46e5; color:white; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer;">
                📋 Ver historial de rentas
              </button>
            </div>
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />
            <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#6b7280; margin:0 0 8px;">
              Historial de biometrías
            </p>
            ${biometries.length === 0 ? `<p style="color:#6b7280; font-size:12px; margin:0;">Sin biometrías registradas</p>` : biometryHistoryHtml}
            <hr style="border:none; border-top:1px solid #e5e7eb; margin:10px 0;" />
            <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#4f46e5; margin:0 0 8px;">
              Últimas rentas
            </p>
            ${rentalsHtml}
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: 540,
        didOpen: () => {
          document
            .getElementById("btn-ver-historial")
            ?.addEventListener("click", () => {
              MySwal.close();
              MySwal.fire({
                title: `Historial — ${customer.name} ${customer.lastName}`,
                html: <RentalsByCustomerTable customerId={customer.id} />,
                showConfirmButton: false,
                showCloseButton: true,
                width: 780,
              });
            });
        },
      });
    } catch {
      MySwal.fire({
        title: "Cliente no encontrado",
        text: "Este cliente no tiene historial en RentCheck",
        icon: "info",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setSearching(false);
    }
  };

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
      id: "create",
      icon: "➕",
      label: "Nueva Renta",
      description: "Registra un cliente y crea una renta",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
      onClick: () => navigate("/employee/rentals"),
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
