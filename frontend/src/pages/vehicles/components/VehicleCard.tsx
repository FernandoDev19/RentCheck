import type { Vehicle } from "../../../models/Vehicle.model";
import { STATUS_CONFIG } from "../constants/status-config";

export default function VehicleCard({
  vehicle,
  startDate,
  endDate,
  onCreateRental,
  onViewDetail,
}: {
  vehicle: Vehicle;
  startDate: string;
  endDate: string;
  onCreateRental: (vehicle: Vehicle) => void;
  onViewDetail: (vehicle: Vehicle) => void;
}) {
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const totalPrice = vehicle.rentalPriceByDay
    ? Number(vehicle.rentalPriceByDay) * days
    : null;

  const statusCfg = STATUS_CONFIG[vehicle.status] ?? {
    label: vehicle.status,
    bg: "bg-slate-100",
    text: "text-slate-500",
    icon: "❓",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Photo or placeholder */}
      <div className="relative h-32 bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
        {vehicle.photos?.[0] ? (
          <img
            src={vehicle.photos[0]}
            alt={vehicle.plate}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl opacity-30">🚗</span>
        )}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
        >
          {statusCfg.icon} {statusCfg.label}
        </span>
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">
              {vehicle.plate}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400">año</p>
            <p className="text-sm font-bold text-slate-700">{vehicle.year}</p>
          </div>
        </div>

        <div className="flex gap-3 text-xs text-slate-500 mb-3">
          <span>🎨 {vehicle.color}</span>
          {(vehicle as Vehicle).transmission && (
            <span>⚙️ {(vehicle as Vehicle).transmission}</span>
          )}
        </div>

        {/* Precio */}
        {totalPrice && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                Total estimado
              </span>
              <span className="text-sm font-black text-emerald-700">
                ${totalPrice.toLocaleString("es-CO")}
                <span className="text-[10px] font-normal text-emerald-400 ml-0.5">COP</span>
              </span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-0.5">
              ${Number(vehicle.rentalPriceByDay).toLocaleString("es-CO")} / día × {days} días
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onViewDetail(vehicle)}
            className="flex-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600
              rounded-lg hover:bg-slate-50 transition"
          >
            Ver detalle
          </button>
          <button
            onClick={() => onCreateRental(vehicle)}
            className="flex-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white
              rounded-lg hover:bg-indigo-700 transition"
          >
            Crear renta
          </button>
        </div>
      </div>
    </div>
  );
}