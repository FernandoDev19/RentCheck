import ButtonCallUp from "../../../common/components/ui/ButtonCallUp";
import Paragraph from "../../../common/components/ui/Paragraph";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import type { Customer } from "../../../models/customer.model";
import { scoreColor as getScoreColor } from "../../dashboard/helpers/score-color.helper";

type Props = {
  row: Customer;
};

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  yellow_alert: "Alerta amarilla",
  red_alert: "Alerta roja",
};

export default function ViewCustomer({ row }: Props) {
  const scoreColor =
    row.generalScore >= 4
      ? "!text-green-500"
      : row.generalScore >= 2.5
        ? "!text-yellow-500"
        : "!text-red-500";

  const statusColor =
    row.status === "normal"
      ? "bg-green-100 text-green-800"
      : row.status === "yellow_alert"
        ? "bg-yellow-100 text-yellow-800"
        : row.status === "red_alert"
          ? "bg-red-100 text-red-800"
          : "bg-gray-800 text-white";

  const biometries = row.biometryRequests ?? [];
  const lastBiometry = [...biometries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const rentalsWithFeedback = (row.rentals ?? [])
    .filter((r) => r.rentalFeedback)
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

  return (
    <div className="text-left text-sm space-y-4" style={{ lineHeight: "1.8" }}>
      {/* <!-- Datos personales --> */}
      <p className="text-xs font-semibold uppercase text-primary mb-4">
        Datos personales
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
          marginBottom: "12px",
        }}
      >
        <div>
          <TitleSpan>Nombre Completo</TitleSpan>
          <Paragraph>
            {row.name} {row.lastName}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Tipo identidad</TitleSpan>
          <Paragraph>{row.identityType ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Número identidad</TitleSpan>
          <Paragraph>{row.identityNumber}</Paragraph>
        </div>
        <div>
          <TitleSpan>Teléfono</TitleSpan>
          <Paragraph>{row.phone ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Correo</TitleSpan>
          <Paragraph>{row.email ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Registrado por</TitleSpan>
          <Paragraph>{row.registeredByUser?.name ?? "-"}</Paragraph>
        </div>
      </div>

      <hr />

      {/* <!-- Score y estado --> */}
      <p className="text-xs font-semibold uppercase text-primary mb-4">
        Reputación
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
          marginBottom: "12px",
        }}
      >
        <div>
          <TitleSpan>Score general</TitleSpan>
          <Paragraph className={scoreColor}>
            {row.generalScore != null
              ? `${Number(row.generalScore).toFixed(1)} / 5`
              : "-"}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Estado</TitleSpan>
          <Paragraph>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {CUSTOMER_STATUS_LABELS[row.status] ?? row.status}
            </span>
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Última biometría</TitleSpan>
          <Paragraph>
            {biometries.length === 0 ? (
              <span style={{ color: "#dc2626", fontWeight: "600" }}>
                🔴 Sin biometrías
              </span>
            ) : lastBiometry.status === "pending" ? (
              <span style={{ color: "#92400e", fontWeight: "600" }}>
                ⏳ Pendiente —{" "}
                {new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}
              </span>
            ) : lastBiometry.result === "approved" ? (
              <span style={{ color: "#16a34a", fontWeight: "600" }}>
                ✅ Aprobada —{" "}
                {new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}
              </span>
            ) : (
              <span style={{ color: "#dc2626", fontWeight: "600" }}>
                ❌ Rechazada —{" "}
                {new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}
              </span>
            )}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Total biometrías</TitleSpan>
          <Paragraph>{biometries.length}</Paragraph>
        </div>
      </div>

      <hr />

      {/* <!-- Historial rentas --> */}

      <ButtonCallUp id="btn-ver-rentas" type="button" isLoading={false}>
        📋 Ver historial de rentas
      </ButtonCallUp>

      {rentalsWithFeedback.length === 0 ? (
        <Paragraph>Sin historial calificado</Paragraph>
      ) : (
        rentalsWithFeedback.slice(0, 3).map((r) => {
          const scores = Object.values(r.rentalFeedback!.score);
          const avg = scores.length
            ? scores.reduce((acc: number, val: number) => acc + (5 - val), 0) /
              scores.length
            : 0;

          return (
            <div className={`flex justify-between items-center bg-[#f9fafb] rounded-lg py-2 px-3 text-xs mb-2 border border-l-4 !border-[${getScoreColor(avg)}]`}>
              <div className="flex flex-col">
                <span className={`font-bold text-[${getScoreColor(avg)}]`}>
                  Nota: {avg.toFixed(1)} / 5
                </span>
                <span className="text-[#6b7280] text-xs">
                  {new Date(
                    r.actualReturnDate || r.startDate,
                  ).toLocaleDateString("es-CO")}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-[#4f46e5] font-semibold">
                  {r.renter?.name || "Rentadora"}
                </span>
                <span className="text-[10px] text-[#9ca3af] italic">
                  "
                  {r.rentalFeedback!.comments?.substring(0, 20) ||
                    "Sin comentario"}
                  ..."
                </span>
              </div>
              {rentalsWithFeedback.length > 3 && (
                <p className="text-[11px] text-[#4f46e5] margin-[4px 0 0] text-center font-semibold cursor-pointer">
                  +{rentalsWithFeedback.length - 3} calificaciones más...
                </p>
              )}
            </div>
          );
        })
      )}

      <hr />

      {/* <!-- Fechas --> */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
        }}
      >
        <div>
          <TitleSpan>Registrado</TitleSpan>
          <Paragraph>
            ${new Date(row.createdAt).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Actualizado</TitleSpan>
          <Paragraph>
            ${new Date(row.updatedAt).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
