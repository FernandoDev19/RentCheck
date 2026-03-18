import ButtonActionDataTable from "../../../common/components/ui/ButtonActionDataTable";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import type { Rental } from "../../../models/rental.model";
import { useCustomer } from "../../customers/hooks/useCustomer";
import {
  RENTAL_STATUS_COLORS,
  RENTAL_STATUS_LABELS,
} from "../hooks/useRentals";

type Props = {
  row: Rental;
};

export default function ViewRental({ row }: Props) {
  const statusLabel =
    RENTAL_STATUS_LABELS[row.rentalStatus] || row.rentalStatus;
  const statusColor = RENTAL_STATUS_COLORS[row.rentalStatus] || {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  const { handleViewInfo } = useCustomer();

  return (
    <div className="text-left text-sm text-[#374151]">
      <div className="flex justify-between items-center mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor.bg} ${statusColor.text}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-[#6b7280]">
          Creado: {new Date(row.createdAt).toLocaleString("es-CO")}
        </span>
      </div>
      <div className="bg-[#f9fafb] rounded-lg p-3 border border-[#e5e7eb] mb-3">
        <div className="flex justify-between gap-4">
          <TitleSpan className="mb-4">Información del Cliente</TitleSpan>
          <ButtonActionDataTable color="indigo" onClick={() => handleViewInfo(row.customer)}>Ver info</ButtonActionDataTable>
        </div>
        <p className="m-0">
          <strong>
            {row.customer?.name} {row.customer?.lastName}
          </strong>
        </p>
        <p className="m-0 text-xs">
          ID: {row.customer?.identityNumber}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
        <div style={{ background: "#f0f9ff", borderRadius: "8px", padding: "10px", border: "1px solid #bae6fd" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#0369a1", textTransform: "uppercase" }}>
            Entrega (Inicio)
          </p>
          <p style={{ margin: "0", fontSize: "13px" }}>
            <strong>Responsable:</strong>
            {row.employee
              ? row.employee?.name
              : row.branch
                ? row.branch.name
                : row.renter?.name || "Sistema"}
          </p>
          <p style={{ margin: "0", fontSize: "12px", color: "#6b7280" }}>
            Fecha: {new Date(row.startDate).toLocaleDateString("es-CO")}
          </p>
        </div>

        <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "10px", border: "1px solid #bbf7d0" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#15803d", textTransform: "uppercase" }}>
            Devolución (Fin)
          </p>
          <p style={{ margin: "0", fontSize: "13px" }}>
            <strong>Recibido por:</strong>
            {row.receivedByUser?.email ||
              (row.actualReturnDate ? "Manual" : "-")}
          </p>
          <p style={{ margin: "0", fontSize: "12px", color: "#6b7280" }}>
            Fecha:
            {row.actualReturnDate
              ? new Date(row.actualReturnDate).toLocaleDateString("es-CO")
              : "Pendiente"}
          </p>
        </div>
      </div>
      {row.rentalStatus === "cancelled"
        && (
                  <div style={{ background: "#fff1f2", borderRadius: "8px", padding: "12px", border: "1px solid #fecaca", marginBottom: "12px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#be123c", textTransform: "uppercase" }}>❌ Cancelación</p>
                    <p style={{ margin: "0", fontSize: "13px" }}><strong>Cancelado por:</strong> {row.cancelledByUser?.email || "N/A"}</p>
                  </div>
        )}
      <div style={{ fontSize: "12px", color: "#6b7280", padding: "0 4px" }}>
        <p style={{ margin: "4px 0" }}>
          <strong>Sede:</strong> {row.branch?.name || "-"}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Retorno esperado:</strong>
          {new Date(row.expectedReturnDate).toLocaleDateString("es-CO")}
        </p>
      </div>
    </div>
  );
}
