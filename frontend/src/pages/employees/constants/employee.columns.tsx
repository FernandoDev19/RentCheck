import type { Column } from "../../../shared/components/datatable/types/column.type";
import type { Branch } from "../../../shared/types/branch.type";
import type { Employee } from "../../../shared/types/employee.type";
import type { User } from "../../../shared/types/user.type";

export const columns: Column<Employee>[] = [
  {
    key: "branch",
    label: "Sede",
    render: (val) => {
      const branch = val as Branch;
      return `${branch.name}`;
    },
    sortable: false,
  },
  { key: "name", label: "Nombre" },
  {
    key: "user",
    label: "Email",
    render: (val) => {
      const user = val as User;
      return `${user.email}`;
    },
  },
  { key: "identityType", label: "Tipo ID" },
  { key: "identityNumber", label: "Num. ID" },
  {
    key: "status",
    label: "Estado",
    render: (_val, row) => {
      const user = row.user as User;
      return user.status;
    },
  },
  {
    key: "createdAt",
    label: "Fecha de creación",
    render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
  },
];
