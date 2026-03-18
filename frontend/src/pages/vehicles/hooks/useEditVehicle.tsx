import withReactContent from "sweetalert2-react-content";
import { catchError } from "../../../common/errors/catch-error";
import { vehicleService } from "../../../services/vehicle.service";
import VehicleForm from "../components/VehicleForm";
import Swal from "sweetalert2";
import type { VehicleErrors } from "../interfaces/vehicle-errors.interface";
import type { Vehicle } from "../../../models/Vehicle.model";
import { EditVehicleSchema } from "../schemas/edit-vehicle.schema";

const getVehicleFormValues = () => ({
  plate: (document.getElementById("v-plate") as HTMLInputElement).value
    .trim()
    .toUpperCase(),
  brand: (document.getElementById("v-brand") as HTMLInputElement).value.trim(),
  model: (document.getElementById("v-model") as HTMLInputElement).value.trim(),
  year: parseInt((document.getElementById("v-year") as HTMLInputElement).value),
  color: (document.getElementById("v-color") as HTMLInputElement).value.trim(),
  insuredValue:
    parseFloat(
      (document.getElementById("v-insuredValue") as HTMLInputElement).value,
    ) || undefined,
  photos: (document.getElementById("v-photos") as HTMLTextAreaElement).value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),
});

const MySwal = withReactContent(Swal);

export const useEditVehicle = () => {
  const handleEdit = async (loadVehicles: () => Promise<void> | void, vehicle: Vehicle) => {
    const { isConfirmed, value } = await MySwal.fire({
      title: `✏️ Editar — ${vehicle.plate}`,
      html: <VehicleForm vehicle={vehicle} />,
      width: 560,
      showCancelButton: true,
      confirmButtonText: "Guardar cambios",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      focusConfirm: false,
      preConfirm: () => {
        const currentValues = getVehicleFormValues();

        const result = EditVehicleSchema.safeParse(currentValues);

        if (!result.success) {
          const errorObj: VehicleErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof VehicleErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <VehicleForm currentValues={currentValues} errors={errorObj} />
            ),
          });

          MySwal.showValidationMessage("Revisa los campos marcados en rojo");

          return false;
        }
        return result.data;
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await vehicleService.update(vehicle.id, value);
      MySwal.fire({
        title: "✅ Vehículo editado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadVehicles();
    } catch (error) {
      await catchError(error, MySwal, "Error al editar vehículo");
    }
  };

  return {
    handleEdit,
  };
};
