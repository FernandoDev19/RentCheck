import { ROLES } from "../../../shared/types/role.type";
import { useState, useCallback, useEffect } from "react";
import { branchService } from "../../../services/branch.service";
import PaginatedSelect from "../../../shared/components/ui/PaginatedSelect";
import { vehicleService } from "../../../services/vehicle.service";
import type { Customer } from "../../../shared/types/customer.type";
import type { RentalErrors } from "../interfaces/rental-errors.interface";
import type { UserActiveType } from "../../../shared/types/user-active.type";
import { getUser } from "../../dashboard/helpers/user.helper";
import TitleSpan from "../../../shared/components/ui/TitleSpan";
import Input from "../../../shared/components/ui/Input";
import Label from "../../../shared/components/ui/Label";
import Select from "../../../shared/components/ui/Select";
import { IDENTITY_TYPE } from "../../../shared/types/identity-type.type";

type Props = {
  customer?: Customer | null;
  errors?: RentalErrors;
  identityNumber: string;
  currentValues?: any;
  prefill?: { vehicleId?: string; startDate?: string; endDate?: string };
};

export default function CreateRentalForm({
  customer,
  errors,
  identityNumber,
  currentValues,
  prefill,
}: Props) {
  const isRealCustomer = !!customer?.id;
  const [vehiclePrice, setVehiclePrice] = useState<number>(0);
  const [rentalTotalPrice, setRentalTotalPrice] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(0);
  const user: UserActiveType = getUser();
  const userRoleOwner = user.role === ROLES.OWNER;
  // En CreateRentalForm agrega estos estados:
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    currentValues?.vehicleId || prefill?.vehicleId || "",
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentValues?.branchId || "",
  );
  const [startDate, setStartDate] = useState(
    currentValues?.startDate || prefill?.startDate || "",
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    currentValues?.expectedReturnDate || prefill?.endDate || "",
  );
  const getTodayLocal = (tomorrow: boolean = false) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = tomorrow
      ? String(today.getDate() + 1).padStart(2, "0")
      : String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Manejar cambio de sede (solo para Owner)
  const handleBranchChange = useCallback(
    (branchId: string) => {
      setSelectedBranchId(branchId);
      // Limpiar vehículo seleccionado cuando cambia la sede
      if (userRoleOwner && branchId !== selectedBranchId) {
        setSelectedVehicleId("");
      }
    },
    [userRoleOwner, selectedBranchId],
  );

  const handleStartDateChange = useCallback(
    (value: string) => {
      setStartDate(value);
      if (value !== startDate) {
        setSelectedVehicleId("");
      }
    },
    [startDate],
  );

  const handleExpectedReturnDateChange = useCallback(
    (value: string) => {
      setExpectedReturnDate(value);
      if (value !== expectedReturnDate) {
        setSelectedVehicleId("");
      }
    },
    [expectedReturnDate],
  );

  const handleVehicleIdChange = useCallback(
    async (vehicleId: string) => {
      if (!vehicleId) {
        setTotalDays(0);
        setVehiclePrice(0);
        setRentalTotalPrice(0);
        setSelectedVehicleId("");
        return;
      }

      const calculateDays = () => {
        if (!startDate || !expectedReturnDate) return 0;

        const s = new Date(startDate);
        const e = new Date(expectedReturnDate);

        const diffInMs = e.getTime() - s.getTime();

        const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        return days <= 0 ? 1 : days;
      };

      try {
        const vehicle = await vehicleService.getOne(vehicleId);

        const price = vehicle.rentalPriceByDay;
        const days = calculateDays();

        setTotalDays(days);
        setSelectedVehicleId(vehicleId);
        setVehiclePrice(price);
        setRentalTotalPrice(price * days);
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
        setTotalDays(0);
        setVehiclePrice(0);
        setRentalTotalPrice(0);
        setSelectedVehicleId("");
      }
    },
    [startDate, expectedReturnDate],
  );

  useEffect(() => {
    const handleVehicleId = async () => {
      handleVehicleIdChange(prefill?.vehicleId || "");
    }

    handleVehicleId();
  }, [prefill?.vehicleId, handleVehicleIdChange]);

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
            {Object.values(IDENTITY_TYPE).map((value, i) => (
              <option key={i} value={value}>
                {value}
              </option>
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
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            min={getTodayLocal()}
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
            value={expectedReturnDate}
            onChange={(e) => handleExpectedReturnDateChange(e.target.value)}
            min={getTodayLocal(true)}
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
            <PaginatedSelect
              id="swal-branch"
              placeholder="Seleccionar sede..."
              value={selectedBranchId}
              onChange={handleBranchChange}
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

        {/* Vehículo — todos los roles */}
        <div>
          <Label htmlFor="swal-vehicle">Vehículo</Label>
          <PaginatedSelect
            id="swal-vehicle"
            placeholder="Seleccionar vehículo (opcional)..."
            value={selectedVehicleId}
            onChange={handleVehicleIdChange}
            error={!!errors?.vehicleId}
            disabled={
              !startDate ||
              !expectedReturnDate ||
              (userRoleOwner && !selectedBranchId)
            }
            loadOptions={async (page, search) => {
              const res = await vehicleService.getAllAvailableByDate({
                page,
                limit: 10,
                search,
                startDate: startDate || undefined,
                endDate: expectedReturnDate || undefined,
              });

              return {
                data: res.data.map((v) => ({
                  value: v.id,
                  label: `${v.plate} — ${v.brand} ${v.model}`,
                  sublabel: `${v.color} · $${Number(v.rentalPriceByDay).toLocaleString("es-CO")}/día`,
                })),
                lastPage: res.lastPage,
              };
            }}
          />
          {errors?.vehicleId && (
            <p className="text-red-500 text-sm">{errors.vehicleId}</p>
          )}
        </div>
      </div>

      {selectedVehicleId && (
        <>
          <input
            type="hidden"
            id="swal-totalPrice"
            value={currentValues?.totalPrice || rentalTotalPrice}
          />

          <div className="text-center bg-green-500 rounded-full py-2">
            <TitleSpan className="font-bold! text-white! text-base!">
              <strong>Precio Total</strong> <br />$
              {Number(rentalTotalPrice).toLocaleString("es-CO")}
              <span className="ml-2 text-white/60!">
                (${Number(vehiclePrice || 0).toLocaleString("es-CO")} /{" "}
                {totalDays} Días)
              </span>
            </TitleSpan>
          </div>
        </>
      )}

      {errors?.totalPrice && (
        <p className="text-red-500 text-sm">{errors.totalPrice}</p>
      )}
    </div>
  );
}
