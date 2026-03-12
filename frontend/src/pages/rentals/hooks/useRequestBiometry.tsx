import withReactContent from "sweetalert2-react-content";
import type { Rental } from "../../../models/rental.model";
import Swal from "sweetalert2";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import { biometryRequestService } from "../../../services/biometry-request.service";
import { catchError } from "../../../common/errors/catch-error";
const MySwal = withReactContent(Swal);

export const useRequestBiometry = () => {
  const userRole = JSON.parse(localStorage.getItem("user")!).role as RolesType;
  const canRequestBiometry =
    userRole === ROLES.EMPLOYEE ||
    userRole === ROLES.MANAGER ||
    userRole === ROLES.OWNER;

  const handleRequestBiometry = async (row: Rental, loadRentals: () => Promise<void> | void) => {
    const biometries = row.customer?.biometryRequests ?? [];
    const last = [...biometries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    const historyHtml =
      biometries.length > 0
        ? `
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />
          <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#6b7280; margin:0 0 8px;">
            Historial de biometrías
          </p>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
            ${biometries
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map(
                (b) => `
                <div style="display:flex; justify-content:space-between; align-items:center;
                  background:#f9fafb; border-radius:6px; padding:6px 10px; font-size:12px;">
                  <span style="color:#374151;">${new Date(b.createdAt).toLocaleDateString("es-CO")}</span>
                  <span style="font-weight:600; color:${b.result === "approved" ? "#16a34a" : b.result === "rejected" ? "#dc2626" : "#6b7280"};">
                    ${b.result === "approved" ? "✅ Aprobada" : b.result === "rejected" ? "❌ Rechazada" : `⏳ ${b.status}`}
                  </span>
                </div>
              `,
              )
              .join("")}
          </div>
        `
        : "";

    const { isConfirmed } = await MySwal.fire({
      title: "Verificación biométrica",
      html: `
          <div style="text-align:left; font-size:14px;">
            <p style="margin:0 0 12px; color:#374151;">
              Cliente: <strong>${row.customer.name} ${row.customer.lastName}</strong>
            </p>
    
            ${
              biometries.length === 0
                ? `
            <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; 
              padding:10px 14px; color:#dc2626; font-weight:600; font-size:13px; margin-bottom:12px;">
              🔴 Este cliente no tiene biometrías registradas. No entregues el vehículo hasta verificar.
            </div>
          `
                : last.status === "pending"
                  ? `
            <div style="background:#f3f4f6; border:1px solid #d1d5db; border-radius:8px; padding:10px 14px; margin-bottom:12px;">
              <p style="margin:0; font-size:13px; font-weight:600; color:#6b7280;">⏳ Biometría pendiente</p>
              <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">${new Date(last.createdAt).toLocaleDateString("es-CO")}</p>
              <hr style="border:none; border-top:1px solid #e5e7eb; margin:10px 0;" />
              <p style="font-size:11px; color:#6b7280; margin:0 0 6px;">Link de verificación:</p>
              <div style="background:white; border-radius:6px; padding:6px 10px; 
                font-family:monospace; font-size:11px; word-break:break-all; color:#374151; border:1px solid #e5e7eb;">
                ${window.location.origin}/verify/${last.token}
              </div>
              <button onclick="navigator.clipboard.writeText('${window.location.origin}/verify/${last.token}')"
                style="margin-top:8px; padding:5px 14px; background:#4f46e5; color:white;
                border:none; border-radius:6px; cursor:pointer; font-size:12px; width:100%;">
                📋 Copiar link
              </button>
            </div>
          `
                  : `
            <div style="background:${last.result === "approved" ? "#f0fdf4" : "#fef2f2"}; 
              border:1px solid ${last.result === "approved" ? "#bbf7d0" : "#fecaca"}; 
              border-radius:8px; padding:10px 14px; margin-bottom:12px;">
              <p style="margin:0; font-size:13px; font-weight:600; 
                color:${last.result === "approved" ? "#16a34a" : "#dc2626"};">
                ${last.result === "approved" ? "✅ Última biometría aprobada" : "❌ Última biometría rechazada"}
              </p>
              <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">
                ${new Date(last.createdAt).toLocaleDateString("es-CO")}
              </p>
            </div>
          `
            }
    
            ${historyHtml}
          </div>
        `,
      icon: undefined,
      showCancelButton: true,
      confirmButtonText:
        canRequestBiometry &&
        (biometries.length === 0 || last?.status !== "pending")
          ? "📲 Solicitar nueva biometría"
          : undefined,
      showConfirmButton:
        canRequestBiometry &&
        (biometries.length === 0 || last?.status !== "pending"),
      cancelButtonText: "Cerrar",
      confirmButtonColor: "#4f46e5",
      width: 480,
    });

    if (!isConfirmed) return;

    try {
      const biometry = await biometryRequestService.request(row.customerId);

      const verifyLink = `${window.location.origin}/verify/${biometry.token}`;

      MySwal.fire({
        title: "✅ Solicitud enviada",
        html: `
          <p style="color:#6b7280; margin-bottom:12px;">
            Comparte este link con el cliente para que complete su verificación:
          </p>
          <div style="background:#f3f4f6; border-radius:8px; padding:10px 14px; 
            font-family:monospace; font-size:12px; word-break:break-all; color:#374151;">
            ${verifyLink}
          </div>
          <button onclick="navigator.clipboard.writeText('${verifyLink}')"
            style="margin-top:12px; padding:6px 16px; background:#4f46e5; color:white;
            border:none; border-radius:6px; cursor:pointer; font-size:13px;">
            📋 Copiar link
          </button>
        `,
        icon: "success",
        showConfirmButton: false,
        showCloseButton: true,
      });

      loadRentals();
    } catch (error) {
      await catchError(error, MySwal, "Error al generar biometria")
    }
  };

  return {
    handleRequestBiometry,
  };
};
