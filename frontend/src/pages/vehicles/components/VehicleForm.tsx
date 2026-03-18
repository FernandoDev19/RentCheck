import Input from "../../../common/components/ui/Input";
import Label from "../../../common/components/ui/Label";
import type { Vehicle } from "../../../models/Vehicle.model";
import type { VehicleErrors } from "../interfaces/vehicle-errors.interface";

type Props = {
  errors?: VehicleErrors;
  currentValues?: any;
  vehicle?: Vehicle;
};

export default function VehicleForm({
  currentValues,
  errors,
  vehicle,
}: Props) {
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
          <Label htmlFor="v-plate">Placa *</Label>
          <Input
            id="v-plate"
            name="v-plate"
            type="text"
            required
            placeholder=""
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
            placeholder=""
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
            placeholder=""
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
            placeholder=""
            value={currentValues?.year || vehicle?.year || ""}
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
            placeholder=""
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
        </div>
      </div>
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
          className={errors?.photos ? "bg-red-400/20 border border-red-600" : ""}
        >
          {(currentValues?.photos ?? vehicle?.photos ?? []).join("\n")}
        </textarea>
        {errors?.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}
      </div>
    </div>
  );
}
