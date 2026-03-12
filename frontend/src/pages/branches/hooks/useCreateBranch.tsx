import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CreateBranchForm from "../components/CreateBranchForm";
import { createBranchSchema } from "../schemas/branch.schema";
import type { BranchErrors } from "../interfaces/branch-errors.interface";
import { branchService } from "../../../services/branch.service";
import { catchError } from "../../../common/errors/catch-error";
const MySwal = withReactContent(Swal);

export const useCreateBranch = () => {

  const handleCreateClick = async (loadBranches: () => Promise<void> | void) => {
    MySwal.fire({
      title: "Crear nueva Sede",
      html: <CreateBranchForm />,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear sede",
      confirmButtonColor: "var(--color-primary)",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const currentValues = {
          name: (document.getElementById("swal-name") as HTMLInputElement)
            .value || "",
          city: (document.getElementById("swal-city") as HTMLInputElement)
            .value || "",
          address: (
            document.getElementById("swal-address") as HTMLInputElement
          ).value || "",
          phone: (
            document.getElementById("swal-phone") as HTMLInputElement
          ).value || "",
          responsible: (
            document.getElementById("swal-responsible") as HTMLInputElement
          ).value || "",
          responsiblePhone: (
            document.getElementById("swal-responsible-phone") as HTMLInputElement
          ).value || "",
          email: (
            document.getElementById("swal-email") as HTMLInputElement
          ).value || "",
          password: (
            document.getElementById("swal-password") as HTMLInputElement
          ).value || "",
          status: (
            document.getElementById("swal-status") as HTMLSelectElement
          ).value || "",
        };

        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const city = (document.getElementById("swal-city") as HTMLInputElement)
          .value;
        const address = (
          document.getElementById("swal-address") as HTMLInputElement
        ).value;
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        ).value;
        const responsible = (
          document.getElementById("swal-responsible") as HTMLInputElement
        ).value;
        const responsiblePhone = (
          document.getElementById("swal-responsible-phone") as HTMLInputElement
        ).value;
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        const password = (
          document.getElementById("swal-password") as HTMLInputElement
        ).value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        ).value;

        const result = createBranchSchema.safeParse({
          name,
          address,
          city,
          phone,
          responsible,
          responsiblePhone,
          email,
          password,
          status: status === "true" ? true : false,
        });

        if (!result.success) {
          const errorObj: BranchErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof BranchErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: <CreateBranchForm currentValues={currentValues} errors={errorObj} />,
          });

          MySwal.showValidationMessage("Revisa los campos marcados en rojo");

          return false;
        }

        return result.data;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        branchService
          .createBranch(result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Creado!",
              text: "La sede ha sido creada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadBranches();
          })
          .catch(async (error) => {
            await catchError(error, MySwal, "Error al crear la sede");
          });
      }
    });
  };

  return {
    handleCreateClick,
  };
};
