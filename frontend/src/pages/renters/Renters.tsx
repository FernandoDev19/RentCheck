import { useEffect, useState } from "react";
import type { Renter } from "../../models/renter.model";
import { renterService } from "../../services/renter.service";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import DataTable, { type Column } from "../../common/components/DataTable";
import Swal from "sweetalert2";
import type { Plan } from "../../models/plan.model";
import { planService } from "../../services/plan.service";
import withReactContent from "sweetalert2-react-content";
import z from "zod";
import axios from "axios";
import PageHeader from "../../common/components/PageHeader";

const MySwal = withReactContent(Swal);

export default function Renters() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });
  const limit = 10;
  const createRenterSchema = z.object({
    name: z.string().min(1),
    nit: z.string().min(1),
    address: z.optional(z.string().min(1)),
    city: z.optional(z.string().min(1)),
    email: z.email(),
    password: z.string().min(8),
    phone: z.string().min(7).max(15),
    legalRepresentative: z.string().min(3).max(60),
    planId: z.number().min(1),
    planExpiresAt: z.optional(z.string()),
    balance: z.number().min(0),
    lowBalanceThreshold: z.optional(z.number().min(0).max(999999999)),
    lowBalanceAlertEnabled: z.optional(z.boolean()),
    status: z.optional(z.enum(["active", "suspended"])),
  });

  const columns: Column<Renter>[] = [
    { key: "name", label: "Nombre" },
    { key: "nit", label: "NIT" },
    { key: "city", label: "Ciudad" },
    { key: "address", label: "Dirección" },
    { key: "phone", label: "Teléfono" },
    {
      key: "plan",
      label: "Plan",
      sortable: false,
      render: (_val, row) => row.plan?.name ?? "-",
    },
    {
      key: "balance",
      label: "Balance",
      render: (val) =>
        typeof val === "number"
          ? val.toLocaleString("es-CO")
          : String(val ?? "-"),
    },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "status",
      label: "Estado",
      render: (val) => (val === "active" ? "Activo" : "Suspendido"),
    },
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      const response = await planService.getPlans();
      setPlans(response);
    };
    fetchPlans();
  }, []);

  const loadRenters = async () => {
    const response: ListResponse<Renter> = await renterService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setRenters(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  };

  useEffect(() => {
    try {
      setIsLoading(true);
      loadRenters();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Error al cargar los rentadores";
      MySwal.fire({
        title: "Error",
        text: message,
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, orderBy]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleView = async (row: Renter) => {
    MySwal.fire({
      title: "Ver rentadora",
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.8;">

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Nombre</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.name}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">NIT</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.nit}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Ciudad</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.city}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Dirección</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.address}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Teléfono</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.phone}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Representante Legal</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.legalRepresentative}</p>
            </div>
            </div>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Plan</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.plan?.name ?? "-"}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Vence</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.planExpiresAt ? new Date(row.planExpiresAt).toLocaleDateString("es-CO") : "-"}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Balance</span>
                <p style="margin:0; color:#111827; font-weight:500;">$${row.balance.toLocaleString("es-CO")}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Umbral de alerta</span>
                <p style="margin:0; color:#111827; font-weight:500;">$${row.lowBalanceThreshold.toLocaleString("es-CO")}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Alerta balance bajo</span>
                <p style="margin:0;">
                <span style="padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:600;
                    background:${row.lowBalanceAlertEnabled ? "#dcfce7" : "#f3f4f6"};
                    color:${row.lowBalanceAlertEnabled ? "#16a34a" : "#6b7280"};">
                    ${row.lowBalanceAlertEnabled ? "Activa" : "Inactiva"}
                </span>
                </p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Estado</span>
                <p style="margin:0;">
                <span style="padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:600;
                    background:${row.status === "active" ? "#dcfce7" : "#fee2e2"};
                    color:${row.status === "active" ? "#16a34a" : "#dc2626"};">
                    ${row.status === "active" ? "Activo" : "Suspendido"}
                </span>
                </p>
            </div>
            </div>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px;">
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Creado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${new Date(row.createdAt).toLocaleDateString("es-CO")}</p>
            </div>
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Actualizado</span>
                <p style="margin:0; color:#111827; font-weight:500;">${new Date(row.updatedAt).toLocaleDateString("es-CO")}</p>
            </div>
            </div>

        </div>
        `,
      icon: "info",
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
    });
  };

  const handleCreateClick = async () => {
    let currentPlans = plans;
    if (!currentPlans.length) {
      try {
        currentPlans = await planService.getPlans();
        setPlans(currentPlans);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Error al cargar los planes";
        MySwal.fire({
          title: "Error",
          text: message,
          icon: "error",
        });
        return;
      }
    }

    const planOptionsHtml = currentPlans
      .map((plan) => `<option value="${plan.id}">${plan.name}</option>`)
      .join("");

    MySwal.fire({
      title: "Crear nueva rentadora",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
            <input id="swal-input1" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Nombre de la rentadora">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">NIT*</label>
            <input id="swal-input2" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="NIT">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input id="swal-input3" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Dirección" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input id="swal-input4" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Ciudad" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input id="swal-input5" type="email" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Email" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono*</label>
            <input id="swal-input6" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Teléfono" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña*</label>
            <input id="swal-input7" type="password" required class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Contraseña" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Representante Legal*</label>
            <input id="swal-input8" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Representante Legal" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plan*</label>
            <select id="swal-input9" class="swal2-select" style="margin: 0px; width: 100%;">
              ${planOptionsHtml}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de expiración del plan</label>
            <input id="swal-input10" type="date" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Fecha de expiración del plan" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Saldo*</label>
            <input id="swal-input11" type="number" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Saldo" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Umbral de saldo bajo</label>
            <input id="swal-input12" type="number" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Umbral de saldo bajo" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Alerta de saldo bajo</label>
            <input id="swal-input13" type="checkbox" class="swal2-checkbox" style="margin: 0px; width: 100%;" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select id="swal-input14" class="swal2-select" style="margin: 0px; width: 100%;">
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear rentadora",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const name = (
          document.getElementById("swal-input1") as HTMLInputElement
        ).value;
        const nit = (document.getElementById("swal-input2") as HTMLInputElement)
          .value;
        const address = (
          document.getElementById("swal-input3") as HTMLInputElement
        ).value || undefined;
        const city = (
          document.getElementById("swal-input4") as HTMLInputElement
        ).value || undefined;
        const email = (
          document.getElementById("swal-input5") as HTMLInputElement
        ).value;
        const phone = (
          document.getElementById("swal-input6") as HTMLInputElement
        ).value;
        const password = (
          document.getElementById("swal-input7") as HTMLInputElement
        ).value;
        const legalRepresentative = (
          document.getElementById("swal-input8") as HTMLInputElement
        ).value;
        const planId = (
          document.getElementById("swal-input9") as HTMLInputElement
        ).value;
        const planExpiresAt = (
          document.getElementById("swal-input10") as HTMLInputElement
        ).value || undefined;
        const balance = (
          document.getElementById("swal-input11") as HTMLInputElement
        ).value;
        const lowBalanceThreshold = (
          document.getElementById("swal-input12") as HTMLInputElement
        ).value;
        const lowBalanceAlertEnabled = (
          document.getElementById("swal-input13") as HTMLInputElement
        ).checked;
        const status = (
          document.getElementById("swal-input14") as HTMLInputElement
        ).value;

        const result = createRenterSchema.safeParse({
          nit,
          name,
          address,
          city,
          email,
          password,
          legalRepresentative,
          phone,
          planId: Number(planId),
          planExpiresAt,
          balance: Number(balance),
          lowBalanceThreshold: Number(lowBalanceThreshold),
          lowBalanceAlertEnabled,
          status,
        });

        if (!result.success) {
          console.log(result.error);
          MySwal.showValidationMessage("Por favor completa todos los campos");
          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        renterService
          .createRenter(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "La rentadora ha sido creada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadRenters();
          })
          .catch((error: any) => {
            if (axios.isAxiosError(error)) {
              const backendMessage =
                error.response?.data?.message || "Error de conexión";
              const finalMessage = Array.isArray(backendMessage)
                ? backendMessage[0]
                : backendMessage;

              MySwal.fire({
                title: "Credenciales incorrectas",
                text: finalMessage, // Aquí saldrá tu "Password is wrong"
                icon: "error",
                timer: 1500,
                showConfirmButton: false,
              });
              return;
            } else {
              // Cualquier otra vaina rara
              MySwal.fire({
                title: "Error",
                text: error.message || "Ocurrió un error inesperado",
                icon: "error",
                timer: 1500,
                showConfirmButton: false,
              });
            }
          });
      }
    });
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Rentadoras"
        title="Gestión de Rentadoras"
        description="Administra las rentadoras"
      />
      <DataTable
        data={renters}
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
        searchPlaceholder="Buscar rentadora..."
        emptyMessage="No hay rentadoras registradas"
        createButton={true}
        onCreateClick={handleCreateClick}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleView(row)}
              className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
            >
              Ver
            </button>
          </div>
        )}
      />
    </div>
  );
}
