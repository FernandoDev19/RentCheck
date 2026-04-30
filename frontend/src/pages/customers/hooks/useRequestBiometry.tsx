import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../shared/types/customer.type";
import { ROLES, type RolesType } from "../../../shared/types/role.type";
import { biometryRequestService } from "../../../services/biometry-request.service";
import { catchError } from "../../../shared/errors/catch-error";

const MySwal = withReactContent(Swal);

export const useRequestBiometry = () => {
  const userRole = JSON.parse(localStorage.getItem("user")!).role as RolesType;
  const canRequestBiometry =
    userRole === ROLES.EMPLOYEE ||
    userRole === ROLES.MANAGER ||
    userRole === ROLES.OWNER;

  const handleRequestBiometry = async (
    customer: Customer,
    loadCustomers: () => Promise<void> | void,
  ) => {
    const biometries = customer.biometryRequests ?? [];
    const last = [...biometries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    const { isConfirmed } = await MySwal.fire({
      title: "Verificación biométrica",
      html: (
        <div className="text-left text-xs">
          <p className="mb-3 text-[#374151]">
            Cliente:{" "}
            <strong>
              {customer.name} {customer.lastName}
            </strong>
          </p>

          {biometries.length === 0 ? (
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-2.5 text-[#dc2626] font-semibold text-sm mb-3">
              🔴 Este cliente no tiene biometrías registradas.
            </div>
          ) : last?.status === "pending" ? (
            <div className="bg-[#f3f4f6] border border-[#d1d5db] rounded-lg p-2.5 mb-3">
              <p className="text-sm font-semibold text-[#6b7280]">
                ⏳ Biometría pendiente
              </p>
              <p className="text-xs text-[#6b7280] mt-1">
                {new Date(last.createdAt).toLocaleDateString("es-CO")}
              </p>
              <hr className="border-none border-t-[#e5e7eb] my-2.5" />
              <p className="text-xs text-[#6b7280] mb-1.5">
                Link de verificación:
              </p>
              <div className="bg-white rounded-lg p-1.5 font-mono text-xs break-all text-[#374151] border border-[#e5e7eb]">
                {window.location.origin}/verify/{last.token}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/verify/${last.token}`,
                    );
                    MySwal.showValidationMessage("Link copiado ✅");
                    setTimeout(() => MySwal.resetValidationMessage(), 900);
                  } catch {
                    MySwal.showValidationMessage(
                      "No se pudo copiar el link. Cópialo manualmente.",
                    );
                  }
                }}
                className="m-2 py-1 px-3 bg-[#4f46e6] text-white rounded-lg cursor-pointer text-xs w-full"
              >
                📋 Copiar link
              </button>
            </div>
          ) : (
            <div
              className="rounded-lg p-2.5 mb-3"
              style={
                last?.result === "approved"
                  ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
                  : { background: "#fef2f2", border: "1px solid #fecaca" }
              }
            >
              <p
                className="text-sm font-semibold"
                style={{
                  color: last?.result === "approved" ? "#16a34a" : "#dc2626",
                }}
              >
                {last?.result === "approved"
                  ? "✅ Última biometría aprobada"
                  : "❌ Última biometría rechazada"}
              </p>
              <p className="text-xs text-[#6b7280] mt-1">
                {last?.createdAt
                  ? new Date(last.createdAt).toLocaleDateString("es-CO")
                  : ""}
              </p>
            </div>
          )}

          {biometries.length > 0 && (
            <>
              <hr />
              <p
                className="text-xs font-semibold uppercase "
                style={{ color: "#6b7280", margin: "0 0 8px" }}
              >
                Historial de biometrías
              </p>
              <div className="flex flex-col gap-[6px] max-h-40 overflow-y-auto">
                {biometries
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((b) => (
                    <div
                      key={b.id ?? b.createdAt}
                      className="flex justify-between items-center bg-[#f9fafb] rounded-lg p-1.5 text-xs"
                    >
                      <span className="text-[#374151]">
                        {new Date(b.createdAt).toLocaleDateString("es-CO")}
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          color:
                            b.result === "approved"
                              ? "#16a34a"
                              : b.result === "rejected"
                                ? "#dc2626"
                                : "#92400e",
                        }}
                      >
                        {b.result === "approved"
                          ? "✅ Aprobada"
                          : b.result === "rejected"
                            ? "❌ Rechazada"
                            : `⏳ ${b.status}`}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      ),
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
      const biometry = await biometryRequestService.request(customer.id);
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

      loadCustomers();
    } catch (error) {
      await catchError(error, MySwal);
    }
  };

  return {
    handleRequestBiometry,
  };
};
