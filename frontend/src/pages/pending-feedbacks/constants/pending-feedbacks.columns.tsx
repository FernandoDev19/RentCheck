import type { Column } from "../../../common/components/datatable/types/column.type";
import type { Branch } from "../../../models/branch.model";
import type { Customer } from "../../../models/customer.model";
import type { Employee } from "../../../models/employee.model";
import type { Rental } from "../../../models/rental.model";
import type { Renter } from "../../../models/renter.model";

export const columns: Column<Rental>[] = [
  {
    key: "customer",
    label: "Cliente",
    sortable: false,
    render: (_v, r) =>
      `${(r.customer as Customer)?.name} ${(r.customer as Customer)?.lastName}`,
  },
  {
    key: "renter",
    label: "Rentadora",
    sortable: false,
    render: (_v, r) => (r.renter as Renter)?.name ?? "-",
  },
  {
    key: "branch",
    label: "Sede",
    sortable: false,
    render: (_v, r) => (r.branch as Branch)?.name ?? "-",
  },
  {
    key: "employee",
    label: "Empleado",
    sortable: false,
    render: (_v, r) => (r.employee as Employee)?.name ?? "-",
  },
  {
    key: "startDate",
    label: "Fecha inicio",
    render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
  },
  {
    key: "expectedReturnDate",
    label: "Fecha devolución",
    render: (v) => {
      const date = new Date(v as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isLate = date < today;
      return (
        <span
          className={isLate ? "text-red-600 font-semibold" : "text-slate-700"}
        >
          {date.toLocaleDateString("es-CO")}
          {isLate && " ⚠️"}
        </span>
      );
    },
  },
  {
    key: "rentalStatus",
    label: "Estado",
    render: (val) => {
      const status = val as string;
      const colors: Record<string, string> = {
        active: "bg-green-100 text-green-700",
        returned: "bg-blue-100 text-blue-700",
        late: "bg-red-100 text-red-600",
        cancelled: "bg-gray-100 text-gray-500",
      };
      const labels: Record<string, string> = {
        active: "Activo",
        returned: "Devuelto",
        late: "Tardío",
        cancelled: "Cancelado",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-500"}`}
        >
          {labels[status] ?? status}
        </span>
      );
    },
  },
];
