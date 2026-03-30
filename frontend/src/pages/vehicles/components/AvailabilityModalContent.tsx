import { useCallback, useState } from "react";
import type { Vehicle } from "../../../models/Vehicle.model";
import { useCreateRental } from "../../rentals/hooks/useCreateRental";
import { vehicleService } from "../../../services/vehicle.service";
import { catchError } from "../../../common/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import DatePickerForm from "./DatePickerForm";
import VehicleCard from "./VehicleCard";
import { useViewDetails } from "../hooks/useViewDetails";

const MySwal = withReactContent(Swal);

export default function AvailabilityModalContent({
  onClose,
  onRentalCreated,
}: {
  onClose: () => void;
  onRentalCreated: () => void;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentDates, setCurrentDates] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { handleCreateClick } = useCreateRental();
  const { handleViewDetail } = useViewDetails();

  const search = useCallback(async (startDate: string, endDate: string, p = 1) => {
    setLoading(true);
    setCurrentDates({ startDate, endDate });
    try {
      const res = await vehicleService.getAllAvailableByDate({
        page: p,
        limit: 6,
        startDate,
        endDate,
      });
      setVehicles(res.data);
      setTotalPages(res.lastPage);
      setTotalItems(res.total);
      setPage(p);
      setSearched(true);
    } catch (error) {
      await catchError(error, MySwal, "Error al buscar vehículos");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateRental = async (vehicle: Vehicle) => {
    onClose();
    await handleCreateClick(onRentalCreated, undefined, {
      vehicleId: vehicle.id,
      startDate: currentDates.startDate,
      endDate: currentDates.endDate,
    });
  };

  return (
    <div className="text-left">
      {/* Date picker */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
        <DatePickerForm onSearch={search} loading={loading} />
      </div>

      {/* Results */}
      {searched && !loading && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500">
              {totalItems === 0
                ? "Sin vehículos disponibles para esas fechas"
                : `${totalItems} vehículo${totalItems !== 1 ? "s" : ""} disponible${totalItems !== 1 ? "s" : ""}`}
            </p>
            {currentDates.startDate && (
              <p className="text-[11px] text-slate-400">
                {new Date(currentDates.startDate + "T12:00:00").toLocaleDateString("es-CO")} →{" "}
                {new Date(currentDates.endDate + "T12:00:00").toLocaleDateString("es-CO")}
              </p>
            )}
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-5xl block mb-3">🔍</span>
              <p className="text-slate-500 text-sm">
                No hay vehículos disponibles para las fechas seleccionadas.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {vehicles.map((v) => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    startDate={currentDates.startDate}
                    endDate={currentDates.endDate}
                    onCreateRental={handleCreateRental}
                    onViewDetail={handleViewDetail}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => search(currentDates.startDate, currentDates.endDate, page - 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg
                      disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs text-slate-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => search(currentDates.startDate, currentDates.endDate, page + 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg
                      disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}