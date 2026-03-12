import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import { branchesColumns } from "./constants/branches.columns.tsx";
import { useBranches } from "./hooks/useBranches";
import { useCreateBranch } from "./hooks/useCreateBranch.tsx";


export default function Branches() {
  const { branches, limit, totalPages, totalItems, page, setPage, handleSearchChange, handleSortChange, handleView, loadBranches } = useBranches();
  const { handleCreateClick } = useCreateBranch();

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Sedes"
        title="Gestión de Sedes"
        description="Administra las sedes de tu empresa"
      />
      <DataTable
        data={branches}
        columns={branchesColumns}
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
        onCreateClick={() => handleCreateClick(loadBranches)}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <ButtonActionDataTable onClick={() => handleView(row)} color="indigo">Ver info</ButtonActionDataTable>
          </div>
        )}
      />
    </div>
  );
}
