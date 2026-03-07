import { useCallback, useEffect, useState } from "react";
import DataTable, { type Column } from "../../common/components/DataTable";
import type { Customer } from "../../models/customer.model";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import { customerService } from "../../services/customer.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import RentalsByCustomerTable from "./components/RentalsByCustomerTable";
import PageHeader from "../../common/components/PageHeader";
import { biometryRequestService } from "../../services/biometry-request.service";
import { ROLES, type RolesType } from "../../common/types/roles.type";
import axios from "axios";

const MySwal = withReactContent(Swal);

const CUSTOMER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: "bg-green-100", text: "text-green-700" },
  yellow_alert: { bg: "bg-yellow-100", text: "text-yellow-700" },
  red_alert: { bg: "bg-red-100", text: "text-red-700" },
};

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  normal: "Normal",
  yellow_alert: "Alerta amarilla",
  red_alert: "Alerta roja",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 10;

  const userRole = JSON.parse(localStorage.getItem("user")!).role as RolesType;
  const canRequestBiometry =
    userRole === ROLES.EMPLOYEE ||
    userRole === ROLES.MANAGER ||
    userRole === ROLES.OWNER;

  const columns: Column<Customer>[] = [
    {
      key: "identityNumber",
      label: "Cédula / NIT",
    },
    {
      key: "name",
      label: "Nombre",
      render: (_val, row) => `${row.name} ${row.lastName}`,
    },
    {
      key: "phone",
      label: "Teléfono",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "email",
      label: "Correo",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "generalScore",
      label: "Score",
      render: (val) => {
        const score = val as number;
        const color =
          score >= 4
            ? "text-green-600"
            : score >= 2.5
              ? "text-yellow-600"
              : "text-red-600";
        return (
          <span className={`font-semibold ${color}`}>
            {score != null ? `${Number(score).toFixed(1)} / 5` : "-"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (val) => {
        const status = val as string;
        const colors = CUSTOMER_STATUS_COLORS[status] ?? {
          bg: "bg-gray-100",
          text: "text-gray-500",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {CUSTOMER_STATUS_LABELS[status] ?? status}
          </span>
        );
      },
    },
    {
      key: "biometryRequests",
      label: "Biometría",
      sortable: false,
      render: (_val, row) => {
        const biometries = row.biometryRequests ?? [];

        if (biometries.length === 0) {
          return (
            <button
              onClick={() => handleRequestBiometry(row)}
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition"
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
      key: "createdAt",
      label: "Registrado",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
  ];

  const loadCustomers = useCallback(async () => {
    const response: ListResponse<Customer> = await customerService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setCustomers(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadCustomers();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Error al cargar los clientes";
        MySwal.fire({ title: "Error", text: message, icon: "error" });
      }
    };
    run();
  }, [loadCustomers]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

    const handleRequestBiometry = async (customer: Customer) => {
    const biometries = customer.biometryRequests ?? [];
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
          .slice()
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
          Cliente: <strong>${customer.name} ${customer.lastName}</strong>
        </p>

        ${
          biometries.length === 0
            ? `
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; 
          padding:10px 14px; color:#dc2626; font-weight:600; font-size:13px; margin-bottom:12px;">
          🔴 Este cliente no tiene biometrías registradas.
        </div>
      `
            : last?.status === "pending"
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
        <div style="background:${last?.result === "approved" ? "#f0fdf4" : "#fef2f2"}; 
          border:1px solid ${last?.result === "approved" ? "#bbf7d0" : "#fecaca"}; 
          border-radius:8px; padding:10px 14px; margin-bottom:12px;">
          <p style="margin:0; font-size:13px; font-weight:600; 
            color:${last?.result === "approved" ? "#16a34a" : "#dc2626"};">
            ${last?.result === "approved" ? "✅ Última biometría aprobada" : "❌ Última biometría rechazada"}
          </p>
          <p style="margin:4px 0 0; font-size:12px; color:#6b7280;">
            ${last?.createdAt ? new Date(last.createdAt).toLocaleDateString("es-CO") : ""}
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
    } catch (error: unknown) {
      const message = (() => {
        if (axios.isAxiosError(error)) {
          const data = error.response?.data;
          if (data && typeof data === "object" && "message" in data) {
            const msg = (data as { message?: unknown }).message;
            return msg ?? error.message;
          }
          return error.message;
        }

        if (error instanceof Error) return error.message;
        return "No se pudo enviar la solicitud";
      })();

      MySwal.fire({
        title: "Error",
        text: Array.isArray(message) ? message[0] : String(message),
        icon: "error",
      });
    }
  };

  const handleViewInfo = (row: Customer) => {
    const biometries = row.biometryRequests ?? [];
    const lastBiometry = [...biometries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    const biometryHtml =
      biometries.length === 0
        ? `<span style="color:#dc2626; font-weight:600;">🔴 Sin biometrías</span>`
        : lastBiometry.status === "pending"
          ? `<span style="color:#92400e; font-weight:600;">⏳ Pendiente — ${new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}</span>`
          : lastBiometry.result === "approved"
            ? `<span style="color:#16a34a; font-weight:600;">✅ Aprobada — ${new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}</span>`
            : `<span style="color:#dc2626; font-weight:600;">❌ Rechazada — ${new Date(lastBiometry.createdAt).toLocaleDateString("es-CO")}</span>`;

    const scoreColor =
      row.generalScore >= 4
        ? "#16a34a"
        : row.generalScore >= 2.5
          ? "#92400e"
          : "#dc2626";

    const statusColor =
      row.status === "normal"
        ? { bg: "#dcfce7", color: "#16a34a" }
        : row.status === "yellow_alert"
          ? { bg: "#fef9c3", color: "#92400e" }
          : row.status === "red_alert"
            ? { bg: "#fee2e2", color: "#dc2626" }
            : { bg: "#111827", color: "#ffffff" };

    MySwal.fire({
      title: "Detalle del cliente",
      html: `
            <div style="text-align:left; font-size:14px; line-height:1.8;">

            <!-- Datos personales -->
            <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#4f46e5; margin:0 0 8px;">
                Datos personales
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Nombre</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.name} ${row.lastName}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Tipo identidad</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.identityType ?? "-"}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Número identidad</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.identityNumber}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Teléfono</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.phone ?? "-"}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Correo</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.email ?? "-"}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Registrado por</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.registeredByUser?.name ?? "-"}</p>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

            <!-- Score y estado -->
            <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#4f46e5; margin:0 0 8px;">
                Reputación
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Score general</span>
                <p style="margin:0; font-weight:700; font-size:16px; color:${scoreColor};">
                    ${row.generalScore != null ? `${Number(row.generalScore).toFixed(1)} / 5` : "-"}
                </p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Estado</span>
                <p style="margin:4px 0 0;">
                    <span style="padding:2px 10px; border-radius:9999px; font-size:12px; font-weight:600;
                    background:${statusColor.bg}; color:${statusColor.color};">
                    ${CUSTOMER_STATUS_LABELS[row.status] ?? row.status}
                    </span>
                </p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Última biometría</span>
                <p style="margin:0;">${biometryHtml}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Total biometrías</span>
                <p style="margin:0; color:#111827; font-weight:500;">${biometries.length}</p>
                </div>
            </div>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

            <!-- Historial rentas -->
            <button id="btn-ver-rentas"
                style="width:100%; padding:8px; background:#4f46e5; color:white; border:none; 
                border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">
                📋 Ver historial de rentas
                </button>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

            <!-- Fechas -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px;">
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Registrado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${new Date(row.createdAt).toLocaleDateString("es-CO")}</p>
                </div>
                <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Actualizado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${new Date(row.updatedAt).toLocaleDateString("es-CO")}</p>
                </div>
            </div>

            </div>
        `,
      showConfirmButton: false,
      showCloseButton: true,
      width: 580,
      didOpen: () => {
        document
          .getElementById("btn-ver-rentas")
          ?.addEventListener("click", () => {
            MySwal.close();
            MySwal.fire({
              title: `Historial — ${row.name} ${row.lastName}`,
              html: <RentalsByCustomerTable customerId={row.id} />,
              showConfirmButton: false,
              showCloseButton: true,
              width: 780,
            });
          });
      },
    });
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Clientes"
        title="Listado de clientes"
        description="Gestiona el historial unificado de todos los clientes"
      />
      <DataTable
        data={customers}
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
        searchPlaceholder="Buscar cliente..."
        emptyMessage="No hay clientes registrados"
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewInfo(row)}
              className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
            >
              Ver info
            </button>
          </div>
        )}
      />
    </div>
  );
}
