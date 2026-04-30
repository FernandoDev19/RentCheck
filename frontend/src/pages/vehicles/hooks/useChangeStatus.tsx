import withReactContent from "sweetalert2-react-content";
import type { Vehicle } from "../../../shared/types/vehicle.type";
import { STATUS_CONFIG } from "../constants/status-config";
import { vehicleService } from "../../../services/vehicle.service";
import { catchError } from "../../../shared/errors/catch-error";
import Swal from "sweetalert2";

const MySwal = withReactContent(Swal);

export const useChangeStatus = () => {
      const handleChangeStatus = async (loadVehicles: () => Promise<void> | void, row: Vehicle) => {
        const statuses = ["available", "stolen", "maintenance"] as const;
        const options = statuses
          .filter((s) => s !== row.status)
          .map(
            (s) =>
              `<option value="${s}">${STATUS_CONFIG[s].icon} ${STATUS_CONFIG[s].label}</option>`,
          )
          .join("");
    
        const { isConfirmed, value } = await MySwal.fire({
          title: `🔄 Cambiar estado — ${row.plate}`,
          html: `
            <div style="text-align:left;">
              <p style="color:#6b7280;font-size:13px;margin-bottom:12px;">
                Estado actual: <strong>${STATUS_CONFIG[row.status]?.label ?? row.status}</strong>
              </p>
              <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#6b7280;margin:0 0 6px;">Nuevo estado</p>
              <select id="v-status" class="swal2-select" style="margin:0;width:100%;">
                ${options}
              </select>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "Cambiar estado",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#0f172a",
          preConfirm: () =>
            (document.getElementById("v-status") as HTMLSelectElement).value,
        });
    
        if (!isConfirmed || !value) return;
        try {
          await vehicleService.update(row.id, { status: value });
          MySwal.fire({
            title: "✅ Estado actualizado",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
          loadVehicles();
        } catch (error) {
          await catchError(error, MySwal, "Error al cambiar estado");
        }
      };

      return {
        handleChangeStatus
      }
    
    }