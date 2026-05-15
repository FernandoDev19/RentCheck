import { Edit, Trash2 } from "lucide-react";
import DataTable from "../../shared/components/datatable/DataTable";
import PageHeader from "../../shared/components/PageHeader";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { ROLES } from "../../shared/types/role.type";
import { getUser } from "../dashboard/helpers/user.helper";
import { columns } from "./constants/employee.columns";
import { useCreateEmployee } from "./hooks/useCreateEmployee";
import { useEmployees } from "./hooks/useEmployees";
import { useEditEmployee } from "./hooks/useEditEmployee";

export default function Employees() {
  const {
    employees,
    limit,
    page,
    setPage,
    handleSearchChange,
    handleSortChange,
    totalPages,
    totalItems,
    loadEmployees,
    handleDelete,
  } = useEmployees();
  const { handleCreateClick } = useCreateEmployee();
  const { handleEdit } = useEditEmployee();

  const userRole = getUser().role;
  const userRoleManagerOrOwner =
    userRole === ROLES.MANAGER || userRole === ROLES.OWNER;

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
        createButton={userRole !== ROLES.ADMIN}
        onCreateClick={() => handleCreateClick(loadEmployees)}
        actions={
          userRoleManagerOrOwner
            ? (r) => (
                <>
                  {userRoleManagerOrOwner && (
                    <>
                      <ButtonActionDataTable
                        id={`edit-employee-${r.id}`}
                        onClick={() => handleEdit(loadEmployees, r)}
                        color="green"
                      >
                        <Edit size={16} />
                      </ButtonActionDataTable>
                      <ButtonActionDataTable
                        id={`delete-employee-${r.id}`}
                        onClick={() => handleDelete(r.id)}
                        color="red"
                      >
                        <Trash2 size={16} />
                      </ButtonActionDataTable>
                    </>
                  )}
                </>
              )
            : undefined
        }
      />
    </div>
  );
}
