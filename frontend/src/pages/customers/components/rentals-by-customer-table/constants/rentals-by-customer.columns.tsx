import type { Column } from "../../../../../shared/components/datatable/types/column.type";
import type { Branch } from "../../../../../shared/types/branch.type";
import type { Rental } from "../../../../../shared/types/rental.type";
import type { Renter } from "../../../../../shared/types/renter.type";
import { getUser } from "../../../../dashboard/helpers/user.helper";
import type { Vehicle } from "../../../../../shared/types/vehicle.type";

const user = getUser();

export const rentalsByCustomerColumns: Column<Rental>[] = [
  {
    key: "renter",
    label: "Rentadora",
    sortable: false,
    render: (_v, r) => {
      const renter = r.renter as Renter;
      return renter.name;
    },
  },
  {
    key: "branch",
    label: "Sede",
    sortable: false,
    render: (_v, r) => {
      const branch = r.branch as Branch;
      return branch?.renterId === user?.renterId ? branch?.name : "-";
    },
  },
  {
    key: "vehicle",
    label: "Vehículo",
    render: (val) => {
      const vehicle = val as Vehicle;
      if (!vehicle) return "-";

      return (
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            {vehicle?.brand} {vehicle?.model}
          </p>
          <p className="text-xs text-slate-400">
            {vehicle?.year} · {vehicle?.color}
          </p>
        </div>
      );
    },
  },
  {
    key: "startDate",
    label: "Inicio",
    render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
  },
  {
    key: "actualReturnDate",
    label: "Devolución",
    render: (v) =>
      v ? new Date(v as string).toLocaleDateString("es-CO") : "-",
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
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status]}`}
        >
          {labels[status]}
        </span>
      );
    },
  },
  {
    key: "rentalFeedback",
    label: "Score",
    sortable: false,
    render: (_v, r) => {
      if (!r.rentalFeedback) return <span className="text-slate-400">-</span>;

      const scores = Object.values(r.rentalFeedback.score) as number[];

      const total = scores.reduce((acc, val) => acc + val, 0);
      const avg = total / scores.length;

      const color =
        avg >= 4
          ? "text-green-600"
          : avg >= 2.5
            ? "text-yellow-600"
            : "text-red-600";

      return (
        <span className={`font-semibold text-xs ${color}`}>
          {avg.toFixed(1)}/5
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "Creado",
    render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
  },
];
