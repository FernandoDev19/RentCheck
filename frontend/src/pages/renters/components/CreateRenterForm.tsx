import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import Select from "../../../common/components/ui/Select";
import type { RenterErrors } from "../interfaces/renter-errors.interface";
import type { Plan } from "../../../models/plan.model";
import type { Renter } from "../../../models/renter.model";

type props = {
  plans: Plan[];
  currentValues?: any;
  errors?: RenterErrors;
  renter?: Renter;
};

export default function CreateRenterForm({
  plans,
  currentValues,
  errors,
  renter,
}: props) {
  const planIdValue = currentValues?.planId || renter?.planId?.toString() || "";
  console.log("Final planId value:", planIdValue);
  return (
    <div className="text-left space-y-4">
      <div>
        <Label htmlFor="swal-name">Nombre*</Label>
        <Input
          type="text"
          id="swal-name"
          name="swal-name"
          value={currentValues?.name || renter?.name || ""}
          required={true}
          placeholder="Ej. Ejemplo Rent"
          className={errors?.name ? "bg-red-400/20 border border-red-600" : ""}
        />
        {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="swal-nit">NIT*</Label>
        <Input
          type="text"
          id="swal-nit"
          name="swal-nit"
          required={true}
          placeholder="NIT"
          value={currentValues?.nit || renter?.nit || ""}
          className={errors?.nit ? "bg-red-400/20 border border-red-600" : ""}
        />
        {errors?.nit && <p className="text-red-500 text-sm">{errors.nit}</p>}
      </div>

      <div>
        <Label htmlFor="swal-address">Dirección</Label>
        <Input
          type="text"
          id="swal-address"
          name="swal-address"
          value={currentValues?.address || renter?.address || ""}
          placeholder="Dirección"
          className={
            errors?.address ? "bg-red-400/20 border border-red-600" : ""
          }
        />
        {errors?.address && (
          <p className="text-red-500 text-sm">{errors.address}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-city">Ciudad</Label>
        <Input
          type="text"
          id="swal-city"
          name="swal-city"
          value={currentValues?.city || renter?.city || ""}
          placeholder="Ciudad"
          className={errors?.city ? "bg-red-400/20 border border-red-600" : ""}
        />
        {errors?.city && <p className="text-red-500 text-sm">{errors.city}</p>}
      </div>

      <div>
        <Label htmlFor="swal-email">Email*</Label>
        <Input
          type="email"
          id="swal-email"
          name="swal-email"
          value={currentValues?.email || renter?.user?.email || ""}
          required={true}
          placeholder="Email"
          className={errors?.email ? "bg-red-400/20 border border-red-600" : ""}
        />
        {errors?.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-phone">Teléfono*</Label>
        <Input
          type="text"
          id="swal-phone"
          name="swal-phone"
          value={currentValues?.phone || renter?.phone || ""}
          required={true}
          placeholder="Teléfono"
          className={errors?.phone ? "bg-red-400/20 border border-red-600" : ""}
        />
        {errors?.phone && (
          <p className="text-red-500 text-sm">{errors.phone}</p>
        )}
      </div>

      {!renter && (
        <div>
          <Label htmlFor="swal-password">Contraseña*</Label>
          <Input
            type="password"
            id="swal-password"
            name="swal-password"
            value={currentValues?.password || ""}
            required={!renter ? true : false}
            placeholder="Contraseña"
            className={
              errors?.password ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="swal-legal-representative">Representante Legal*</Label>
        <Input
          type="text"
          id="swal-legal-representative"
          name="swal-legal-representative"
          value={currentValues?.legalRepresentative || renter?.legalRepresentative || ""}
          placeholder="Representante Legal"
          required={true}
          className={
            errors?.legalRepresentative
              ? "bg-red-400/20 border border-red-600"
              : ""
          }
        />
        {errors?.legalRepresentative && (
          <p className="text-red-500 text-sm">{errors.legalRepresentative}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-plan">Plan*</Label>
        <Select
          id="swal-plan"
          name="swal-plan"
          value={currentValues?.planId || renter?.plan?.id || ""}
          className={
            errors?.planId ? "bg-red-400/20 border border-red-600" : ""
          }
        >
          <option value="">
            Selecciona un plan
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </Select>
        {errors?.planId && (
          <p className="text-red-500 text-sm">{errors.planId}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-expiration-date">
          Fecha de expiración del plan
        </Label>
        <Input
          id="swal-expiration-date"
          name="swal-expiration-date"
          type="date"
          value={
            currentValues?.planExpiresAt ||
            (renter?.planExpiresAt 
              ? new Date(renter.planExpiresAt).toISOString().split('T')[0]
              : ""
            )
          }
          placeholder="Fecha de expiración del plan"
          className={
            errors?.planExpiresAt ? "bg-red-400/20 border border-red-600" : ""
          }
        />
        {errors?.planExpiresAt && (
          <p className="text-red-500 text-sm">{errors.planExpiresAt}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-balance">Saldo*</Label>
        <Input
          id="swal-balance"
          type="number"
          name="swal-balance"
          value={currentValues?.balance || renter?.balance || ""}
          placeholder="Saldo"
          className={
            errors?.balance ? "bg-red-400/20 border border-red-600" : ""
          }
        />
        {errors?.balance && (
          <p className="text-red-500 text-sm">{errors.balance}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-balance-threshold">Umbral de saldo bajo</Label>
        <Input
          id="swal-balance-threshold"
          type="number"
          name="swal-balance-threshold"
          value={currentValues?.lowBalanceThreshold || renter?.lowBalanceThreshold || ""}
          placeholder="Umbral de saldo bajo"
          className={
            errors?.lowBalanceThreshold
              ? "bg-red-400/20 border border-red-600"
              : ""
          }
        />
        {errors?.lowBalanceThreshold && (
          <p className="text-red-500 text-sm">{errors.lowBalanceThreshold}</p>
        )}
      </div>

      <div>
        <Label htmlFor="swal-low-balance-alert">Alerta de saldo bajo</Label>
        <Input
          id="swal-low-balance-alert"
          name="swal-low-balance-alert"
          type="checkbox"
          value={Boolean(currentValues?.lowBalanceAlertEnabled || renter?.lowBalanceAlertEnabled)}
        />
      </div>

      <div>
        <Label htmlFor="swal-status">Estado</Label>
        <Select
          id="swal-status"
          name="swal-status"
          value={currentValues?.status || renter?.status || ""}
          className={
            errors?.status ? "bg-red-400/20 border border-red-600" : ""
          }
        >
          <option value="">Selecciona</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
        </Select>
        {errors?.status && (
          <p className="text-red-500 text-sm">{errors.status}</p>
        )}
      </div>
    </div>
  );
}
