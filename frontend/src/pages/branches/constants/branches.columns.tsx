import type { Column } from "../../../common/components/datatable/types/column.type";
import type { Branch } from "../../../models/branch.model";

export const branchesColumns: Column<Branch>[] = [
  { key: "name", label: "Nombre" },
  { key: "city", label: "Ciudad" },
  { key: "address", label: "Dirección" },
  { key: "phone", label: "Teléfono" },
  { key: "responsible", label: "Responsable" },
  {
    key: "createdAt",
    label: "Fecha de creación",
    render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
  },
  {
    key: "status",
    label: "Estado",
  },
];
