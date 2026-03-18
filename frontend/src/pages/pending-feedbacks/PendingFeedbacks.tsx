import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import { useViewRental } from "../rentals/hooks/useViewRental";
import { columns } from "./constants/pending-feedbacks.columns";
import { useCreateFeedback } from "./hooks/useCreateFeedback";
import { usePendingFeedbacks } from "./hooks/usePendingFeedbacks";
export default function PendingFeedbacks() {
  const {
    rentals,
    limit,
    page,
    setPage,
    handleSearchChange,
    handleSortChange,
    totalPages,
    totalItems,
    loadRentals,
  } = usePendingFeedbacks();
  const { handleFeedback } = useCreateFeedback();

  const { handleViewDetails } = useViewRental();

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Feedbacks"
        title="Feedbacks pendientes"
        description="Rentas devueltas que aún no han sido calificadas"
      />

      <DataTable
        data={rentals}
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
        searchPlaceholder="Buscar por cliente, rentadora, sede..."
        emptyMessage="No hay rentas pendientes de feedback 🎉"
        actions={(row) => (
          <div className="flex items-center gap-2">
            <ButtonActionDataTable
              onClick={() => handleFeedback(row, loadRentals)}
              color="indigo"
            >
              ✍️ Dar feedback
            </ButtonActionDataTable>
            <ButtonActionDataTable
              onClick={() => handleViewDetails(row)}
              color="indigo"
            >
              Detalles
            </ButtonActionDataTable>
          </div>
        )}
      />
    </div>
  );
}
