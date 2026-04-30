import DataTable from "../../shared/components/datatable/DataTable";
import PageHeader from "../../shared/components/PageHeader";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { useCustomerColumns } from "./hooks/useCustomerColumns";
import { useCustomer } from "./hooks/useCustomer";
import { screenWidth } from "../../shared/helpers/screen-width.helper";
import CardList from "../../shared/components/card-list/CardList";
import { useCustomerFields } from "./hooks/useCustomerFields";
import ButtonCallUp from "../../shared/components/ui/ButtonCallUp";
import { User } from "lucide-react";
import { CUSTOMER_STATUS } from "./interfaces/customer-status.interface";

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
  const { customerFields } = useCustomerFields(loadCustomers);

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Clientes"
        title="Listado de clientes"
        description="Gestiona el historial unificado de todos los clientes"
      />
      {screenWidth.isDesktop || screenWidth.isTablet ? (
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
      ) : (
        <CardList
          data={customers}
          fields={customerFields}
          title={(customer) => customer.name}
          subtitle={(customer) => customer.email}
          badge={(c) => (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold
                  ${c.status === CUSTOMER_STATUS.NORMAL ? "bg-green-100 text-green-700" : c.status === CUSTOMER_STATUS.RED_ALERT ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}
            >
              {c.status}
            </span>
          )}
          icon={() => <User />}
          serverSidePagination
          serverSideSearch
          serverSideSort
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={limit}
          currentPage={page}
          onPageChange={setPage}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar cliente..."
          emptyMessage="No hay clientes registrados"
          footer={(c) => (
            <ButtonCallUp
              type="button"
              isLoading={false}
              onClick={() => handleViewInfo(c)}
            >
              Ver detalle
            </ButtonCallUp>
          )}
        />
      )}
    </div>
  );
}
