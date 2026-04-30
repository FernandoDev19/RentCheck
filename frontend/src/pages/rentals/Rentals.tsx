import DataTable from "../../shared/components/datatable/DataTable";
import PageHeader from "../../shared/components/PageHeader";
import ButtonActionDataTable from "../../shared/components/ui/ButtonActionDataTable";
import { useCreateRental } from "./hooks/useCreateRental";
import { useRentalColumns } from "./hooks/useRentalColumns";
import { useRentals } from "./hooks/useRentals";
import { useViewRental } from "./hooks/useViewRental";
import AssignVehicleModal from "./components/AssignVehicleModal";
import { useState } from "react";
import { Info } from "lucide-react";
import type { Rental } from "../../shared/types/rental.type";


export default function Rentals() {

  const { rentals, limit, totalItems, totalPages, page, setPage, handleSearchChange, handleSortChange, handleReturn, handleDelete, loadRentals } = useRentals();
  const { columns } = useRentalColumns(loadRentals);
  const { handleCreateClick } = useCreateRental();
  const { handleViewDetails } = useViewRental();
  const [selectedRental, setSelectedRental] = useState<Rental | null>();
  const [showAssignModal, setShowAssignModal] = useState(false);

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
          const canAssignVehicle = 
            (row.rentalStatus === "active" || row.rentalStatus === "pending");

          return (
            <div className="flex items-center gap-2">
              {/* El botón nuevo: Siempre visible para todos */}
              <ButtonActionDataTable
                onClick={() => handleViewDetails(row)}
                color="indigo"
              >
                <Info size={16} />
              </ButtonActionDataTable>

              {/* Botón de Asignar Vehículo */}
              {canAssignVehicle && (
                <ButtonActionDataTable
                  onClick={() => {
                    setSelectedRental(row);
                    setShowAssignModal(true);
                  }}
                  color="yellow"
                >
                  Asignar Vehículo
                </ButtonActionDataTable>
              )}

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
                disabled={!isInDebt && row.rentalStatus !== "pending"}
                color="red"
                className="disabled:cursor-not-allowed"
              >
                Cancelar
              </ButtonActionDataTable>
            </div>
          );
        }}
      />
      
      {/* Modal para asignar vehículo */}
      {showAssignModal && selectedRental && (
        <AssignVehicleModal
          rental={selectedRental}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRental(null);
          }}
          onSuccess={() => {
            loadRentals();
            setShowAssignModal(false);
            setSelectedRental(null);
          }}
        />
      )}
    </div>
  );
}
