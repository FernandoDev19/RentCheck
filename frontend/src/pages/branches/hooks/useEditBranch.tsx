import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CreateBranchForm from "../components/CreateBranchForm";
import type { BranchErrors } from "../interfaces/branch-errors.interface";
import { branchService } from "../../../services/branch.service";
import { catchError } from "../../../shared/errors/catch-error";
import { editBranchSchema } from "../schemas/edit-branch.schema";
import type { Branch } from "../../../shared/types/branch.type";
const MySwal = withReactContent(Swal);

export const useEditBranch = () => {
  const handleEdit = async (
    loadBranches: () => Promise<void> | void,
    branchId: string,
  ) => {
    let branch: Branch | undefined;

    try {
      branch = await branchService.findOne(branchId);
    } catch (error) {
      await catchError(error, MySwal, "Error al obtener a la rentadora");
    }

    if (!branch) {
      await MySwal.fire({
        title: "Error",
        text: "No se pudo obtener la rentadora",
        icon: "error",
      });
      return;
    }

    MySwal.fire({
      title: "Editar Sede",
      html: <CreateBranchForm branch={branch} />,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Editar sede",
      confirmButtonColor: "var(--color-primary)",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const currentValues = {
          name:
            (document.getElementById("swal-name") as HTMLInputElement).value ||
            "",
          city:
            (document.getElementById("swal-city") as HTMLInputElement).value ||
            "",
          address:
            (document.getElementById("swal-address") as HTMLInputElement)
              .value || "",
          phone:
            (document.getElementById("swal-phone") as HTMLInputElement).value ||
            "",
          responsible:
            (document.getElementById("swal-responsible") as HTMLInputElement)
              .value || "",
          email:
            (document.getElementById("swal-email") as HTMLInputElement).value ||
            "",
          status:
            (document.getElementById("swal-status") as HTMLSelectElement)
              .value || "",
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
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        ).value;

        const result = editBranchSchema.safeParse({
          name,
          address,
          city,
          phone,
          responsible,
          email,
          status: status === "true" ? true : false,
        });

        if (!result.success) {
          const errorObj: BranchErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof BranchErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <CreateBranchForm
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
        branchService
          .update(branch.id, result.value)
          .then(() => {
            MySwal.fire({
              title: "Editado!",
              text: "La sede ha sido editada correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadBranches();
          })
          .catch(async (error) => {
            await catchError(error, MySwal, "Error al editar la sede");
          });
      }
    });
  };

  return {
    handleEdit,
  };
};
