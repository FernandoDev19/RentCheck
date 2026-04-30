import ButtonActionDataTable from "../../../shared/components/ui/ButtonActionDataTable";
import type { Rental } from "../../../shared/types/rental.type";
import type { User } from "../../../shared/types/user.type";
import type { Vehicle } from "../../../shared/types/vehicle.type";
import { useCustomer } from "../../customers/hooks/useCustomer";
import {
  RENTAL_STATUS_COLORS,
  RENTAL_STATUS_LABELS,
} from "../hooks/useRentals";

type Props = {
  row: Rental;
};

const Field = ({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
      {label}
    </p>
    <p
      className={`text-sm font-medium leading-snug ${accent ? "text-emerald-600 font-bold text-base" : "text-slate-700"}`}
    >
      {value}
    </p>
  </div>
);

const Divider = () => <hr className="border-slate-100 my-4" />;

export default function ViewRental({ row }: Props) {
  const statusLabel = RENTAL_STATUS_LABELS[row.rentalStatus] || row.rentalStatus;
  const statusColor = RENTAL_STATUS_COLORS[row.rentalStatus] || {
    bg: "bg-gray-100",
    text: "text-gray-500",
  };
  const { handleViewInfo } = useCustomer();

  const calculateDays = () => {
    if (!row.startDate || !row.expectedReturnDate) return 1;
    const diff =
      new Date(row.expectedReturnDate).getTime() -
      new Date(row.startDate).getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 0 ? 1 : days;
  };

  const days = calculateDays();
  const isLate = row.rentalStatus === "late";
  const isCancelled = row.rentalStatus === "cancelled";
  const isReturned = row.rentalStatus === "returned";
  const isPending = row.rentalStatus === "pending";

  const daysOverdue = (() => {
    if (!isLate || !row.expectedReturnDate) return 0;
    const diff = new Date().getTime() - new Date(row.expectedReturnDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="text-left text-sm text-slate-700 min-w-[320px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor.bg} ${statusColor.text}`}>
            {statusLabel}
          </span>
          {isLate && daysOverdue > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600">
              {daysOverdue}d de retraso
            </span>
          )}
          {isPending && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
              Inicia {new Date(row.startDate).toLocaleDateString("es-CO")}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0">
          {new Date(row.createdAt).toLocaleDateString("es-CO", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
            {row.customer?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm leading-tight">
              {row.customer?.name} {row.customer?.lastName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {row.customer?.identityNumber ?? "—"}
            </p>
          </div>
        </div>
        <ButtonActionDataTable
          color="indigo"
          onClick={() => handleViewInfo(row.customer)}
        >
          Ver info
        </ButtonActionDataTable>
      </div>

      {/* Timeline fechas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Inicio</p>
          <p className="text-sm font-bold text-blue-700">
            {new Date(row.startDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Duración</p>
          <p className="text-sm font-bold text-slate-700">{days}d</p>
        </div>
        <div className={`border rounded-xl p-3 text-center ${
          isLate ? "bg-red-50 border-red-200"
          : isReturned ? "bg-emerald-50 border-emerald-200"
          : "bg-green-50 border-green-100"
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
            isLate ? "text-red-400" : isReturned ? "text-emerald-500" : "text-green-500"
          }`}>
            {isReturned ? "Devuelto" : "Devolución"}
          </p>
          <p className={`text-sm font-bold ${
            isLate ? "text-red-700" : isReturned ? "text-emerald-700" : "text-green-700"
          }`}>
            {isReturned && row.actualReturnDate
              ? new Date(row.actualReturnDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
              : new Date(row.expectedReturnDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
          </p>
        </div>
      </div>

      {/* Precio total */}
      {row.vehicle?.rentalPriceByDay && (
        <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">
                Valor total estimado
              </p>
              <p className="text-xl font-black text-emerald-700">
                ${(Number(row.vehicle.rentalPriceByDay) * days).toLocaleString("es-CO")}
                <span className="text-xs font-normal text-emerald-500 ml-1">COP</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-emerald-500 font-medium">
                ${Number(row.vehicle.rentalPriceByDay).toLocaleString("es-CO")} / día
              </p>
              <p className="text-[10px] text-emerald-400">{days} días</p>
            </div>
          </div>
        </div>
      )}

      <Divider />

      {/* Vehículo */}
      {row.vehicle ? (
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vehículo</p>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-2xl">🚗</span>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                {row.vehicle.brand} {row.vehicle.model}
              </p>
              <p className="text-xs text-slate-500 font-mono tracking-wide">
                {row.vehicle.plate}
              </p>
              <p className="text-xs text-slate-400">
                {row.vehicle.year} · {row.vehicle.color}
                {(row.vehicle as Vehicle).transmission ? ` · ${(row.vehicle as Vehicle).transmission}` : ""}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-600 font-semibold">⚠️ Sin vehículo asignado</p>
        </div>
      )}

      <Divider />

      {/* Info operacional */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
        <Field
          label="Sede"
          value={row.branch?.name || row.renter?.name || "—"}
        />
        <Field
          label="Responsable entrega"
          value={row.employee?.name || row.branch?.name || row.renter?.name || "Sistema"}
        />
        {isReturned && (
          <Field
            label="Recibido por"
            value={(row.receivedByUser as User)?.name || row.receivedByUser?.email || "Manual"}
          />
        )}
        {isCancelled && (
          <Field
            label="Cancelado por"
            value={(row.cancelledByUser as User)?.name || row.cancelledByUser?.email || "N/A"}
          />
        )}
      </div>

      {/* Alerta tardío */}
      {isLate && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-bold text-red-600 mb-1">🚨 Renta atrasada</p>
          <p className="text-xs text-red-500">
            Debió devolverse el{" "}
            <strong>{new Date(row.expectedReturnDate).toLocaleDateString("es-CO")}</strong>
            {daysOverdue > 0 && ` — hace ${daysOverdue} día${daysOverdue !== 1 ? "s" : ""}`}
          </p>
        </div>
      )}

      {/* Cancelación */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs font-bold text-red-600 mb-1">❌ Renta cancelada</p>
          <p className="text-xs text-red-500">
            Por:{" "}
            {(row.cancelledByUser as User)?.name ||
              row.cancelledByUser?.email ||
              "N/A"}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
        <span>
          ID: <span className="font-mono">{row.id?.slice(0, 8)}...</span>
        </span>
        <span>
          Actualizado:{" "}
          {row.updatedAt
            ? new Date(row.updatedAt).toLocaleDateString("es-CO")
            : "—"}
        </span>
      </div>
    </div>
  );
}