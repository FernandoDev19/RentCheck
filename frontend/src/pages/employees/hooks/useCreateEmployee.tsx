import { useState } from "react";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import { branchService } from "../../../services/branch.service";
import { catchError } from "../../../common/errors/catch-error";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import CreateEmployeeForm from "../components/CreateEmployeeForm";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";
import { createEmployeeSchema } from "../schemas/employee.schema";
import type { EmployeeErrors } from "../interfaces/employee-errors.interface";
import { employeeService } from "../../../services/employee.service";

const MySwal = withReactContent(Swal);

export const useCreateEmployee = () => {
     const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

       const userRole: RolesType = JSON.parse(localStorage.getItem("user")!)
         .role as RolesType;

      const handleCreateClick = async (loadEmployees: () => Promise<void> | void) => {
        let branchNames = branches;
    
        if (userRole === ROLES.OWNER && !branchNames.length) {
          try {
            branchNames = await branchService.getAllNames();
            setBranches(branchNames);
          } catch (error) {
            await catchError(error, MySwal, "Error al cargar las sedes");
            return;
          }
        }
    
        MySwal.fire({
          title: "Crear nuevo empleado",
          html: <CreateEmployeeForm userRole={userRole} branches={branchNames} />,
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
                    branches={branchNames}
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