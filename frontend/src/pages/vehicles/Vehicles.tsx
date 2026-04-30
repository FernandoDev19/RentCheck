import PageHeader from "../../shared/components/PageHeader";
import DataTable from "../../shared/components/datatable/DataTable";
import CardList from "../../shared/components/card-list/CardList";
import { useVehicles } from "./hooks/useVehicles";
import type { Vehicle } from "../../shared/types/vehicle.type";
import { getUser } from "../dashboard/helpers/user.helper";
import { ROLES } from "../../shared/types/role.type";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { Edit, Info, Trash2 } from "lucide-react";
import { useCreateVehicle } from "./hooks/useCreateVehicle";
import { useEditVehicle } from "./hooks/useEditVehicle";
import { useChangeStatus } from "./hooks/useChangeStatus";
import { columns } from "./constants/vehicles.columns";
import { cardFields } from "./constants/vehicles.fields";
import { StatusBadge } from "./helpers/vehicle-status-badge.helper";
import { VEHICLE_STATUS } from "../../shared/types/vehicle.type";
import { useVehicleAvailability } from "./hooks/useVehicleAvailability";
import { useViewDetails } from "./hooks/useViewDetails";

export default function Vehicles() {
  const {
    vehicles,
    loadVehicles,
    handleDelete,
    page,
    setPage,
    viewMode,
    setViewMode,
    limit,
    totalItems,
    totalPages,
    setSearchTerm,
    setOrderBy,
  } = useVehicles();
  const { handleCreate } = useCreateVehicle();
  const { handleEdit } = useEditVehicle();
  const { handleChangeStatus } = useChangeStatus();
  const { openAvailabilityModal } = useVehicleAvailability();
    const { handleViewDetail } = useViewDetails();

  const user = getUser();

  const canManage = user.role === ROLES.OWNER || user.role === ROLES.MANAGER;
  const renderActions = (row: Vehicle) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* <ButtonActionDataTable onClick={() => handleHistory(row)} color="indigo">
          Historial
        </ButtonActionDataTable> */}
        <ButtonActionDataTable color="indigo" onClick={() => handleViewDetail(row)}>
          <Info size={16}/>
        </ButtonActionDataTable>
      {canManage && (
        <>
          <ButtonActionDataTable
            onClick={() => handleEdit(loadVehicles, row)}
            color="slate"
          >
            <Edit size={16} />
          </ButtonActionDataTable>
          {row.status !== VEHICLE_STATUS.RENTED && (
            <ButtonActionDataTable
              onClick={() => handleChangeStatus(loadVehicles, row)}
              color="yellow"
            >
              Estado
            </ButtonActionDataTable>
          )}
          <ButtonActionDataTable
            onClick={() => handleDelete(row)}
            color="red"
            disabled={row.status === VEHICLE_STATUS.RENTED}
            title={
              row.status === VEHICLE_STATUS.RENTED
                ? "No puedes eliminar un vehiculo rentado"
                : undefined
            }
            className="disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <Trash2 size={16} />
          </ButtonActionDataTable>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Inventario"
        title="Vehículos"
        description="Gestiona el inventario de vehículos de tu rentadora"
      />

      {/* ── Toggle view ── */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === "table"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ☰ Tabla
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === "cards"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ⊞ Cards
          </button>
        </div>
        <div>
          <button
            onClick={() => openAvailabilityModal(loadVehicles)}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            🔍 Consultar disponibilidad
          </button>
        </div>
      </div>

      {/* ── Table view ── */}
      {viewMode === "table" && (
        <DataTable
          data={vehicles}
          columns={columns}
          pageSize={limit}
          serverSidePagination
          serverSideSearch
          serverSideSort
          currentPage={page}
          onPageChange={setPage}
          onSearchChange={(term) => {
            setPage(1);
            setSearchTerm(term);
          }}
          onSortChange={(key, dir) => {
            setPage(1);
            setOrderBy({ key, direction: dir === "desc" ? "desc" : "asc" });
          }}
          totalPages={totalPages}
          totalItems={totalItems}
          searchPlaceholder="Buscar por placa, marca, modelo..."
          emptyMessage="No hay vehículos registrados"
          createButton={canManage}
          onCreateClick={() => handleCreate(loadVehicles)}
          actions={renderActions}
        />
      )}

      {/* ── Card view ── */}
      {viewMode === "cards" && (
        <CardList
          data={vehicles}
          fields={cardFields}
          title={(v) => (
            <span className="font-mono font-bold tracking-wide">{v.plate}</span>
          )}
          subtitle={(v) => `${v.brand} ${v.model} · ${v.year}`}
          badge={(v) => <StatusBadge status={v.status} />}
          icon={() => "🚗"}
          footer={(v) => renderActions(v)}
          pageSize={limit}
          serverSidePagination
          serverSideSearch
          currentPage={page}
          onPageChange={setPage}
          onSearchChange={(term) => {
            setPage(1);
            setSearchTerm(term);
          }}
          totalPages={totalPages}
          totalItems={totalItems}
          searchPlaceholder="Buscar vehículo..."
          emptyMessage="No hay vehículos registrados"
          createButton={canManage}
          onCreateClick={() => handleCreate(loadVehicles)}
        />
      )}
    </div>
  );
}
