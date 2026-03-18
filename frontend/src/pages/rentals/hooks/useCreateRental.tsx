import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../models/customer.model";
import { customerService } from "../../../services/customer.service";
import { catchError } from "../../../common/errors/catch-error";
import { createRentalAndCustomerSchema } from "../schemas/create-rental-and-customer.schema";
import { rentalService } from "../../../services/rental.service";
import CreateRentalForm from "../components/CreateRentalForm";
import type { RentalErrors } from "../interfaces/rental-errors.interface";
import { CUSTOMER_STATUS_LABELS } from "../../customers/constants/customer-status-label";
import { getUser } from "../../dashboard/helpers/user.helper";
import { ROLES } from "../../../common/types/roles.type";
import { createRentalSchema } from "../schemas/create-rental.schema";

const MySwal = withReactContent(Swal);

export const useCreateRental = () => {

  const user = getUser();
  const userRoleOwner = user.role === ROLES.OWNER;

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
       const rentalsWithCriticalFlags =
        existingCustomer.rentals
          ?.filter((rental) => rental.rentalFeedback?.criticalFlags)
          .filter((rental) => {
            const flags = rental?.rentalFeedback!.criticalFlags;
            return flags.vehicleTheft || flags.impersonation;
          }) ?? [];

      const flagLabels: Record<string, string> = {
        vehicleTheft: "🚗 Robo de vehículo",
        impersonation: "🪪 Suplantación de identidad",
      };

      const flagSummary: Record<
        string,
        { count: number; cities: Set<string> }
      > = {};

      for (const rental of rentalsWithCriticalFlags) {
        const flags = rental?.rentalFeedback!.criticalFlags;
        const city =
          rental.branch?.city ?? rental.renter?.city ?? rental.renter.name ?? "Ciudad desconocida";

        for (const [key, active] of Object.entries(flags)) {
          if (!active) continue;
          if (!flagSummary[key])
            flagSummary[key] = { count: 0, cities: new Set() };
          flagSummary[key].count++;
          flagSummary[key].cities.add(city);
        }
      }

      const flagsHtml = Object.entries(flagSummary)
        .map(
          ([key, { count, cities }]) => `
            <li style="margin-bottom:8px;">
              <span style="font-weight:700;">${flagLabels[key] ?? key}</span>
              <span style="font-weight:400; color:#9b1c1c;">
                — ${count} ${count === 1 ? "vez" : "veces"}
              </span>
              <div style="font-size:11px; color:#b91c1c; margin-top:2px;">
                📍 ${[...cities].join(", ")}
              </div>
            </li>
          `,
        )
        .join("");

      // Mostrar advertencia ANTES del swal de crear renta
      const { isConfirmed } = await MySwal.fire({
        title: "⚠️ Cliente en alerta",
        html: `
            <p style="color:#6b7280; margin-bottom:12px; font-size:13px;">
              Estado: <strong style="color:#dc2626">${CUSTOMER_STATUS_LABELS[existingCustomer.status]}</strong>
              — reportado en <strong>${rentalsWithCriticalFlags.length}</strong> ${rentalsWithCriticalFlags.length === 1 ? "renta" : "rentas"}
            </p>
            <ul style="text-align:left; list-style:none; padding:12px 16px; margin:0;
              background:#fee2e2; border-radius:8px; color:#dc2626;">
              ${flagsHtml}
            </ul>
          `,
        icon: "warning",
        confirmButtonText: "Entendido, continuar",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
      });

      if (!isConfirmed) return; // Decidió no proceder
    }

    MySwal.fire({
      title: existingCustomer ? "Cliente encontrado" : "Nuevo Cliente",
      html: (
        <CreateRentalForm
          customer={existingCustomer || null}
          identityNumber={idData!}
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
          branchId: (document.getElementById('swal-branch') as HTMLSelectElement)
            ?.value || ""
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
        const branchId = userRoleOwner
        ? (document.getElementById('swal-branch') as HTMLSelectElement)?.value || ""
        : undefined;

        let result;
        
        if (!existingCustomer) {
          result = createRentalAndCustomerSchema.safeParse({
            name,
            lastName,
            identityType,
            identityNumber,
            email,
            phone,
            startDate,
            expectedReturnDate,
            branchId
          });
        }else {
          result = createRentalSchema.safeParse({
            startDate,
            expectedReturnDate,
            branchId
          });
        }

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
                identityNumber={idData!}
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
