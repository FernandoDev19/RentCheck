import { type RolesType } from "../../../common/types/roles.type";
import { catchError } from "../../../common/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import CreateEmployeeForm from "../components/CreateEmployeeForm";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";
import { editEmployeeSchema } from "../schemas/edit-employe.schema";
import type { EmployeeErrors } from "../interfaces/employee-errors.interface";
import { employeeService } from "../../../services/employee.service";
import type { Employee } from "../../../models/employee.model";

const MySwal = withReactContent(Swal);

export const useEditEmployee = () => {

  const userRole: RolesType = JSON.parse(localStorage.getItem("user")!)
    .role as RolesType;

  const handleEdit = async (
    loadEmployees: () => Promise<void> | void,
    employee: Employee,
  ) => {

    MySwal.fire({
      title: "Editar empleado",
      html: (
        <CreateEmployeeForm
          employee={employee}
          userRole={userRole}
        />
      ),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Editar empleado",
      confirmButtonColor: "var(--color-primary)",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const currentValues = {
          name:
            (document.getElementById("swal-name") as HTMLInputElement).value ||
            "",
          email:
            (document.getElementById("swal-email") as HTMLInputElement).value ||
            "",
          branchId:
            (document.getElementById("swal-branch") as HTMLInputElement)
              ?.value || undefined,
          identityType:
            (document.getElementById("swal-identity-type") as HTMLInputElement)
              ?.value || IDENTITY_TYPE.CC,
          identityNumber:
            (
              document.getElementById(
                "swal-identity-number",
              ) as HTMLInputElement
            )?.value || "",
          status:
            (document.getElementById("swal-status") as HTMLSelectElement)
              ?.value || "",
        };

        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        const branchId =
          (document.getElementById("swal-branch") as HTMLInputElement)?.value ||
          undefined;
        const identityType =
          (document.getElementById("swal-identity-type") as HTMLInputElement)
            ?.value || IDENTITY_TYPE.CC;
        const identityNumber = (
          document.getElementById("swal-identity-number") as HTMLInputElement
        )?.value;
        const status = (
          document.getElementById("swal-status") as HTMLSelectElement
        )?.value;

        const result = editEmployeeSchema.safeParse({
          name,
          email,
          branchId,
          identityType,
          identityNumber,
          status,
        });

        if (!result.success) {
          const errorObj: EmployeeErrors = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof EmployeeErrors;
            errorObj[field] = issue.message;
          });

          MySwal.update({
            html: (
              <CreateEmployeeForm
                userRole={userRole}
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
        employeeService
          .update(employee.id, result.value)
          .then(() => {
            MySwal.fire({
              title: "¡Editado!",
              text: "El empleado ha sido editado correctamente",
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            });
            loadEmployees();
          })
          .catch(async (error) => {
            await catchError(error, MySwal, "Error al editar empleado");
          });
      }
    });
  };

  return {
    handleEdit,
  };
};
