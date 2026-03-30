import Swal from "sweetalert2";
import type { Vehicle } from "../../../models/Vehicle.model";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export const useViewDetails = () => {
  const handleViewDetail = (vehicle: Vehicle) => {
    MySwal.fire({
      title: `${vehicle.brand} ${vehicle.model}`,
      html: `
            <div style="text-align:left;font-size:13px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-bottom:12px;">
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Placa</p>
                  <p style="margin:0;font-family:monospace;font-weight:700;color:#1e293b;">${vehicle.plate}</p>
                </div>
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Año</p>
                  <p style="margin:0;font-weight:600;color:#1e293b;">${vehicle.year}</p>
                </div>
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Color</p>
                  <p style="margin:0;color:#374151;">${vehicle.color}</p>
                </div>
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Transmisión</p>
                  <p style="margin:0;color:#374151;">${(vehicle as Vehicle).transmission ?? "—"}</p>
                </div>
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Precio / día</p>
                  <p style="margin:0;font-weight:700;color:#059669;">$${Number(vehicle.rentalPriceByDay).toLocaleString("es-CO")} COP</p>
                </div>
                <div>
                  <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 2px;">Valor asegurado</p>
                  <p style="margin:0;color:#374151;">${vehicle.insuredValue ? `$${Number(vehicle.insuredValue).toLocaleString("es-CO")}` : "—"}</p>
                </div>
              </div>
              ${
                vehicle.photos?.length
                  ? `
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin:0 0 8px;">Fotos</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${vehicle.photos
                    .map(
                      (url) => `
                    <img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />
                  `,
                    )
                    .join("")}
                </div>
              `
                  : ""
              }
            </div>
          `,
      showConfirmButton: false,
      showCloseButton: true,
      width: 420,
    });
  };

  return {
    handleViewDetail,
  };
};
