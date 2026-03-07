import { useCallback, useEffect, useState } from "react";
import type { Column } from "../../common/components/DataTable";
import type { Employee } from "../../models/employee.model";
import { IDENTITY_TYPE } from "../../common/types/identity-type.type";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import { employeeService } from "../../services/employee.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import DataTable from "../../common/components/DataTable";
import z from "zod";
import { ROLES, type RolesType } from "../../common/types/roles.type";
import { branchService } from "../../services/branch.service";
import axios from "axios";
import PageHeader from "../../common/components/PageHeader";

const MySwal = withReactContent(Swal);

export default function Employees() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const columns: Column<Employee>[] = [
    {
      key: "branch",
      label: "Sede",
      render: (val) => {
        const branch = val as any;
        return `${branch.name}`;
      },
    },
    { key: "name", label: "Nombre" },
    {
      key: "user",
      label: "Email",
      render: (val) => {
        const user = val as any;
        return `${user.email}`;
      },
    },
    { key: "identityType", label: "Tipo ID" },
    { key: "identityNumber", label: "Num. ID" },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "status",
      label: "Estado",
      render: (_val, row) => {
        const user = row.user as any;
        return user.status;
      },
    },
  ];

  const createEmployeeSchema = z.object({
    name: z.string().nonempty().min(3).max(100),
    email: z.email(),
    password: z.string().nonempty().min(8).max(60),
    branchId: z.optional(z.string().nonempty()),
    identityType: z.optional(z.enum(IDENTITY_TYPE)),
    identityNumber: z.string().nonempty().min(5).max(15),
  });

  const userRole: RolesType = JSON.parse(localStorage.getItem("user")!)
    .role as RolesType;

  const loadEmployees = useCallback(async () => {
    const response: ListResponse<Employee> = await employeeService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setEmployees(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await loadEmployees();
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
    };

    run();
  }, [loadEmployees]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleCreateClick = async () => {
    let branchNames = branches;

    if (userRole === ROLES.OWNER && !branchNames.length) {
      try {
        branchNames = await branchService.getAllNames();
        setBranches(branchNames);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Error al cargar las sedes";
        MySwal.fire({
          title: "Error",
          text: message,
          icon: "error",
        });
        return;
      }
    }

    const branchOptionsHtml = branchNames
      .map((b) => `<option value="${b.id}">${b.name}</option>`)
      .join("");

    const identityTypeOptionsHtml = Object.values(IDENTITY_TYPE)
      .map((value) => `<option value="${value}">${value}</option>`)
      .join("");

    MySwal.fire({
      title: "Crear nuevo empleado",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
            <input id="swal-input1" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Nombre del empleado">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input id="swal-input2" type="email" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Email" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña*</label>
            <input
                id="swal-input3"
                class="swal2-input"
                style="margin: 0px; width: 100%;"
                type="password"
                required
                placeholder="•••••••••"
              />
          </div>

          ${
            userRole === ROLES.OWNER
              ? `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sede*</label>
                <select id="swal-input4" class="swal2-select" style="margin: 0px; width: 100%;">
                ${branchOptionsHtml}
                </select>
            </div>
            `
              : ""
          }

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de identidad</label>
            <select id="swal-input5" class="swal2-select" style="margin: 0px; width: 100%;">
                ${identityTypeOptionsHtml}
            </select>
          </div>

           <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Numero de Identidad*</label>
            <input id="swal-input6" class="swal2-input" style="margin: 0px; width: 100%;" placeholder="Ej. 12345678..." />
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
        const email = (
          document.getElementById("swal-input2") as HTMLInputElement
        ).value;
        const password = (
          document.getElementById("swal-input3") as HTMLInputElement
        ).value;
        const branchId =
          (document.getElementById("swal-input4") as HTMLInputElement)?.value ||
          undefined;
        const identityType =
          (document.getElementById("swal-input5") as HTMLInputElement)?.value ||
          IDENTITY_TYPE.CC;
        const identityNumber = (
          document.getElementById("swal-input6") as HTMLInputElement
        )?.value;

        const result = createEmployeeSchema.safeParse({
          name,
          email,
          password,
          branchId,
          identityType,
          identityNumber,
        });

        if (!result.success) {
          console.log(result.error);
          MySwal.showValidationMessage(
            "Por favor completa todos los campos obligatorios (*)",
          );
          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        employeeService
          .createEmployee(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "El empleado ha sido creado correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadEmployees();
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
                text: finalMessage,
                icon: "error",
                timer: 3000,
                showConfirmButton: false,
              });
              return;
            } else {
              // Cualquier otra vaina rara
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

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Empleados"
        title="Gestión de empleados"
        description="Gestiona los empleados de la empresa"
      />
      <DataTable
        data={employees}
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
        searchPlaceholder="Buscar empleado..."
        emptyMessage="No hay empleados registrados"
        createButton={true}
        onCreateClick={handleCreateClick}
      />
    </div>
  );
}
