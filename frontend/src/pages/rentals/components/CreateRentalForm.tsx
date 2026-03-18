import type { Customer } from "../../../models/customer.model";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import Label from "../../../common/components/ui/Label";
import Input from "../../../common/components/ui/Input";
import Select from "../../../common/components/ui/Select";
import { IDENTITY_TYPE } from "../../../common/types/identity-type.type";
import type { RentalErrors } from "../interfaces/rental-errors.interface";
import { getUser } from "../../dashboard/helpers/user.helper";
import type { UserActiveInterface } from "../../../common/interfaces/user-active.interface";
import { ROLES } from "../../../common/types/roles.type";
import { useCallback, useEffect, useState } from "react";
import { branchService } from "../../../services/branch.service";
import { catchError } from "../../../common/errors/catch-error";
import Swal from "sweetalert2";

type Props = {
  customer?: Customer | null;
  errors?: RentalErrors;
  identityNumber: string;
  currentValues?: any;
};

export default function CreateRentalForm({
  customer,
  errors,
  identityNumber,
  currentValues,
}: Props) {
  const isRealCustomer = !!customer?.id;
  const user: UserActiveInterface = getUser();
  const userRoleOwner = user.role === ROLES.OWNER;
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  const loadBranches = useCallback(async () => {
    if (userRoleOwner && !branches.length) {
      try {
        const branchNames = await branchService.getAllNames();
        setBranches(branchNames);
      } catch (error) {
        await catchError(error, Swal, "Error al cargar las sedes");
        return;
      }
    }
  }, [branches, userRoleOwner]);

  useEffect(() => {
    const run = async () => {
      await loadBranches();
    };
    run();
  }, [loadBranches]);

  return (
    <div className="text-left space-y-4">
      <TitleSpan className="mb-4">
        {customer ? "✅ Datos verificados" : "📝 Datos del cliente"}
      </TitleSpan>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
      >
        <div>
          <Label htmlFor="swal-name">Nombre*</Label>
          <Input
            id="swal-name"
            name="swal-name"
            type="text"
            value={customer?.name || currentValues?.name || ""}
            readonly={isRealCustomer}
            required={true}
            placeholder="Ej. Juan"
            className={
              errors?.name ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-lastName">Apellido*</Label>
          <Input
            id="swal-lastName"
            name="swal-lastName"
            type="text"
            value={customer?.lastName || currentValues?.lastName || ""}
            readonly={isRealCustomer}
            required={true}
            placeholder="Ej. Pérez"
            className={
              errors?.lastName ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-identityType">Tipo de identidad</Label>
          <Select
            id="swal-identityType"
            name="swal-identityType"
            disabled={isRealCustomer}
            className={
              errors?.identityType ? "bg-red-400/20 border border-red-600" : ""
            }
            value={currentValues?.identityType || ""}
          >
            {Object.values(IDENTITY_TYPE).map((value) => (
              <option value={value}>{value}</option>
            ))}
          </Select>
          {errors?.identityType && (
            <p className="text-red-500 text-sm">{errors.identityType}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-identityNumber">Número de identidad*</Label>
          <Input
            id="swal-identityNumber"
            name="swal-identityNumber"
            type="text"
            value={
              customer?.identityNumber ||
              currentValues?.identityNumber ||
              identityNumber
            }
            readonly={isRealCustomer}
            required={true}
            placeholder="Ej. 12345678"
            className={
              errors?.identityNumber
                ? "bg-red-400/20 border border-red-600"
                : ""
            }
          />
          {errors?.identityNumber && (
            <p className="text-red-500 text-sm">{errors.identityNumber}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-email">Email</Label>
          <Input
            id="swal-email"
            name="swal-email"
            type="email"
            value={customer?.email || currentValues?.email || ""}
            readonly={isRealCustomer}
            placeholder="Ej. juan.perez@example.com"
            className={
              errors?.email ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-phone">Teléfono</Label>
          <Input
            id="swal-phone"
            name="swal-phone"
            type="text"
            value={customer?.phone || currentValues?.phone || ""}
            readonly={isRealCustomer}
            placeholder="Ej. 12345678"
            className={
              errors?.phone ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.phone && (
            <p className="text-red-500 text-sm">{errors.phone}</p>
          )}
        </div>

        {isRealCustomer && (
          <>
            <div>
              <Label htmlFor="swal-generalScore">Score General</Label>
              <Input
                id="swal-generalScore"
                name="swal-generalScore"
                type="text"
                value={customer?.generalScore + "/5" || ""}
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-status">Estado</Label>
              <Input
                id="swal-status"
                name="swal-status"
                type="text"
                className={
                  customer?.status === "normal"
                    ? "bg-green-100 text-green-800"
                    : customer?.status === "red_alert"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }
                value={customer?.status || "-"}
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-registeredBy">Registrado por</Label>
              <Input
                id="swal-registeredBy"
                name="swal-registeredBy"
                type="text"
                value={customer?.registeredByUser?.name || "Sin registrador"}
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-biometries">Biometrías</Label>
              <Input
                id="swal-biometries"
                name="swal-biometries"
                type="text"
                value={customer?.biometryRequests?.length || 0}
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-rentals">Rentas totales</Label>
              <Input
                id="swal-rentals"
                name="swal-rentals"
                type="text"
                value={customer?.rentals?.length || 0}
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-created">Creado</Label>
              <Input
                id="swal-created"
                name="swal-created"
                type="text"
                value={
                  customer?.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString("es-CO")
                    : "-"
                }
                readonly={true}
              />
            </div>
            <div>
              <Label htmlFor="swal-updated">Actualizado</Label>
              <Input
                id="swal-updated"
                name="swal-updated"
                type="text"
                value={
                  customer?.updatedAt
                    ? new Date(customer.updatedAt).toLocaleDateString("es-CO")
                    : "-"
                }
                readonly={true}
              />
            </div>
          </>
        )}
      </div>

      <hr />

      <TitleSpan className="mb-4">Información de la renta</TitleSpan>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
      >
        <div>
          <Label htmlFor="swal-startDate">Fecha de inicio*</Label>
          <Input
            id="swal-startDate"
            name="swal-startDate"
            type="date"
            required={true}
            className={
              errors?.startDate ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.startDate && (
            <p className="text-red-500 text-sm">{errors.startDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="swal-expectedReturnDate">
            Fecha esperada devolución*
          </Label>
          <Input
            id="swal-expectedReturnDate"
            name="swal-expectedReturnDate"
            type="date"
            required={true}
            className={
              errors?.expectedReturnDate
                ? "bg-red-400/20 border border-red-600"
                : ""
            }
          />
          {errors?.expectedReturnDate && (
            <p className="text-red-500 text-sm">{errors.expectedReturnDate}</p>
          )}
        </div>
        {userRoleOwner && (
          <div>
            <Label htmlFor="swal-branch">Sede*</Label>
            <Select
              id="swal-branch"
              name="swal-branch"
              value={currentValues?.branchId || ""}
              required={true}
              className={
                errors?.branchId ? "bg-red-400/20 border border-red-600" : ""
              }
            >
              <option value="" selected disabled>Seleccionar Sede</option>
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
      </div>
    </div>
  );
}
