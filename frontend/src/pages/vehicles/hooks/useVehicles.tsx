import { useCallback, useEffect, useState } from "react";
import type { Vehicle } from "../../../models/Vehicle.model";
import { vehicleService } from "../../../services/vehicle.service";
import type { ListResponse } from "../../../common/interfaces/list-response.interface";
import { catchError } from "../../../common/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { VEHICLE_STATUS } from "../../../common/types/vehicle-status.type";

const MySwal = withReactContent(Swal);

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState({
    key: "createdAt",
    direction: "desc" as "asc" | "desc",
  });
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const limit = 10;

  // ── Load ──
  const loadVehicles = useCallback(async () => {
    const response: ListResponse<Vehicle> = await vehicleService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setVehicles(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadVehicles();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar vehículos");
      }
    };
    run();
  }, [loadVehicles]);

  // ── History ──
  //   const handleHistory = async (row: Vehicle) => {
  //     try {
  //       const response = await rentalService.getAllByVehicle(row.id, { page: 1, limit: 10 });
  //       const rentals = response.data;

  //       const rentalsHtml = rentals.length === 0
  //         ? `<p style="color:#6b7280;text-align:center;padding:16px;">Sin rentas registradas</p>`
  //         : rentals.map(r => `
  //           <div style="display:flex;justify-content:space-between;align-items:center;
  //             padding:8px 12px;background:#f9fafb;border-radius:8px;margin-bottom:6px;font-size:12px;">
  //             <div>
  //               <p style="margin:0;font-weight:600;color:#111827;">${r.customer?.name ?? "-"} ${r.customer?.lastName ?? ""}</p>
  //               <p style="margin:0;color:#6b7280;">${new Date(r.startDate).toLocaleDateString("es-CO")} → ${r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString("es-CO") : "En curso"}</p>
  //             </div>
  //             <span style="padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;
  //               background:${STATUS_CONFIG[r.rentalStatus]?.bg.replace("bg-", "").replace("-100", "")};
  //               color:#374151;">
  //               ${STATUS_CONFIG[r.rentalStatus]?.icon ?? ""} ${STATUS_CONFIG[r.rentalStatus]?.label ?? r.rentalStatus}
  //             </span>
  //           </div>
  //         `).join("");

  //       MySwal.fire({
  //         title: `📋 Historial — ${row.plate}`,
  //         html: `
  //           <div style="text-align:left;">
  //             <p style="color:#6b7280;font-size:12px;margin-bottom:12px;">
  //               ${row.brand} ${row.model} ${row.year} · ${row.color}
  //             </p>
  //             <div style="max-height:280px;overflow-y:auto;">${rentalsHtml}</div>
  //           </div>
  //         `,
  //         showConfirmButton: false,
  //         showCloseButton: true,
  //         width: 520,
  //       });
  //     } catch (error) {
  //       await catchError(error, MySwal, "Error al cargar historial");
  //     }
  //   };

  const handleDelete = async (row: Vehicle) => {
      console.log("Aun no se valida si esta en renta")
    
    if (row.status === VEHICLE_STATUS.RENTED) {
      console.log("Esta en renta")
      await MySwal.fire({
        title: "No permitido",
        text: "No puedes eliminar un vehículo que está en renta",
        icon: "warning",
      });
      return;
    }

    const { isConfirmed } = await MySwal.fire({
      title: `¿Eliminar ${row.plate}?`,
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;
    try {
      await vehicleService.remove(row.id);
      MySwal.fire({
        title: "Eliminado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadVehicles();
    } catch (error) {
      await catchError(error, MySwal, "Error al eliminar vehículo");
    }
  };

  return {
    vehicles,
    totalItems,
    totalPages,
    page,
    setPage,
    setSearchTerm,
    setOrderBy,
    viewMode,
    setViewMode,
    handleDelete, 
    loadVehicles,
    limit
  }
};
