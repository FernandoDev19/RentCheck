import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import PageHeader from "../../shared/components/PageHeader";
import DataTable from "../../shared/components/datatable/DataTable";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { catchError } from "../../shared/errors/catch-error";
import { userService } from "../../services/user.service";
import type { User } from "../../shared/types/user.type";
import type { Column } from "../../shared/components/datatable/types/column.type";
import { USER_STATUS } from "../../shared/types/user.type";
import type { Role } from "../../shared/types/role.type";

const MySwal = withReactContent(Swal);

const ROLE_COLORS: Record<string, string> = {
  "Admin Rentcheck": "bg-purple-100 text-purple-700",
  Owner: "bg-indigo-100 text-indigo-700",
  Manager: "bg-blue-100 text-blue-700",
  Employee: "bg-slate-100 text-slate-600",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  suspended: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
};

const ROLE_OPTIONS = [
  { value: "", label: "Todos los roles" },
  { value: "Admin Rentcheck", label: "Admin" },
  { value: "Owner", label: "Owner" },
  { value: "Manager", label: "Manager" },
  { value: "Employee", label: "Employee" },
];

const columns: Column<User>[] = [
  {
    key: "name",
    label: "Nombre",
    render: (val, row) => (
      <div>
        <p className="font-semibold text-slate-800 text-sm">{String(val)}</p>
        <p className="text-xs text-slate-400">{row.email}</p>
      </div>
    ),
  },
  {
    key: "role",
    label: "Rol",
    sortable: false,
    render: (val) => {
      const role = val as Role | undefined;
      const name = role?.name ?? "—";
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            ROLE_COLORS[name] ?? "bg-slate-100 text-slate-500"
          }`}
        >
          {name}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Estado",
    render: (val) => {
      const s = String(val);
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            STATUS_COLORS[s] ?? "bg-slate-100 text-slate-400"
          }`}
        >
          {STATUS_LABELS[s] ?? s}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "Creado",
    render: (val) =>
      val ? new Date(val as string).toLocaleDateString("es-CO") : "—",
  },
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAll({ limit: 200 });
      setUsers(response.data);
    } catch (error) {
      await catchError(error, MySwal, "Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Client-side filter
  useEffect(() => {
    let result = users;

    if (roleFilter) {
      result = result.filter((u) => u.role?.name === roleFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
    setPage(1);
  }, [users, roleFilter, search]);

  // ── View detail ──
  const handleView = (user: User) => {
    MySwal.fire({
      title: user.name,
      html: `
        <div style="text-align:left;font-size:13px;line-height:2">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 20px">
            <div>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Email</span>
              <p style="margin:0">${user.email}</p>
            </div>
            <div>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Rol</span>
              <p style="margin:0;font-weight:600">${user.role?.name ?? "—"}</p>
            </div>
            <div>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Estado</span>
              <p style="margin:0">${STATUS_LABELS[user.status] ?? user.status}</p>
            </div>
            <div>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">ID</span>
              <p style="margin:0;font-family:monospace;font-size:11px">${user.id}</p>
            </div>
            ${
              user.renterId
                ? `<div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Rentadora ID</span>
              <p style="margin:0;font-family:monospace;font-size:11px">${user.renterId}</p></div>`
                : ""
            }
            ${
              user.branchId
                ? `<div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Sede ID</span>
              <p style="margin:0;font-family:monospace;font-size:11px">${user.branchId}</p></div>`
                : ""
            }
            ${
              user.employeeId
                ? `<div><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Empleado ID</span>
              <p style="margin:0;font-family:monospace;font-size:11px">${user.employeeId}</p></div>`
                : ""
            }
            <div>
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8">Creado</span>
              <p style="margin:0">${new Date(user.createdAt).toLocaleDateString("es-CO")}</p>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      width: 460,
    });
  };

  // ── Toggle status ──
  const handleToggleStatus = async (user: User) => {
    const isActive = user.status === USER_STATUS.ACTIVE;
    const targetStatus = isActive ? USER_STATUS.SUSPENDED : USER_STATUS.ACTIVE;
    const label = isActive ? "suspender" : "activar";

    const { isConfirmed } = await MySwal.fire({
      title: `¿${isActive ? "Suspender" : "Activar"} usuario?`,
      text: `${user.name} — ${user.email}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#dc2626" : "#16a34a",
      confirmButtonText: `Sí, ${label}`,
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;

    try {
      await userService.update(user.id, { status: targetStatus });
      MySwal.fire({
        title: `Usuario ${isActive ? "suspendido" : "activado"}`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadUsers();
    } catch (error) {
      await catchError(error, MySwal, "Error al cambiar estado del usuario");
    }
  };

  // Pagination (client-side)
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Sistema"
        title="Usuarios del sistema"
        description="Visualiza y gestiona todos los usuarios registrados en RentCheck"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-xs w-full"
        />
        <div className="flex gap-1 flex-wrap">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                roleFilter === opt.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} usuarios encontrados
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable
          data={paginated}
          columns={columns}
          pageSize={limit}
          currentPage={page}
          onPageChange={setPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          serverSidePagination
          searchable={false}
          emptyMessage="No hay usuarios que coincidan con los filtros"
          actions={(row) => (
            <div className="flex items-center gap-2">
              <ButtonActionDataTable onClick={() => handleView(row)} color="indigo">
                Ver detalle
              </ButtonActionDataTable>
              <ButtonActionDataTable
                onClick={() => handleToggleStatus(row)}
                color={row.status === USER_STATUS.ACTIVE ? "red" : "green"}
              >
                {row.status === USER_STATUS.ACTIVE ? "Suspender" : "Activar"}
              </ButtonActionDataTable>
            </div>
          )}
        />
      )}
    </div>
  );
}