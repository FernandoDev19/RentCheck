import type { Column } from "../../../common/components/datatable/types/column.type";
import type { Customer } from "../../../models/customer.model";
import { CUSTOMER_STATUS_COLORS } from "../constants/customer-status-color";
import { CUSTOMER_STATUS_LABELS } from "../constants/customer-status-label";
import { useRequestBiometry } from "./useRequestBiometry";

export const useCustomerColumns = (loadCustomers: () => Promise<void> | void) => {
  const { handleRequestBiometry } = useRequestBiometry();

  const columns: Column<Customer>[] = [
    {
      key: "identityType",
      label: "Tipo Ident."
    },
    {
      key: "identityNumber",
      label: "N. Ident.",
    },
    {
      key: "name",
      label: "Nombre",
      render: (_val, row) => `${row.name} ${row.lastName}`,
    },
    {
      key: "phone",
      label: "Celular",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "email",
      label: "Correo",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "generalScore",
      label: "Score",
      render: (val) => {
        const score = val as number;
        const color =
          score >= 4
            ? "text-green-600"
            : score >= 2.5
              ? "text-yellow-600"
              : "text-red-600";
        return (
          <span className={`font-semibold ${color}`}>
            {score != null ? `${Number(score).toFixed(1)} / 5` : "-"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Estado",
      render: (val) => {
        const status = val as string;
        const colors = CUSTOMER_STATUS_COLORS[status] ?? {
          bg: "bg-gray-100",
          text: "text-gray-500",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {CUSTOMER_STATUS_LABELS[status] ?? status}
          </span>
        );
      },
    },
    {
      key: "biometryRequests",
      label: "Biometría",
      sortable: false,
      render: (_val, row) => {
        const biometries = row.biometryRequests ?? [];

        if (biometries.length === 0) {
          return (
            <button
              onClick={() => handleRequestBiometry(row, loadCustomers)}
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              🔴 Sin verificar
            </button>
          );
        }

        const last = [...biometries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

        if (last.status === "pending") {
          return (
            <button
              onClick={() => handleRequestBiometry(row, loadCustomers)}
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
            onClick={() => handleRequestBiometry(row, loadCustomers)}
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
      key: "createdAt",
      label: "Registrado",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
  ];

  return {
    columns
  }
};
