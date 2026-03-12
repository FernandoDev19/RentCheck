import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../models/customer.model";
import { customerService } from "../../../services/customer.service";
import { catchError } from "../../../common/errors/catch-error";
import { createRentalSchema } from "../schemas/rental.schema";
import { rentalService } from "../../../services/rental.service";
import CreateRentalForm from "../components/CreateRentalForm";
import type { RentalErrors } from "../interfaces/rental-errors.interface";

const MySwal = withReactContent(Swal);

export const useCreateRental = () => {

  const handleCreateClick = async (loadRentals: () => Promise<void> | void, identityNumber?: string) => {
    let idData = identityNumber;
    
    if (!idData) {
      const { value: identityData, isConfirmed } = await MySwal.fire({
        title: "Identificar Cliente",
        html: `
                <input id="swal-id" class="swal2-input" placeholder="Número de cédula/NIT">
              `,
        confirmButtonText: "Verificar",
        showCancelButton: true,
        preConfirm: () => {
          const val = (
            document.getElementById("swal-id") as HTMLInputElement
          ).value.trim();

          if (!val) {
            MySwal.showValidationMessage("Ingresa un número de identificación");
            return false;
          }
          return val;
        },
      });

      if (!isConfirmed || !identityData) return;

      idData = identityData.trim();
    }

    let existingCustomer: Customer | null = null;
    try {
      existingCustomer = await customerService.findByIdentity(idData!);
    } catch (e) {
      await catchError(e, MySwal, "Error al buscar cliente");
    }

    if (
      existingCustomer &&
      existingCustomer.status !== "normal" &&
      existingCustomer.status !== "yellow_alert"
    ) {
      // Recopilar qué critical flags están activos
      const activeFlags = existingCustomer.rentals
        ?.flatMap((rental) => rental.rentalFeedback)
        ?.flatMap((fb) => Object.entries(fb?.criticalFlags ?? {}))
        .filter(([_, value]) => value === true)
        .map(([key]) => key);

      const flagLabels: Record<string, string> = {
        vehicleTheft: "🚗 Robo de vehículo",
        impersonation: "🪪 Suplantación de identidad",
        // agrega más si tienes
      };

      const flagsHtml = activeFlags?.length
        ? activeFlags.map((f) => `<li>${flagLabels[f] ?? f}</li>`).join("")
        : "<li>Sin flags específicos</li>";

      // Mostrar advertencia ANTES del swal de crear renta
      const { isConfirmed } = await Swal.fire({
        title: "⚠️ Cliente en alerta",
        html: `
              <p style="color:#6b7280; margin-bottom:12px;">
                Este cliente tiene estado <strong style="color:#dc2626">${existingCustomer.status}</strong>.
                Se han reportado los siguientes flags críticos:
              </p>
              <ul style="text-align:left; color:#dc2626; font-weight:600; list-style:none; padding:0; 
                background:#fee2e2; border-radius:8px; padding:12px 16px; margin:0;">
                ${flagsHtml}
              </ul>
              <p style="color:#6b7280; margin-top:12px; font-size:13px;">
                ¿Deseas continuar con la creación de la renta?
              </p>
            `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!isConfirmed) return; // El empleado decidió no proceder
    }

    MySwal.fire({
      title: existingCustomer ? "Cliente encontrado" : "Nuevo Cliente",
      html: (
        <CreateRentalForm
          customer={existingCustomer || null}
          identityNumber={idData}
        />
      ),
      width: 600,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear renta",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const currentValues = {
          name:
            (document.getElementById("swal-name") as HTMLInputElement)?.value ||
            "",
          lastName:
            (document.getElementById("swal-lastName") as HTMLInputElement)
              ?.value || "",
          identityType:
            (document.getElementById("swal-identityType") as HTMLSelectElement)
              ?.value || "",
          identityNumber:
            (document.getElementById("swal-identityNumber") as HTMLInputElement)
              ?.value || idData,
          email:
            (document.getElementById("swal-email") as HTMLInputElement)
              ?.value || "",
          phone:
            (document.getElementById("swal-phone") as HTMLInputElement)
              ?.value || "",
          startDate:
            (document.getElementById("swal-startDate") as HTMLInputElement)
              ?.value || "",
          expectedReturnDate:
            (
              document.getElementById(
                "swal-expectedReturnDate",
              ) as HTMLInputElement
            )?.value || "",
        };

        const name = existingCustomer
          ? existingCustomer.name
          : (document.getElementById("swal-name") as HTMLInputElement).value;
        const lastName = existingCustomer
          ? existingCustomer.lastName
          : (document.getElementById("swal-lastName") as HTMLInputElement)
              .value;
        const identityType = existingCustomer
          ? existingCustomer.identityType
          : (document.getElementById("swal-identityType") as HTMLSelectElement)
              .value || undefined;
        const identityNumber = existingCustomer
          ? existingCustomer.identityNumber
          : (document.getElementById("swal-identityNumber") as HTMLInputElement)
              .value;
        const email = existingCustomer
          ? existingCustomer.email || undefined
          : (document.getElementById("swal-email") as HTMLInputElement).value ||
            undefined;
        const phone = existingCustomer
          ? existingCustomer.phone || undefined
          : (document.getElementById("swal-phone") as HTMLInputElement).value ||
            undefined;
        const startDate = (
          document.getElementById("swal-startDate") as HTMLInputElement
        ).value;
        const expectedReturnDate = (
          document.getElementById("swal-expectedReturnDate") as HTMLInputElement
        ).value;

        const result = createRentalSchema.safeParse({
          name,
          lastName,
          identityType,
          identityNumber,
          email,
          phone,
          startDate,
          expectedReturnDate,
        });

        if (!result.success) {
          const errorObj: RentalErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof RentalErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <CreateRentalForm
                customer={existingCustomer || null}
                currentValues={currentValues}
                identityNumber={idData}
                errors={errorObj}
              />
            ),
          });

          MySwal.showValidationMessage("Revisa los campos marcados en rojo");
          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        rentalService
          .createRentalManually(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "La renta ha sido creada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadRentals();
          })
          .catch(async (error) => {
            await catchError(error, MySwal, "Error al crear la renta");
          });
      }
    });
  };

  return {
    handleCreateClick,
  };
};
