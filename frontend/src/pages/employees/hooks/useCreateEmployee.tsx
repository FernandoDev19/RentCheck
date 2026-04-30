import { type RolesType } from "../../../shared/types/role.type";
import { catchError } from "../../../shared/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import CreateEmployeeForm from "../components/CreateEmployeeForm";
import { IDENTITY_TYPE } from "../../../shared/types/identity-type.type";
import { createEmployeeSchema } from "../schemas/create-employee.schema";
import type { EmployeeErrors } from "../interfaces/employee-errors.interface";
import { employeeService } from "../../../services/employee.service";

const MySwal = withReactContent(Swal);

export const useCreateEmployee = () => {

       const userRole: RolesType = JSON.parse(localStorage.getItem("user")!)
         .role as RolesType;

      const handleCreateClick = async (loadEmployees: () => Promise<void> | void) => {
    
        MySwal.fire({
          title: "Crear nuevo empleado",
          html: <CreateEmployeeForm userRole={userRole} />,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: "Crear empleado",
          confirmButtonColor: "var(--color-primary)",
          cancelButtonText: "Cancelar",
          preConfirm: () => {
            const currentValues = {
              name: (
              document.getElementById("swal-name") as HTMLInputElement
            ).value || '',
            email: (
              document.getElementById("swal-email") as HTMLInputElement
            ).value || '',
            password: (
              document.getElementById("swal-password") as HTMLInputElement
            ).value || '',
            branchId:
              (document.getElementById("swal-branch") as HTMLInputElement)?.value ||
              undefined,
            identityType:
              (document.getElementById("swal-identity-type") as HTMLInputElement)
                ?.value || IDENTITY_TYPE.CC,
            identityNumber: (
              document.getElementById("swal-identity-number") as HTMLInputElement
            )?.value || ''
            };

            const name = (
              document.getElementById("swal-name") as HTMLInputElement
            ).value;
            const email = (
              document.getElementById("swal-email") as HTMLInputElement
            ).value;
            const password = (
              document.getElementById("swal-password") as HTMLInputElement
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
    
            const result = createEmployeeSchema.safeParse({
              name,
              email,
              password,
              branchId,
              identityType,
              identityNumber,
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
              .createEmployee(result.value)
              .then(() => {
                MySwal.fire({
                  title: "¡Creado!",
                  text: "El empleado ha sido creado correctamente",
                  icon: "success",
                  timer: 2000,
                  showConfirmButton: false,
                });
                loadEmployees();
              })
              .catch(async (error) => {
                await catchError(error, MySwal, "Error al crear empleado");
              });
          }
        });
      };
    
    return {
        handleCreateClick
    }
}