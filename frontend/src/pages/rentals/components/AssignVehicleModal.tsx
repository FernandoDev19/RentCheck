import { useState, useCallback } from "react";
import PaginatedSelect from "../../../common/components/ui/PaginatedSelect";
import Label from "../../../common/components/ui/Label";
import { rentalService } from "../../../services/rental-vehicle.service";
import { vehicleService } from "../../../services/vehicle.service";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../common/types/roles.type";
import type { Rental } from "../../../models/rental.model";

type Props = {
  rental: Rental;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AssignVehicleModal({
  rental,
  onClose,
  onSuccess,
}: Props) {
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loading, setLoading] = useState(false);
  const user = getUser();
  const isOwner = user.role === ROLES.OWNER;

  const loadVehicleOptions = useCallback(
    async (page: number, search: string) => {
      const res = await vehicleService.getAllAvailableByDate({
        page,
        limit: 10,
        search,
        startDate: new Date(rental.startDate).toLocaleDateString("en-CA"),
        endDate: new Date(rental.expectedReturnDate).toLocaleDateString(
          "en-CA",
        ),
        // Si es Owner, filtrar por la misma sede de la renta
        ...(isOwner && (rental.branchId || rental.branch?.id)
          ? { branchId: rental.branchId || rental.branch!.id }
          : {}),
      });
      return {
        data: res.data.map((v) => ({
          value: v.id,
          label: `${v.plate} — ${v.brand} ${v.model}`,
          sublabel: `${v.year} · ${v.color} · $${Number(v.rentalPriceByDay).toLocaleString("es-CO")}/día`,
        })),
        lastPage: res.lastPage,
      };
    },
    [
      isOwner,
      rental.branchId,
      rental.branch,
      rental.startDate,
      rental.expectedReturnDate,
    ],
  );

  const handleAssign = async () => {
    if (!selectedVehicleId) {
      alert("Por favor selecciona un vehículo");
      return;
    }

    setLoading(true);
    try {
      await rentalService.assignVehicle(rental.id, selectedVehicleId);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al asignar vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Asignar Vehículo</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Renta:{" "}
            <span className="font-medium">
              {rental.customer?.name} {rental.customer?.lastName}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Estado:{" "}
            <span className="font-medium text-green-600">
              {rental.rentalStatus}
            </span>
          </p>
        </div>

        <div className="mb-6">
          <Label htmlFor="vehicle">Seleccionar Vehículo*</Label>
          <PaginatedSelect
            id="vehicle"
            placeholder="Seleccionar vehículo disponible..."
            value={selectedVehicleId}
            onChange={setSelectedVehicleId}
            loadOptions={loadVehicleOptions}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || !selectedVehicleId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Asignando..." : "Asignar Vehículo"}
          </button>
        </div>
      </div>
    </div>
  );
}
