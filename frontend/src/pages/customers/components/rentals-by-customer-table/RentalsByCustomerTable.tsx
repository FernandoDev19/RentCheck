import DataTable from "../../../../shared/components/datatable/DataTable";
import ButtonActionDataTable from "../../../../shared/components/ui/ButtonActionDataTable";
import { rentalsByCustomerColumns } from "./constants/rentals-by-customer.columns";
import { useRentalsByCustomerTable } from "./hooks/useRentalsByCustomerTable";
import { useViewRentalInfo } from "./hooks/useViewRentalInfo";

export default function RentalsByCustomerTable({
  customerId,
}: {
  customerId: string;
}) {
  const { rentals, limit, page, setPage, totalPages, totalItems, handleSearchChange, handleSortChange } = useRentalsByCustomerTable(customerId);
  const { handleViewRentalInfo } = useViewRentalInfo();

  return (
    <DataTable
      data={rentals}
      columns={rentalsByCustomerColumns}
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
      searchPlaceholder="Buscar renta..."
      emptyMessage="Sin rentas registradas"
      actions={(r) => (
        <ButtonActionDataTable onClick={() => handleViewRentalInfo(r.id)} color="indigo">Ver info</ButtonActionDataTable>
      )}
    />
  );
}
