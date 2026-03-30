import { useState } from "react";
import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import PaginatedSelect from "../../../common/components/ui/PaginatedSelect";
import { ROLES, type RolesType } from "../../../common/types/roles.type";
import type { Vehicle } from "../../../models/Vehicle.model";
import { branchService } from "../../../services/branch.service";
import type { VehicleErrors } from "../interfaces/vehicle-errors.interface";
import Select from "../../../common/components/ui/Select";
import { TYPE_TRANSMISSION } from "../../../common/types/type-transmission.type";

type Props = {
  errors?: VehicleErrors;
  userRole: RolesType;
  currentValues?: any;
  vehicle?: Vehicle;
};

export default function VehicleForm({
  currentValues,
  errors,
  vehicle,
  userRole,
}: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentValues?.branchId || vehicle?.branchId || "",
  );
  const [currency, setCurrency] = useState<string>("0");

  const handleInputCurrency = (val: string) => {
    setCurrency(val);
  }

  return (
    <div className="text-left text-xs">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div>
          <Label htmlFor="v-gamma">Gama</Label>
          <Input
            id="v-gamma"
            name="v-gamma"
            type="text"
            placeholder="Ej. Sedán (Opcional)"
            value={currentValues?.gamma || vehicle?.gamma || ""}
            className={
              errors?.gamma ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.gamma && (
            <p className="text-red-500 text-sm">{errors.gamma}</p>
          )}
        </div>
        <div>
          <Label htmlFor="v-plate">Placa *</Label>
          <Input
            id="v-plate"
            name="v-plate"
            type="text"
            required
            placeholder="Ej. ABC-123"
            value={currentValues?.plate || vehicle?.plate || ""}
            className={
              errors?.plate ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.plate && (
            <p className="text-red-500 text-sm">{errors.plate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="v-brand">Marca *</Label>
          <Input
            id="v-brand"
            name="v-brand"
            type="text"
            required
            placeholder="Ej. KIA"
            value={currentValues?.brand || vehicle?.brand || ""}
            className={
              errors?.brand ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.brand && (
            <p className="text-red-500 text-sm">{errors.brand}</p>
          )}
        </div>
        <div>
          <Label htmlFor="v-model">Modelo *</Label>
          <Input
            id="v-model"
            name="v-model"
            type="text"
            required
            placeholder="Ej. Picanto"
            value={currentValues?.model || vehicle?.model || ""}
            className={
              errors?.model ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.model && (
            <p className="text-red-500 text-sm">{errors.model}</p>
          )}
        </div>
        <div>
          <Label htmlFor="v-year">Año *</Label>
          <Input
            id="v-year"
            name="v-year"
            type="number"
            required
            placeholder="Ej. 2016"
            value={currentValues?.year || vehicle?.year || new Date().getFullYear()}
            max={new Date().getFullYear() + 1}
            className={
              errors?.year ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.year && (
            <p className="text-red-500 text-sm">{errors.year}</p>
          )}
        </div>
        <div>
          <Label htmlFor="v-color">Color *</Label>
          <Input
            id="v-color"
            name="v-color"
            type="text"
            required
            placeholder="Ej. Blanco"
            value={currentValues?.color || vehicle?.color || ""}
            className={
              errors?.color ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.color && (
            <p className="text-red-500 text-sm">{errors.color}</p>
          )}
        </div>

        <div>
          <Label htmlFor="v-transmission">Transmisión *</Label>
          <Select
            id="v-transmission"
            name="v-transmission"
            required
            value={currentValues?.transmission || vehicle?.transmission || ""}
            className={
              errors?.transmission ? "bg-red-400/20 border border-red-600" : ""
            }
          >
            {Object.values(TYPE_TRANSMISSION).map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </Select>
          {errors?.transmission && (
            <p className="text-red-500 text-sm">{errors.transmission}</p>
          )}
        </div>

        {/* <div>
          <Label htmlFor="v-insuredValue">Valor asegurado</Label>
          <Input
            id="v-insuredValue"
            name="v-insuredValue"
            type="number"
            required
            placeholder=""
            value={currentValues?.insuredValue || vehicle?.insuredValue || ""}
            className={
              errors?.insuredValue ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.insuredValue && (
            <p className="text-red-500 text-sm">{errors.insuredValue}</p>
          )}
        </div> */}

         <div>
          <Label htmlFor="v-rentalPriceByDay">Precio renta por día *</Label>
          <Input
            id="v-rentalPriceByDay"
            name="v-rentalPriceByDay"
            type="text"
            required
            placeholder="Ej: 150.000"
            onChange={(element) => handleInputCurrency(Number(element.target.value).toLocaleString("es-CO"))}
            value={currentValues?.rentalPriceByDay || vehicle?.rentalPriceByDay || Number(currency)?.toLocaleString("es-CO")}
            className={
              errors?.rentalPriceByDay ? "bg-red-400/20 border border-red-600" : ""
            }
          />
          {errors?.rentalPriceByDay && (
            <p className="text-red-500 text-sm">{errors.rentalPriceByDay}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {userRole === ROLES.OWNER && (
          <div>
            <Label htmlFor="v-branch">Sede*</Label>
            <PaginatedSelect
              id="v-branch"
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
          <Label htmlFor="v-photos">URLs de fotos (una por línea)</Label>
          <textarea
            id="v-photos"
            rows={3}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            placeholder="https://..."
            className={
              errors?.photos ? "bg-red-400/20 border border-red-600" : ""
            }
            defaultValue={(currentValues?.photos ?? vehicle?.photos ?? []).join(
              "\n",
            )}
          ></textarea>
          {errors?.photos && (
            <p className="text-red-500 text-sm">{errors.photos}</p>
          )}
        </div>
      </div>
    </div>
  );
}
