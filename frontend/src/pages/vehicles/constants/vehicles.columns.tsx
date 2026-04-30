import type { Column } from "../../../shared/components/datatable/types/column.type";
import type { Branch } from "../../../shared/types/branch.type";
import type { Vehicle } from "../../../shared/types/vehicle.type";
import { StatusBadge } from "../helpers/vehicle-status-badge.helper";

export const columns: Column<Vehicle>[] = [
    {
      key: "plate",
      label: "Placa",
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-slate-800 tracking-wide">
          {String(val)}
        </span>
      ),
    },
    {
      key: "brand",
      label: "Vehículo",
      render: (_val, row) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            {row.brand} {row.model}
          </p>
          <p className="text-xs text-slate-400">
            {row.year} · {row.color}
          </p>
          <p className="text-xs text-slate-400">
            {row.gamma || ""} { row.transmission }
          </p>
        </div>
      ),
    },
    {
      key: 'branch',
      label: "Sede",
      render: (val) => {
        const branch = val as Branch;
        return branch.name || "-";
      }
    },
    {
      key: "rentalPriceByDay",
      label: "Precio renta x Día",
      render: (val) =>
        val ? (
          `$${Number(val).toLocaleString("es-CO")}`
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    // {
    //   key: "photos",
    //   label: "Fotos",
    //   sortable: false,
    //   render: (val) => {
    //     const photos = val as string[];
    //     if (!photos?.length)
    //       return <span className="text-slate-300 text-xs">Sin fotos</span>;
    //     return (
    //       <div className="flex gap-1">
    //         {photos.slice(0, 3).map((url, i) => (
    //           <img
    //             key={i}
    //             src={url}
    //             alt="foto"
    //             className="w-8 h-8 rounded object-cover border border-slate-200 cursor-pointer hover:scale-150 transition-transform"
    //             onClick={() => window.open(url, "_blank")}
    //           />
    //         ))}
    //         {photos.length > 3 && (
    //           <span className="text-xs text-slate-400 self-center">
    //             +{photos.length - 3}
    //           </span>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      render: (val) => <StatusBadge status={String(val)} />,
    },
  ];