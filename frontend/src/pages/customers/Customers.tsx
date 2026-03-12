import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import { useCustomerColumns } from "./hooks/useCustomerColumns";
import { useCustomer } from "./hooks/useCustomer";

export default function Customers() {
  const {
    customers,
    limit,
    page,
    setPage,
    handleSearchChange,
    handleSortChange,
    totalPages,
    totalItems,
    handleViewInfo,
    loadCustomers,
  } = useCustomer();

  const { columns } = useCustomerColumns(loadCustomers);

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Clientes"
        title="Listado de clientes"
        description="Gestiona el historial unificado de todos los clientes"
      />
      <DataTable
        data={customers}
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
        searchPlaceholder="Buscar cliente..."
        emptyMessage="No hay clientes registrados"
        actions={(row) => (
          <div className="flex items-center gap-2">
            <ButtonActionDataTable
              onClick={() => handleViewInfo(row)}
              color="indigo"
            >
              Ver info
            </ButtonActionDataTable>
          </div>
        )}
      />
    </div>
  );
}
