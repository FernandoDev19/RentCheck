import { useState } from "react";
import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import PaginatedSelect from "../../../common/components/ui/PaginatedSelect";
import Select from "../../../common/components/ui/Select";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import { USER_STATUS } from "../../../common/types/user-status.type";
import type { Employee } from "../../../models/employee.model";
import { branchService } from "../../../services/branch.service";
import type { EmployeeErrors } from "../interfaces/employee-errors.interface";

type Props = {
  userRole: RolesType;
  errors?: EmployeeErrors;
  currentValues?: any;
  employee?: Employee;
};

export default function CreateEmployeeForm({
  userRole,
  errors,
  currentValues,
  employee,
}: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentValues?.branchId || employee?.branch?.id || "",
  );

  return (
    <div className="text-left space-y-4">
      <div>
        <Label htmlFor="swal-name">Nombre*</Label>
        <Input
          id="swal-name"
          name="swal-name"
          type="text"
          className={errors?.name ? "bg-red-400/20 border border-red-600" : ""}
          placeholder="Ej. Enrique Gonzales"
          value={currentValues?.name || employee?.name || ""}
          required
        />
        {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="swal-email">Email*</Label>
        <Input
          id="swal-email"
          name="swal-email"
          type="email"
          className={errors?.email ? "bg-red-400/20 border border-red-600" : ""}
          placeholder="Ej. ejemplo123@ejemplo.com"
          value={currentValues?.email || employee?.user?.email || ""}
          required
        />
        {errors?.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      {!employee && (
        <div>
          <Label htmlFor="swal-password">Contraseña*</Label>
          <Input
            id="swal-password"
            name="swal-password"
            type="password"
            required={!employee ? true : false}
            className={
              errors?.password ? "bg-red-400/20 border border-red-600" : ""
            }
            placeholder="•••••••••"
            value={currentValues?.password || ""}
          />
          {errors?.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>
      )}

      {userRole === ROLES.OWNER && (
        <div>
          <Label htmlFor="swal-branch">Sede*</Label>
          <PaginatedSelect
            id="swal-branch"
            placeholder="Seleccionar sede..."
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            error={!!errors?.branchId}
            loadOptions={async (page, search) => {
              const res = await branchService.getAllNames({
                page,
                limit: 10,
                search,
              });
              return {
                data: res.data.map((b) => ({ value: b.id, label: b.name })),
                lastPage: res.lastPage,
              };
            }}
          />
          {errors?.branchId && (
            <p className="text-red-500 text-sm">{errors.branchId}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="swal-identity-type">Tipo de identidad</Label>
        <Select
          id="swal-identity-type"
          name="swal-identity-type"
          value={currentValues?.identityType || employee?.identityType || ""}
        >
          {Object.values(IDENTITY_TYPE).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="swal-identity-number">Numero de Identidad*</Label>
        <Input
          id="swal-identity-number"
          name="swal-identity-number"
          type="text"
          className={
            errors?.identityNumber ? "bg-red-400/20 border border-red-600" : ""
          }
          placeholder="Ej. 12345678..."
          required
          value={
            currentValues?.identityNumber || employee?.identityNumber || ""
          }
        />
        {errors?.identityNumber && (
          <p className="text-red-500 text-sm">{errors.identityNumber}</p>
        )}
      </div>

      {employee && (
        <div>
          <Label htmlFor="swal-status">Estado*</Label>
          <Select
            id="swal-status"
            name="swal-status"
            value={currentValues?.status || employee?.user?.status || ""}
          >
            {Object.values(USER_STATUS).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          {errors?.status && (
            <p className="text-red-500 text-sm">{errors.status}</p>
          )}
        </div>
      )}
    </div>
  );
}
