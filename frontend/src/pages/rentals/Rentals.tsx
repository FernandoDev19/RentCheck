import { useCallback, useEffect, useState } from "react";
import type { Column } from "../../common/components/DataTable";
import type { Rental } from "../../models/rental.model";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import { rentalService } from "../../services/rental.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import DataTable from "../../common/components/DataTable";
import z from "zod";
import axios from "axios";
import { IDENTITY_TYPE } from "../../common/types/identity-type.type";
import { customerService } from "../../services/customer.service";
import { ROLES, type RolesType } from "../../common/types/roles.type";
import type { Customer } from "../../models/customer.model";
import { biometryRequestService } from "../../services/biometry-request.service";
import {
  rentalFeedbackService,
  SCORE_FIELDS,
  type CreateFeedbackScore,
} from "../../services/rental-feedback.service";
import FeedbackForm from "../pending-feedbacks/components/FeedbackForm";
import PageHeader from "../../common/components/PageHeader";

const MySwal = withReactContent(Swal);

const RENTAL_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  returned: "Devuelto",
  late: "Tardío",
  cancelled: "Cancelado",
};

const RENTAL_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  returned: { bg: "bg-blue-100", text: "text-blue-700" },
  late: { bg: "bg-red-100", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500" },
};

export default function Rentals() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "startDate",
    direction: "desc",
  });
  const limit = 10;

  const userRole = JSON.parse(localStorage.getItem("user")!).role as RolesType;
  const canRequestBiometry =
    userRole === ROLES.EMPLOYEE ||
    userRole === ROLES.MANAGER ||
    userRole === ROLES.OWNER;

  const columns: Column<Rental>[] = [
    {
      key: "branch",
      label: "Sede",
      render: (val) => {
        const branch = val as any;
        return `${branch?.name || '-'}`;
      },
    },
    {
      key: "employee",
      label: "Empleado",
      render: (val) => {
        const employee = val as any;
        return `${employee?.name || '-'}`;
      },
    },
    {
      key: "customer",
      label: "Cliente",
      render: (val) => {
        const customer = val as any;
        return customer.name;
      },
    },
    {
      key: "biometry_status",
      label: "Biometría",
      sortable: false,
      render: (_val, row) => {
        const biometries = row.customer?.biometryRequests ?? [];

        if (biometries.length === 0) {
          return (
            <button
              onClick={() => handleRequestBiometry(row)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 
            text-xs font-semibold hover:bg-red-100 transition"
            >
              🔴 Sin verificar
            </button>
          );
        }

        const last = [...biometries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        if (last.status === "pending") {
          return (
            <button
              onClick={() => handleRequestBiometry(row)}
              className="flex flex-col gap-0.5 text-left"
            >
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-yellow-100 text-yellow-700">
                ⏳ Pendiente
              </span>
              <span className="text-xs text-slate-400">
                {new Date(last.createdAt).toLocaleDateString("es-CO")}
              </span>
            </button>
          );
        }

        const isApproved = last.result === "approved";

        return (
          <button
            onClick={() => handleRequestBiometry(row)}
            className="flex flex-col gap-0.5 text-left"
          >
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit
          ${isApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            >
              {isApproved ? "✅ Aprobada" : "❌ Rechazada"}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(last.createdAt).toLocaleDateString("es-CO")}
            </span>
          </button>
        );
      },
    },
    {
      key: "startDate",
      label: "Fecha inicio",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "expectedReturnDate",
      label: "Fecha esperada devolución",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "actualReturnDate",
      label: "Fecha real devolución",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString("es-CO") : "-",
    },
    {
      key: "rentalStatus",
      label: "Estado",
      render: (val) => {
        const status = val as string;
        const colors = RENTAL_STATUS_COLORS[status] ?? {
          bg: "bg-gray-100",
          text: "text-gray-500",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {RENTAL_STATUS_LABELS[status] ?? status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
  ];

  const createRentalSchema = z.object({
    // Cliente
    identityType: z.optional(z.enum(IDENTITY_TYPE)),
    identityNumber: z.string().nonempty().min(5).max(20),
    name: z.string().nonempty().min(2).max(100),
    lastName: z.string().nonempty().min(2).max(100),
    email: z.optional(z.string().email()),
    phone: z.optional(z.string()),
    // Renta
    startDate: z.string().nonempty(),
    expectedReturnDate: z.string().nonempty(),
    rentalStatus: z
      .optional(z.enum(["active", "returned", "late", "cancelled"]))
      .default("active"),
  });

  const loadRentals = useCallback(async () => {
    const response: ListResponse<Rental> = await rentalService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setRentals(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await loadRentals();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Error al cargar las rentas";
        MySwal.fire({ title: "Error", text: message, icon: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [loadRentals]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleRequestBiometry = async (row: Rental) => {
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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    } catch (error: any) {
      MySwal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "No se pudo enviar la solicitud",
        icon: "error",
      });
    }
  };

  const handleViewDetails = (row: Rental) => {
    const statusLabel =
      RENTAL_STATUS_LABELS[row.rentalStatus] || row.rentalStatus;
    const statusColor = RENTAL_STATUS_COLORS[row.rentalStatus] || {
      bg: "bg-gray-100",
      text: "text-gray-500",
    };

    MySwal.fire({
      title: `Detalle de Renta #${row.id.slice(0, 8)}`,
      html: `
      <div style="text-align:left; font-size:14px; color:#374151;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <span class="px-2 py-1 rounded-full text-xs font-bold ${statusColor.bg} ${statusColor.text}">
            ${statusLabel}
          </span>
          <span style="font-size:12px; color:#6b7280;">Creado: ${new Date(row.createdAt).toLocaleString("es-CO")}</span>
        </div>

        <div style="background:#f9fafb; border-radius:8px; padding:12px; border:1px solid #e5e7eb; margin-bottom:12px;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase;">Información del Cliente</p>
          <p style="margin:0;"><strong>${row.customer?.name} ${row.customer?.lastName}</strong></p>
          <p style="margin:0; font-size:12px;">ID: ${row.customer?.identityNumber}</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
          <div style="background:#f0f9ff; border-radius:8px; padding:10px; border:1px solid #bae6fd;">
            <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#0369a1; text-transform:uppercase;">Entrega (Inicio)</p>
            <p style="margin:0; font-size:13px;"><strong>Responsable:</strong> ${ row.employee ? row.employee?.name : row.branch ? row.branch.name : row.renter?.name || "Sistema"}</p>
            <p style="margin:0; font-size:12px; color:#6b7280;">Fecha: ${new Date(row.startDate).toLocaleDateString("es-CO")}</p>
          </div>

          <div style="background:#f0fdf4; border-radius:8px; padding:10px; border:1px solid #bbf7d0;">
            <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#15803d; text-transform:uppercase;">Devolución (Fin)</p>
            <p style="margin:0; font-size:13px;"><strong>Recibido por:</strong> ${row.receivedByUser?.email || (row.actualReturnDate ? "Manual" : "-")}</p>
            <p style="margin:0; font-size:12px; color:#6b7280;">Fecha: ${row.actualReturnDate ? new Date(row.actualReturnDate).toLocaleDateString("es-CO") : "Pendiente"}</p>
          </div>
        </div>

        ${
          row.rentalStatus === "cancelled"
            ? `
          <div style="background:#fff1f2; border-radius:8px; padding:12px; border:1px solid #fecaca; margin-bottom:12px;">
            <p style="margin:0 0 4px; font-size:11px; font-weight:600; color:#be123c; text-transform:uppercase;">❌ Cancelación</p>
            <p style="margin:0; font-size:13px;"><strong>Cancelado por:</strong> ${row.cancelledByUser?.email || "N/A"}</p>
          </div>
        `
            : ""
        }

        <div style="font-size:12px; color:#6b7280; padding:0 4px;">
          <p style="margin:4px 0;"><strong>Sede:</strong> ${row.branch?.name || "-"}</p>
          <p style="margin:4px 0;"><strong>Retorno esperado:</strong> ${new Date(row.expectedReturnDate).toLocaleDateString("es-CO")}</p>
        </div>
      </div>
    `,
      confirmButtonColor: "#4f46e5",
      width: 500,
    });
  };

  const handleCreateClick = async () => {
    const { value: idData, isConfirmed } = await MySwal.fire({
      title: "Identificar Cliente",
      html: `
      <input id="swal-id" class="swal2-input" placeholder="Número de cédula/NIT">
    `,
      confirmButtonText: "Verificar",
      showCancelButton: true,
      preConfirm: () => {
        const val = (
          document.getElementById("swal-id") as HTMLInputElement
        ).value.trim();
        if (!val) {
          MySwal.showValidationMessage("Ingresa un número de identificación");
          return false;
        }
        return val;
      },
    });

    if (!isConfirmed || !idData) return;

    let existingCustomer: Customer | null = null;
    try {
      // Asumiendo que tienes este endpoint para buscar por ID
      existingCustomer = await customerService.findByIdentity(idData);
    } catch (e) {
      await MySwal.fire({
        title: "Error",
        text: "No se pudo encontrar el cliente",
        icon: "error",
      });
    }

    if (
      existingCustomer &&
      existingCustomer.status !== "normal" &&
      existingCustomer.status !== "yellow_alert"
    ) {
      // Recopilar qué critical flags están activos
      const activeFlags = existingCustomer.rentals
        ?.flatMap((rental) => rental.rentalFeedback)
        ?.flatMap((fb) => Object.entries(fb?.criticalFlags ?? {}))
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      const flagLabels: Record<string, string> = {
        vehicleTheft: "🚗 Robo de vehículo",
        impersonation: "🪪 Suplantación de identidad",
        // agrega más si tienes
      };

      const flagsHtml = activeFlags?.length
        ? activeFlags.map((f) => `<li>${flagLabels[f] ?? f}</li>`).join("")
        : "<li>Sin flags específicos</li>";

      // Mostrar advertencia ANTES del swal de crear renta
      const { isConfirmed } = await Swal.fire({
        title: "⚠️ Cliente en alerta",
        html: `
      <p style="color:#6b7280; margin-bottom:12px;">
        Este cliente tiene estado <strong style="color:#dc2626">${existingCustomer.status}</strong>.
        Se han reportado los siguientes flags críticos:
      </p>
      <ul style="text-align:left; color:#dc2626; font-weight:600; list-style:none; padding:0; 
        background:#fee2e2; border-radius:8px; padding:12px 16px; margin:0;">
        ${flagsHtml}
      </ul>
      <p style="color:#6b7280; margin-top:12px; font-size:13px;">
        ¿Deseas continuar con la creación de la renta?
      </p>
    `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!isConfirmed) return; // El empleado decidió no proceder
    }

    const identityTypeOptionsHtml = Object.values(IDENTITY_TYPE)
      .map((value) => `<option value="${value}">${value}</option>`)
      .join("");

    MySwal.fire({
      title: existingCustomer ? "Cliente encontrado" : "Nuevo Cliente",
      html: `
        <div class="text-left space-y-4">

        <p style="font-size:12px; font-weight:600; text-transform:uppercase; color:#3b82f6; margin:0 0 4px;">
        ${existingCustomer ? "✅ Datos verificados" : "📝 Datos del cliente"}
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                <input id="swal-name" class="swal2-input" style="margin:0; width:100%;" 
                value="${existingCustomer?.name || ""}" 
                ${existingCustomer ? "readonly" : ""} />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Apellido*</label>
                <input id="swal-lastName" class="swal2-input" style="margin:0; width:100%;" 
                value="${existingCustomer?.lastName || ""}" 
                ${existingCustomer ? "readonly" : ""} />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de identidad</label>
                <select id="swal-identityType" class="swal2-select" style="margin:0; width:100%;" ${existingCustomer ? "disabled" : ""}>
                ${identityTypeOptionsHtml}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Número de identidad*</label>
                <input id="swal-identityNumber" class="swal2-input" style="margin:0; width:100%; background:#f3f4f6;" 
                value="${idData}" readonly />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="swal-email" type="email" class="swal2-input" style="margin:0; width:100%;" 
                value="${existingCustomer?.email || ""}" 
                ${existingCustomer ? "readonly" : ""} />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input id="swal-phone" class="swal2-input" style="margin:0; width:100%;" 
                value="${existingCustomer?.phone || ""}" 
                ${existingCustomer ? "readonly" : ""} />
            </div>
            
            ${
              existingCustomer
                ? `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Score General</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer ? existingCustomer.generalScore + "/5" : "-"}" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <input class="swal2-input" style="margin:0; width:100%;
                    background:${existingCustomer?.status === "normal" ? "#dcfce7" : existingCustomer?.status === "red_alert" ? "#fee2e2" : "#fef9c2"};
                    color:${existingCustomer?.status === "normal" ? "#16a34a" : existingCustomer?.status === "red_alert" ? "#dc2626" : "#a65f00"}; font-weight:600;" 
                    value="${existingCustomer?.status ?? "-"}" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Registrado por</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer?.registeredByUser?.name ?? "Sin registrador"}" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Biometrías</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer?.biometryRequests?.length ?? 0} registradas" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rentas totales</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer?.rentals?.length ?? 0} rentas" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Creado</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer?.createdAt ? new Date(existingCustomer.createdAt).toLocaleDateString("es-CO") : "-"}" readonly />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Actualizado</label>
                    <input class="swal2-input" style="margin:0; width:100%;" 
                    value="${existingCustomer?.updatedAt ? new Date(existingCustomer.updatedAt).toLocaleDateString("es-CO") : "-"}" readonly />
                </div>
            `
                : ""
            }
        </div>

          <hr style="border:none; border-top:1px solid #e5e7eb; margin:8px 0;" />

          <p style="font-size:12px; font-weight:600; text-transform:uppercase; color:#6b7280; margin:0 0 4px;">
            Datos de la renta
          </p>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio*</label>
              <input id="swal-startDate" type="date" class="swal2-input" style="margin:0; width:100%;" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha esperada devolución*</label>
              <input id="swal-expectedReturnDate" type="date" class="swal2-input" style="margin:0; width:100%;" />
            </div>
          </div>

        </div>
      `,
      width: 600,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear renta",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const name = existingCustomer
          ? existingCustomer.name
          : (document.getElementById("swal-name") as HTMLInputElement).value;
        const lastName = existingCustomer
          ? existingCustomer.lastName
          : (document.getElementById("swal-lastName") as HTMLInputElement)
              .value;
        const identityType = existingCustomer
          ? existingCustomer.identityType
          : (document.getElementById("swal-identityType") as HTMLSelectElement)
              .value || undefined;
        const identityNumber = existingCustomer
          ? existingCustomer.identityNumber
          : (document.getElementById("swal-identityNumber") as HTMLInputElement)
              .value;
        const email = existingCustomer
          ? existingCustomer.email
          : (document.getElementById("swal-email") as HTMLInputElement).value ||
            undefined;
        const phone = existingCustomer
          ? existingCustomer.phone
          : (document.getElementById("swal-phone") as HTMLInputElement).value ||
            undefined;
        const startDate = (
          document.getElementById("swal-startDate") as HTMLInputElement
        ).value;
        const expectedReturnDate = (
          document.getElementById("swal-expectedReturnDate") as HTMLInputElement
        ).value;

        const result = createRentalSchema.safeParse({
          name,
          lastName,
          identityType,
          identityNumber,
          email,
          phone,
          startDate,
          expectedReturnDate,
        });

        if (!result.success) {
          MySwal.showValidationMessage(
            "Por favor completa todos los campos obligatorios (*)",
          );
          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        rentalService
          .createRentalManually(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "La renta ha sido creada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadRentals();
          })
          .catch((error: any) => {
            if (axios.isAxiosError(error)) {
              const backendMessage =
                error.response?.data?.message || "Error de conexión";
              const finalMessage = Array.isArray(backendMessage)
                ? backendMessage[0]
                : backendMessage;
              MySwal.fire({
                title: "Error al crear la renta",
                text: finalMessage,
                icon: "error",
                timer: 3000,
                showConfirmButton: false,
              });
            } else {
              MySwal.fire({
                title: "Error",
                text: error.message || "Ocurrió un error inesperado",
                icon: "error",
                timer: 3000,
                showConfirmButton: false,
              });
            }
          });
      }
    });
  };

  const handleReturn = async (row: Rental) => {
    const result = await MySwal.fire({
      title: "¿Marcar como devuelto?",
      text: "¿Estás seguro de que quieres marcar esta renta como devuelto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, marcar como devuelto",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      await rentalService.returnRental(row.id);
    } catch (error: any) {
      MySwal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "No se pudo marcar como devuelto",
        icon: "error",
      });
      return;
    }

    // ── Inmediatamente abre el feedback ──

    const { isConfirmed, value } = await MySwal.fire({
      title: `✍️ Feedback — ${row.customer?.name} ${row.customer?.lastName}`,
      html: <FeedbackForm row={row} />,
      showCancelButton: true,
      confirmButtonText: "Guardar feedback",
      cancelButtonText: "Omitir por ahora",
      confirmButtonColor: "#4f46e5",
      width: 560,
      focusConfirm: false,
      preConfirm: () => {
        const score: CreateFeedbackScore = {
          damageToCar: 0,
          unpaidFines: 0,
          arrears: 0,
          carAbuse: 0,
          badAttitude: 0,
        };
        for (const { key } of SCORE_FIELDS) {
          const selected = document.querySelector(
            `input[name="score-${key}"]:checked`,
          ) as HTMLInputElement;
          if (!selected) {
            MySwal.showValidationMessage(`Por favor califica: ${key}`);
            return false;
          }
          score[key] = parseInt(selected.value);
        }
        return {
          rentalId: row.id,
          score,
          criticalFlags: {
            vehicleTheft: (
              document.getElementById("flag-vehicleTheft") as HTMLInputElement
            ).checked,
            impersonation: (
              document.getElementById("flag-impersonation") as HTMLInputElement
            ).checked,
          },
          comments:
            (
              document.getElementById(
                "feedback-comments",
              ) as HTMLTextAreaElement
            ).value || undefined,
        };
      },
    });

    loadRentals();

    if (!isConfirmed || !value) return;

    try {
      await rentalFeedbackService.create(value);
      MySwal.fire({
        title: "✅ Todo listo",
        text: "Renta devuelta y feedback guardado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      MySwal.fire({
        title: "Error al guardar feedback",
        text:
          error.response?.data?.message ||
          error.message ||
          "La renta fue devuelta pero no se guardó el feedback",
        icon: "error",
      });
    }
  };

  const handleDelete = async (row: Rental) => {
    const result = await MySwal.fire({
      title: "¿Cancelar Renta?",
      text: "¿Estás seguro de que quieres cancelar esta renta?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await rentalService.cancelRental(row.id);
        MySwal.fire({
          title: "Renta cancelada",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRentals();
      } catch (error: any) {
        console.error(error);
        MySwal.fire({
          title: "Error al cancelar la renta",
          text:
            error.response?.data?.message ||
            error.message ||
            "Ocurrió un error inesperado",
          icon: "error",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Rentas"
        title="Listado de rentas"
        description="Gestiona el historial de todas las rentas"
      />
      <DataTable
        data={rentals}
        columns={columns}
        pageSize={limit}
        serverSidePagination
        serverSideSearch
        serverSideSort
        currentPage={page}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onSortChange={(key, direction) =>
          handleSortChange(key, direction ?? "asc")
        }
        totalPages={totalPages}
        totalItems={totalItems}
        searchPlaceholder="Buscar renta..."
        emptyMessage="No hay rentas registradas"
        createButton={true}
        onCreateClick={handleCreateClick}
        actions={(row) => {
          const isInDebt =
            row.rentalStatus === "active" || row.rentalStatus === "late";

          return (
            <div className="flex items-center gap-2">
              {/* El botón nuevo: Siempre visible para todos */}
              <button
                onClick={() => handleViewDetails(row)}
                className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Detalles
              </button>

              {/* Botón de Devolución */}
              {isInDebt && (
                <button
                  onClick={() => handleReturn(row)}
                  className="px-2 py-1 text-xs font-bold rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition cursor-pointer"
                >
                  Recibir
                </button>
              )}

              {/* Botón de Cancelar */}
              <button
                onClick={() => handleDelete(row)}
                disabled={!isInDebt}
                className={`px-2 py-1 text-xs rounded-md font-bold transition ${
                  !isInDebt
                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                    : "bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                }`}
              >
                Cancelar
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
