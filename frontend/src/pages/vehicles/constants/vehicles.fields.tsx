import type { Vehicle } from "../../../shared/types/vehicle.type";

export const cardFields = [
    {
      key: "brand" as keyof Vehicle,
      label: "Marca / Modelo",
      render: (_: unknown, row: Vehicle) => `${row.brand} ${row.model}`,
    },
    { key: "year" as keyof Vehicle, label: "Año" },
    { key: "color" as keyof Vehicle, label: "Color" },
    // {
    //   key: "insuredValue" as keyof Vehicle,
    //   label: "Valor asegurado",
    //   render: (val: unknown) =>
    //     val ? `$${Number(val).toLocaleString("es-CO")}` : "—",
    // },
  ];