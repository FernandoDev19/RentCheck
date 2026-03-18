import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import Select from "../../../common/components/ui/Select";
import type { Branch } from "../../../models/branch.model";
import type { BranchErrors } from "../interfaces/branch-errors.interface";

type Props = {
    errors?: BranchErrors;
    currentValues?: any;
    branch?: Branch;
};

export default function CreateBranchForm({errors, currentValues, branch}: Props) {
  return (
    <div className="text-left space-y-4">
      <div>
        <Label htmlFor="swal-name">Nombre*</Label>
        <Input
          id="swal-name"
          name="swal-name"
          type="text"
          required
          placeholder="Nombre de la sede"
          className={errors?.name ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.name || branch?.name || ""}
        />
        {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="swal-city">Ciudad</Label>
        <Input
          id="swal-city"
          name="swal-city"
          type="text"
          required={false}
          placeholder="Ej. Barranquilla"
          className={errors?.city ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.city || branch?.city || ""}
        />
        {errors?.city && <p className="text-red-500 text-sm">{errors.city}</p>}
      </div>

      <div>
        <Label htmlFor="swal-address">Dirección</Label>
        <Input
          id="swal-address"
          name="swal-address"
          type="text"
          required={false}
          placeholder="Dirección"
          className={errors?.address ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.address || branch?.address || ""}
        />
        {errors?.address && (
          <p className="text-red-500 text-sm">{errors.address}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-phone">Celular*</Label>
        <Input
          id="swal-phone"
          name="swal-phone"
          type="text"
          required
          placeholder="Ej. 300XXXX123"
          className={errors?.phone ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.phone || branch?.phone || ""}
        />
        {errors?.phone && (
          <p className="text-red-500 text-sm">{errors.phone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-responsible">Responsable*</Label>
        <Input
          id="swal-responsible"
          name="swal-responsible"
          type="text"
          required
          placeholder="Responsable"
          className={errors?.responsible ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.responsible || branch?.responsible || ""}
        />
        {errors?.responsible && (
          <p className="text-red-500 text-sm">{errors.responsible}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-email">Email*</Label>
        <Input
          id="swal-email"
          name="swal-email"
          type="email"
          placeholder="Email"
          className={errors?.email ? "bg-red-400/20 border border-red-600" : ""}
          required
          value={currentValues?.email || branch?.email || ""}
        />
        {errors?.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      {!branch && (
        <div>
        <Label htmlFor="swal-password">Contraseña*</Label>
        <Input
          id="swal-password"
          name="swal-password"
          type="password"
          required={!branch ? true : false}
          placeholder="•••••••••"
          className={errors?.password ? "bg-red-400/20 border border-red-600" : ""}
          value={currentValues?.password || ""}
        />
        {errors?.password && (
          <p className="text-red-500 text-sm">{errors.password}</p>
        )}
      </div>
      )}

      <div>
        <Label htmlFor="swal-status">Estado</Label>
        <Select id="swal-status" name="swal-status" className={errors?.status ? "bg-red-400/20 border border-red-600" : ""} value={currentValues?.status || branch?.status}>
          <option value="true">Activo</option>
          <option value="false">Suspendido</option>
        </Select>
        {errors?.status && (
          <p className="text-red-500 text-sm">{errors.status}</p>
        )}
      </div>
    </div>
  );
}
