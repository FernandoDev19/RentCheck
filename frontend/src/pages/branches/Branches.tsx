import { useParams } from "react-router";
import CardList from "../../common/components/card-list/CardList.tsx";
import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import ButtonCallUp from "../../common/components/ui/ButtonCallUp.tsx";
import { screenWidth } from "../../common/helpers/screen-width.helper.ts";
import { branchesColumns } from "./constants/branches.columns.tsx";
import { BranchesField } from "./constants/branches.fields.tsx";
import { useBranches } from "./hooks/useBranches";
import { useCreateBranch } from "./hooks/useCreateBranch.tsx";
import { useEditBranch } from "./hooks/useEditBranch.tsx";
import { getUser } from "../dashboard/helpers/user.helper.ts";
import { Edit, Trash2 } from "lucide-react";
import { ROLES } from "../../common/types/roles.type.ts";

export default function Branches() {
  const { renterId } = useParams<{ renterId: string | undefined }>();

  const {
    branches,
    limit,
    totalPages,
    totalItems,
    page,
    setPage,
    handleSearchChange,
    handleSortChange,
    handleView,
    loadBranches,
    handleDelete,
    isLoading,
  } = useBranches(renterId);
  const { handleCreateClick } = useCreateBranch();
  const { handleEdit } = useEditBranch();
  const userRole = getUser().role;

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Sedes"
        title="Gestión de Sedes"
        description="Administra las sedes de tu empresa"
      />
      {screenWidth.isDesktop || screenWidth.isTablet ? (
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
              <ButtonActionDataTable
                onClick={() => handleView(row)}
                color="indigo"
              >
                Ver info
              </ButtonActionDataTable>
              {userRole === ROLES.OWNER && (
                <>
                  <ButtonActionDataTable
                    onClick={() => handleEdit(loadBranches, row.id)}
                    color="green"
                  >
                    <Edit size={16} />
                  </ButtonActionDataTable>

                  <ButtonActionDataTable
                    onClick={() => handleDelete(row.id)}
                    color="red"
                  >
                    <Trash2 size={16} />
                  </ButtonActionDataTable>
                </>
              )}
            </div>
          )}
        />
      ) : (
        <CardList
          data={branches}
          fields={BranchesField}
          title={(branch) => branch.name}
          subtitle={(branch) => branch.email}
          pageSize={limit}
          currentPage={page}
          serverSidePagination
          serverSideSearch
          serverSideSort
          onPageChange={setPage}
          badge={(c) => (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${c.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            >
              {c.status ? "Activo" : "Inactivo"}
            </span>
          )}
          icon={() => "🏢"}
          onClick={(c) => handleView(c)}
          onCreateClick={() => handleCreateClick(loadBranches)}
          totalPages={totalPages}
          totalItems={totalItems}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar sede..."
          emptyMessage="No hay sedes registradas"
          createButton={true}
          footer={(c) => (
            <>
              <ButtonCallUp
                type="button"
                isLoading={isLoading}
                onClick={() => handleView(c)}
              >
                Ver detalle
              </ButtonCallUp>
              {userRole === ROLES.OWNER && (
                <>
                  <ButtonActionDataTable
                    onClick={() => handleEdit(loadBranches, c.id)}
                    color="green"
                  >
                    <Edit size={16} />
                  </ButtonActionDataTable>
                  <ButtonActionDataTable
                    onClick={() => handleDelete(c.id)}
                    color="red"
                  >
                    <Trash2 size={16} />
                  </ButtonActionDataTable>
                </>
              )}
            </>
          )}
        />
      )}
    </div>
  );
}
