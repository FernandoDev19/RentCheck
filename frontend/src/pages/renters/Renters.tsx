import { Edit, Info, Trash } from "lucide-react";
import DataTable from "../../shared/components/datatable/DataTable";
import PageHeader from "../../shared/components/PageHeader";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { columns } from "./constants/renters.column";
import { useCreateRenter } from "./hooks/useCreateRenter";
import { useRenters } from "./hooks/useRenters";
import { useEditRenter } from "./hooks/useEditRenter";
import { RENTER_STATUS } from "../../shared/types/renter.type";
import { getUser } from "../dashboard/helpers/user.helper";
import { ROLES } from "../../shared/types/role.type";

export default function Renters() {
  const {
    renters,
    plans,
    loadRenters,
    limit,
    page,
    setPage,
    totalPages,
    totalItems,
    handleSearchChange,
    handleSortChange,
    handleView,
    handleDelete,
  } = useRenters();
  const { handleCreateClick } = useCreateRenter();
  const { handleEdit } = useEditRenter();
  const userRole = getUser().role;

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
          handleSortChange(key, direction ?? "desc")
        }
        totalPages={totalPages}
        totalItems={totalItems}
        searchPlaceholder="Buscar rentadora..."
        emptyMessage="No hay rentadoras registradas"
        createButton={true}
        onCreateClick={() => handleCreateClick({ plans, loadRenters })}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <ButtonActionDataTable
              id={`view-renter-${row.id}`}
              onClick={() => handleView(row)}
              color="indigo"
            >
              <Info size={20} />
            </ButtonActionDataTable>

            {userRole === ROLES.ADMIN && (
              <>
                <ButtonActionDataTable
                  id={`edit-renter-${row.id}`}
                  onClick={() =>
                    handleEdit({ plans, loadRenters, renterId: row.id })
                  }
                  color="green"
                >
                  <Edit size={16} />
                </ButtonActionDataTable>

                {row.status !== RENTER_STATUS.SUSPENDED && (
                  <ButtonActionDataTable
                    id={`delete-renter-${row.id}`}
                    onClick={() => handleDelete(row.id)}
                    color="red"
                  >
                    <Trash size={16} />
                  </ButtonActionDataTable>
                )}
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}
