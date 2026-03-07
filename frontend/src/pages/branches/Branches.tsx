import { useEffect, useState } from "react";
import type { Branch } from "../../models/branch.model";
import type { Column } from "../../common/components/DataTable";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import { branchService } from "../../services/branch.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import DataTable from "../../common/components/DataTable";
import z from "zod";
import axios from "axios";
import PageHeader from "../../common/components/PageHeader";

const MySwal = withReactContent(Swal);

export default function Branches() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);
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

  const columns: Column<Branch>[] = [
    { key: "name", label: "Nombre" },
    { key: "city", label: "Ciudad" },
    { key: "address", label: "Dirección" },
    { key: "phone", label: "Teléfono" },
    { key: "responsible", label: "Responsable" },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "status",
      label: "Estado",
    },
  ];

  const createBranchSchema = z.object({
    name: z.string().nonempty().min(5).max(100),
    address: z.optional(z.string().max(199)),
    city: z.optional(z.string().max(199)),
    phone: z.string().nonempty().min(7).max(15),
    responsible: z.string().nonempty().min(3).max(100),
    responsiblePhone: z.string().nonempty().min(7).max(15),
    email: z.email(),
    password: z.string().nonempty().min(8).max(60),
    status: z.boolean().default(true),
  });

  const loadBranches = async () => {
    const response: ListResponse<Branch> = await branchService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setBranches(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  };

  useEffect(() => {
    try {
      setIsLoading(true);
      loadBranches();
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

  const handleView = async (row: Branch) => {
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
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Representante</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.responsible}</p>
            </div>  
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Telefono representante</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.responsiblePhone}</p>
            </div>  
            </div>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Email</span>
                <p style="margin:0; color:#111827; font-weight:500;">${row.email}</p>
            </div>  
            <div>
                <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Estado</span>
                <p style="margin:0;">
                <span style="padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:600;
                    background:${row.status === true ? "#dcfce7" : "#fee2e2"};
                    color:${row.status === true ? "#16a34a" : "#dc2626"};">
                    ${row.status === true ? "Activo" : "Suspendido"}
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
    MySwal.fire({
      title: "Crear nueva Sede",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
            <input id="swal-input1" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Nombre de la sede">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input id="swal-input2" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Ciudad">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input id="swal-input3" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Dirección" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Celular*</label>
            <input id="swal-input4" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Ej. 300XXXX123" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Responsable*</label>
            <input id="swal-input5" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Responsable" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Celular Responsable*</label>
            <input id="swal-input6" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Ej. 300XXXX123" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input id="swal-input7" type="email" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Email" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña*</label>
            <input
                id="swal-input8"
                class="swal2-input"
                style="margin: 0px; width: 100%;"
                type="password"
                required
                placeholder="•••••••••"
              />

          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select id="swal-input9" class="swal2-select" style="margin: 0px; width: 100%;">
              <option value="true">Activo</option>
              <option value="false">Suspendido</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear sede",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const name = (
          document.getElementById("swal-input1") as HTMLInputElement
        ).value;
        const city = (
          document.getElementById("swal-input2") as HTMLInputElement
        ).value;
        const address = (
          document.getElementById('swal-input3') as HTMLInputElement
        ).value;
        const phone = (
          document.getElementById('swal-input4') as HTMLInputElement
        ).value;
        const responsible = (
          document.getElementById('swal-input5') as HTMLInputElement
        ).value;
        const responsiblePhone = (
          document.getElementById('swal-input6') as HTMLInputElement
        ).value;
        const email = (
          document.getElementById('swal-input7') as HTMLInputElement
        ).value;
        const password = (
          document.getElementById('swal-input8') as HTMLInputElement
        ).value;
        const status = (
          document.getElementById("swal-input9") as HTMLInputElement
        ).value;

        const result = createBranchSchema.safeParse({
          name,
          address,
          city,
          phone,
          responsible,
          responsiblePhone,
          email,
          password,
          status: status === "true" ? true : false,
        });

        if (!result.success) {
          console.log(result.error);
          MySwal.showValidationMessage("Por favor completa todos los campos obligatorios (*)");
          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        branchService
          .createBranch(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "La sede ha sido creada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadBranches();
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

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  return (
    <div className="w-full">
    <PageHeader
      eyebrow="Sedes"
      title="Gestión de Sedes"
      description="Administra las sedes de tu empresa"
    />
      <DataTable
        data={branches}
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
        searchPlaceholder="Buscar sede..."
        emptyMessage="No hay sedes registradas"
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
