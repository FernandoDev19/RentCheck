import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import { columns } from "./constants/renters.column";
import { useCreateRenter } from "./hooks/useCreateRenter";
import { useRenters } from "./hooks/useRenters";

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
  } = useRenters();
  const { handleCreateClick } = useCreateRenter();

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
        onCreateClick={() => handleCreateClick({ plans, loadRenters })}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <ButtonActionDataTable onClick={() => handleView(row)} color="indigo">Detalles</ButtonActionDataTable>
          </div>
        )}
      />
    </div>
  );
}
