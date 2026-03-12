import type { Column } from "../../../common/components/datatable/types/column.type";
import ButtonActionDataTable from "../../../common/components/ui/ButtonActionDataTable";
import type { Branch } from "../../../models/branch.model";
import type { Customer } from "../../../models/customer.model";
import type { Employee } from "../../../models/employee.model";
import type { Rental } from "../../../models/rental.model";
import { RENTAL_STATUS_COLORS, RENTAL_STATUS_LABELS } from "./useRentals";
import { useRequestBiometry } from "./useRequestBiometry";

export const useRentalColumns = (loadRentals: () => Promise<void> | void) => {
  const { handleRequestBiometry } = useRequestBiometry();

  const columns: Column<Rental>[] = [
    {
      key: "branch",
      label: "Sede",
      render: (val) => {
        const branch = val as Branch;
        return `${branch?.name || "-"}`;
      },
    },
    {
      key: "employee",
      label: "Empleado",
      render: (val) => {
        const employee = val as Employee;
        return `${employee?.name || "-"}`;
      },
    },
    {
      key: "customer",
      label: "Cliente",
      render: (val) => {
        const customer = val as Customer;
        return customer.name;
      },
    },
    {
      key: "biometry_status",
      label: "Biometría",
      sortable: false,
      render: (_val, row) => {
        const biometries = row.customer?.biometryRequests ?? [];

        if (biometries.length === 0) {
          return (
            <ButtonActionDataTable onClick={() => handleRequestBiometry(row, loadRentals)} color="red">
              🔴 Sin verificar
            </ButtonActionDataTable>
          );
        }

        const last = [...biometries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        if (last.status === "pending") {
          return (
            <button
              onClick={() => handleRequestBiometry(row, loadRentals)}
              className="flex flex-col gap-0.5 text-left"
            >
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-yellow-100 text-yellow-700">
                ⏳ Pendiente
              </span>
              <span className="text-xs text-slate-400">
                {new Date(last.createdAt).toLocaleDateString("es-CO")}
              </span>
            </button>
          );
        }

        const isApproved = last.result === "approved";

        return (
          <button
            onClick={() => handleRequestBiometry(row, loadRentals)}
            className="flex flex-col gap-0.5 text-left"
          >
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit
          ${isApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
            >
              {isApproved ? "✅ Aprobada" : "❌ Rechazada"}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(last.createdAt).toLocaleDateString("es-CO")}
            </span>
          </button>
        );
      },
    },
    {
      key: "startDate",
      label: "Fecha inicio",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "expectedReturnDate",
      label: "Fecha esperada devolución",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
    {
      key: "actualReturnDate",
      label: "Fecha real devolución",
      render: (val) =>
        val ? new Date(val as string).toLocaleDateString("es-CO") : "-",
    },
    {
      key: "rentalStatus",
      label: "Estado",
      render: (val) => {
        const status = val as string;
        const colors = RENTAL_STATUS_COLORS[status] ?? {
          bg: "bg-gray-100",
          text: "text-gray-500",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {RENTAL_STATUS_LABELS[status] ?? status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
  ];

  return { columns }
};
