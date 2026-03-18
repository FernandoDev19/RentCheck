import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CreateRenterForm from "../components/CreateRenterForm";
import type { RenterErrors } from "../interfaces/renter-errors.interface";
import { renterService } from "../../../services/renter.service";
import { catchError } from "../../../common/errors/catch-error";
import type { Plan } from "../../../models/plan.model";
import type { Renter } from "../../../models/renter.model";
import { editRenterSchema } from "../schemas/edit-renter.schema";

const MySwal = withReactContent(Swal);

export const useEditRenter = () => {
  const handleEdit = async ({
    plans,
    loadRenters,
    renterId
  }: {
    plans: Plan[];
    loadRenters: () => Promise<void> | void;
    renterId: string;
  }) => {
    let renter: Renter | undefined;
    
    try {
        renter = await renterService.findOne(renterId);
    } catch (error) {
        await catchError(error, MySwal, "Error al obtener a la rentadora");
    }

    if (!renter) {
        await MySwal.fire({
            title: "Error",
            text: "No se pudo obtener la rentadora",
            icon: "error",
        });
        return;
    }

    MySwal.fire({
      title: "Editar rentadora",
      html: <CreateRenterForm plans={plans} renter={renter} />,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Editar Rentadora",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const currentValues = {
          name: (document.getElementById("swal-name") as HTMLInputElement)
            .value,
          nit: (document.getElementById("swal-nit") as HTMLInputElement).value,
          address:
            (document.getElementById("swal-address") as HTMLInputElement)
              .value || undefined,
          city:
            (document.getElementById("swal-city") as HTMLInputElement).value ||
            undefined,
          email: (document.getElementById("swal-email") as HTMLInputElement)
            .value,
          phone: (document.getElementById("swal-phone") as HTMLInputElement)
            .value,
          legalRepresentative: (
            document.getElementById(
              "swal-legal-representative",
            ) as HTMLInputElement
          ).value,
          planId: (document.getElementById("swal-plan") as HTMLInputElement)
            .value,
          planExpiresAt:
            (
              document.getElementById(
                "swal-expiration-date",
              ) as HTMLInputElement
            ).value || undefined,
          balance: (document.getElementById("swal-balance") as HTMLInputElement)
            .value,
          lowBalanceThreshold: (
            document.getElementById(
              "swal-balance-threshold",
            ) as HTMLInputElement
          ).value,
          lowBalanceAlertEnabled: (
            document.getElementById(
              "swal-low-balance-alert",
            ) as HTMLInputElement
          ).checked,
          status: (document.getElementById("swal-status") as HTMLInputElement)
            .value,
        };

        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const nit = (document.getElementById("swal-nit") as HTMLInputElement)
          .value;
        const address =
          (document.getElementById("swal-address") as HTMLInputElement).value ||
          undefined;
        const city =
          (document.getElementById("swal-city") as HTMLInputElement).value ||
          undefined;
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        ).value;
        const legalRepresentative = (
          document.getElementById(
            "swal-legal-representative",
          ) as HTMLInputElement
        ).value;
        const planId = (
          document.getElementById("swal-plan") as HTMLInputElement
        ).value;
        const planExpiresAt =
          (document.getElementById("swal-expiration-date") as HTMLInputElement)
            .value || undefined;
        const balance = (
          document.getElementById("swal-balance") as HTMLInputElement
        ).value;
        const lowBalanceThreshold = (
          document.getElementById("swal-balance-threshold") as HTMLInputElement
        ).value;
        const lowBalanceAlertEnabled = (
          document.getElementById("swal-low-balance-alert") as HTMLInputElement
        ).checked;
        const status = (
          document.getElementById("swal-status") as HTMLInputElement
        ).value;

        const parsedLowBalanceThreshold =
          lowBalanceThreshold === "" ? undefined : Number(lowBalanceThreshold);
        const parsedPlanExpiresAt =
          planExpiresAt === "" ? undefined : planExpiresAt;
        const parsedStatus = status === "" ? undefined : status;

        const result = editRenterSchema.safeParse({
          nit,
          name,
          address,
          city,
          email,
          legalRepresentative,
          phone,
          planId: Number(planId),
          planExpiresAt: parsedPlanExpiresAt,
          balance: Number(balance),
          lowBalanceThreshold: parsedLowBalanceThreshold,
          lowBalanceAlertEnabled,
          status: parsedStatus,
        });

        if (!result.success) {
          const errorObj: RenterErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof RenterErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <CreateRenterForm
                plans={plans}
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
    }).then((result) => {
      if (result.isConfirmed) {
        renterService
          .editRenter(renter.id, result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Editado!",
              text: "La rentadora ha sido editada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadRenters();
          })
          .catch(async (error) => {
            await catchError(error, MySwal, "Error al crear la rentadora");
          });
      }
    });
  };

  return {
    handleEdit,
  };
};
