import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import Select from "../../../common/components/ui/Select";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import type { EmployeeErrors } from "../interfaces/employee-errors.interface";

type Props = {
  userRole: RolesType;
  branches: { id: string; name: string }[];
  errors?: EmployeeErrors;
  currentValues?: any;
};

export default function CreateEmployeeForm({
  userRole,
  branches,
  errors,
  currentValues,
}: Props) {
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
          value={currentValues?.name || ""}
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
          value={currentValues?.email || ""}
          required
        />
        {errors?.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-password">Contraseña*</Label>
        <Input
          id="swal-password"
          name="swal-password"
          type="password"
          required
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

      {userRole === ROLES.OWNER && (
        <div>
          <Label htmlFor="swal-branch">Sede*</Label>
          <Select
            id="swal-branch"
            name="swal-branch"
            value={currentValues?.branchId || ""}
            className={
              errors?.branchId ? "bg-red-400/20 border border-red-600" : ""
            }
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
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
          value={currentValues?.identityType || ""}
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
          value={currentValues?.identityNumber || ""}
        />
        {errors?.identityNumber && (
          <p className="text-red-500 text-sm">{errors.identityNumber}</p>
        )}
      </div>
    </div>
  );
}
