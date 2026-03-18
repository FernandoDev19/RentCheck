import withReactContent from "sweetalert2-react-content";
import { catchError } from "../../../common/errors/catch-error";
import { vehicleService } from "../../../services/vehicle.service";
import VehicleForm from "../components/VehicleForm";
import Swal from "sweetalert2";
import { CreateVehicleSchema } from "../schemas/create-vehicle.schema";
import type { VehicleErrors } from "../interfaces/vehicle-errors.interface";

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

export const useCreateVehicle = () => {
  const handleCreate = async (loadVehicles: () => Promise<void> | void) => {
    const { isConfirmed, value } = await MySwal.fire({
      title: "➕ Nuevo vehículo",
      html: <VehicleForm />,
      width: 560,
      showCancelButton: true,
      confirmButtonText: "Crear vehículo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      focusConfirm: false,
      preConfirm: () => {
        const currentValues = getVehicleFormValues();

        const result = CreateVehicleSchema.safeParse(currentValues);

        if (!result.success) {
          const errorObj: VehicleErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof VehicleErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <VehicleForm
                currentValues={currentValues}
                errors={errorObj}
              />
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
      await vehicleService.create(value);
      MySwal.fire({
        title: "✅ Vehículo creado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadVehicles();
    } catch (error) {
      await catchError(error, MySwal, "Error al crear vehículo");
    }
  };

  return {
    handleCreate,
  };
};
