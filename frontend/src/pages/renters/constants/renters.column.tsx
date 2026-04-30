import type { Column } from "../../../shared/components/datatable/types/column.type";
import type { Renter } from "../../../shared/types/renter.type";

export const columns: Column<Renter>[] = [
    { key: "name", label: "Nombre" },
    { key: "nit", label: "NIT" },
    { key: "city", label: "Ciudad" },
    { key: "address", label: "Dirección" },
    { key: "phone", label: "Teléfono" },
    {
      key: "plan",
      label: "Plan",
      sortable: false,
      render: (_val, row) => row.plan?.name ?? "-",
    },
    {
      key: "balance",
      label: "Balance",
      render: (val) =>
        typeof val === "number"
          ? val.toLocaleString("es-CO")
          : String(val ?? "-"),
    },
    {
      key: "status",
      label: "Estado",
      render: (val) => (val === "active" ? "Activo" : "Suspendido"),
    },
    {
      key: "createdAt",
      label: "Fecha de creación",
      render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
    },
  ];