import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import { columns } from "./constants/employee.columns";
import { useCreateEmployee } from "./hooks/useCreateEmployee";
import { useEmployees } from "./hooks/useEmployees";

export default function Employees() {
  const {employees, limit, page, setPage, handleSearchChange, handleSortChange, totalPages, totalItems, loadEmployees} = useEmployees();
  const { handleCreateClick } = useCreateEmployee();

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
        onCreateClick={() => handleCreateClick(loadEmployees)}
      />
    </div>
  );
}
