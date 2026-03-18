import { useEffect, useState } from "react";
import ButtonCallUp from "../../../common/components/ui/ButtonCallUp";
import Paragraph from "../../../common/components/ui/Paragraph";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import type { Customer } from "../../../models/customer.model";
import { scoreColor as getScoreColor } from "../../dashboard/helpers/score-color.helper";
import { customerService } from "../../../services/customer.service";
import { catchError } from "../../../common/errors/catch-error";
import Swal from "sweetalert2";
import {
  CUSTOMER_STATUS,
  type CustomerStatus,
} from "../interfaces/customer-status.interface";
import { useViewRentalInfo } from "./rentals-by-customer-table/hooks/useViewRentalInfo";

type Props = {
  customerId?: string;
  customer?: Customer;
};

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  yellow_alert: "Alerta amarilla",
  red_alert: "Alerta roja",
};

export default function ViewCustomer({ customerId, customer: initialCustomer }: Props) {
  const [customer, setCustomer] = useState<Customer | undefined>(initialCustomer);
  const { handleViewRentalInfo } = useViewRentalInfo();

  useEffect(() => {
    // Si ya tenemos el customer o no hay customerId, no hacemos nada
    if (customer || !customerId) return;

    const fetchCustomer = async () => {
      try {
        const response = await customerService.findOne(customerId);
        setCustomer(response);
      } catch (error) {
        await catchError(error, Swal, "Error al obtener cliente");
      }
    };
    fetchCustomer();
  }, [customerId, customer]);

  const scoreColor =
    (customer?.generalScore as number) >= 4
      ? "!text-green-500"
      : (customer?.generalScore as number) >= 2.5
        ? "!text-yellow-500"
        : "!text-red-500";

  const statusColor =
    customer?.status === CUSTOMER_STATUS.NORMAL
      ? "bg-green-100 text-green-800"
      : customer?.status === CUSTOMER_STATUS.YELLOW_ALERT
        ? "bg-yellow-100 text-yellow-800"
        : customer?.status === CUSTOMER_STATUS.RED_ALERT
          ? "bg-red-100 text-red-800"
          : "bg-gray-800 text-white";

  const biometries = customer?.biometryRequests ?? [];
  const lastBiometry = [...biometries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const rentalsWithFeedback = (customer?.rentals ?? [])
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
            {customer?.name} {customer?.lastName}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Tipo identidad</TitleSpan>
          <Paragraph>{customer?.identityType ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Número identidad</TitleSpan>
          <Paragraph>{customer?.identityNumber}</Paragraph>
        </div>
        <div>
          <TitleSpan>Teléfono</TitleSpan>
          <Paragraph>{customer?.phone ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Correo</TitleSpan>
          <Paragraph>{customer?.email ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Registrado por</TitleSpan>
          <Paragraph>{customer?.registeredByUser?.name ?? "-"}</Paragraph>
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
            {customer?.generalScore != null
              ? `${Number(customer?.generalScore).toFixed(1)} / 5`
              : "-"}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Estado</TitleSpan>
          <Paragraph>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}
            >
              {CUSTOMER_STATUS_LABELS[customer?.status as CustomerStatus] ??
                customer?.status}
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
      <p className="text-xs font-semibold uppercase text-primary mb-4">
        Historial de rentas
      </p>

      {rentalsWithFeedback.length === 0 ? (
        <Paragraph>Sin historial calificado</Paragraph>
      ) : (
        rentalsWithFeedback.slice(0, 5).map((r) => {
          const scores = Object.values(r.rentalFeedback!.score);
          const avg = scores.length
            ? scores.reduce((acc: number, val: number) => acc + val, 0) /
              scores.length
            : 0;

          // 1. Extraemos las flags críticas
          const flags = r.rentalFeedback!.criticalFlags;
          const activeFlags = [];
          if (flags?.vehicleTheft) activeFlags.push("🚗 ROBO");
          if (flags?.impersonation) activeFlags.push("🪪 SUPLANTACIÓN");

          return (
            <div
              key={r.id}
              onClick={() => handleViewRentalInfo(r.id)}
              className={`flex justify-between items-center hover:bg-neutral-100 cursor-pointer bg-[#f9fafb] rounded-lg py-2 px-3 text-xs mb-2 border border-l-4`}
              style={{ borderLeftColor: activeFlags.length > 0 ? '#dc2626' : getScoreColor(avg) }} // Usamos style para asegurar que el color pegue
            >
              <div className="flex flex-col">
                <span
                  className="font-bold"
                  style={{ color: activeFlags.length > 0 ? '#dc2626' : getScoreColor(avg) }}
                >
                  {activeFlags.length > 0
                    ? activeFlags.join(" | ") : `Nota: ${avg.toFixed(1)} / 5`}
                </span>
                <span className="text-[#6b7280] text-[10px]">
                  {new Date(
                    r.actualReturnDate || r.startDate,
                  ).toLocaleDateString("es-CO")}
                </span>
              </div>

              <div className="text-right flex-1 ml-4">
                <span className="block text-[11px] text-[#4f46e5] font-semibold">
                  {r.renter?.name || "Rentadora"}
                </span>

                {/* 2. LÓGICA DE NOTA O FLAG */}
                <span
                  className={`text-[10px] font-medium ${activeFlags.length > 0 ? "text-red-600 uppercase font-bold" : "text-[#9ca3af] italic"}`}
                >
                  {r.rentalFeedback!.comments?.substring(0, 20) || "Sin comentario"}
                </span>
              </div>
            </div>
          );
        })
      )}
      {rentalsWithFeedback.length > 5 && (
        <p className="text-[11px] text-[#4f46e5] mt-2 text-center font-semibold cursor-pointer">
          +{rentalsWithFeedback.length - 5} calificaciones más...
        </p>
      )}

      <ButtonCallUp id="btn-ver-rentas" type="button" isLoading={false}>
        📋 Ver historial de rentas
      </ButtonCallUp>

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
            {new Date(customer?.createdAt as Date).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Actualizado</TitleSpan>
          <Paragraph>
            {new Date(customer?.updatedAt as Date).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
