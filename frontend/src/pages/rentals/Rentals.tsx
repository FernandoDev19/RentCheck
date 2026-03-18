import DataTable from "../../common/components/datatable/DataTable";
import PageHeader from "../../common/components/PageHeader";
import ButtonActionDataTable from "../../common/components/ui/ButtonActionDataTable";
import { useCreateRental } from "./hooks/useCreateRental";
import { useRentalColumns } from "./hooks/useRentalColumns";
import { useRentals } from "./hooks/useRentals";
import { useViewRental } from "./hooks/useViewRental";


export default function Rentals() {

  const { rentals, limit, totalItems, totalPages, page, setPage, handleSearchChange, handleSortChange, handleReturn, handleDelete, loadRentals } = useRentals();
  const { columns } = useRentalColumns(loadRentals);
  const { handleCreateClick } = useCreateRental();
  const { handleViewDetails } = useViewRental();

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Rentas"
        title="Listado de rentas"
        description="Gestiona el historial de todas las rentas"
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
          handleSortChange(key, direction ?? "desc")
        }
        totalPages={totalPages}
        totalItems={totalItems}
        searchPlaceholder="Buscar renta..."
        emptyMessage="No hay rentas registradas"
        createButton={true}
        onCreateClick={() => handleCreateClick(loadRentals)}
        actions={(row) => {
          const isInDebt =
            row.rentalStatus === "active" || row.rentalStatus === "late";

          return (
            <div className="flex items-center gap-2">
              {/* El botón nuevo: Siempre visible para todos */}
              <ButtonActionDataTable
                onClick={() => handleViewDetails(row)}
                color="indigo"
              >
                Detalles
              </ButtonActionDataTable>

              {/* Botón de Devolución */}
              {isInDebt && (
                <ButtonActionDataTable
                  onClick={() => handleReturn(row)}
                  color="green"
                >
                  Recibir
                </ButtonActionDataTable>
              )}

              {/* Botón de Cancelar */}
              <ButtonActionDataTable
                onClick={() => handleDelete(row)}
                disabled={!isInDebt}
                color="red"
              >
                Cancelar
              </ButtonActionDataTable>
            </div>
          );
        }}
      />
    </div>
  );
}
