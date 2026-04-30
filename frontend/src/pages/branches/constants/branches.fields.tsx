import type { CardField } from "../../../shared/components/card-list/CardItem";
import type { Branch } from "../../../shared/types/branch.type";

export const BranchesField: CardField<Branch>[] = [
  {
    key: "name",
    label: "Nombre",
  },
  { key: "city", label: "Ciudad" },
  { key: "address", label: "Dirección" },
  { key: "phone", label: "Teléfono" },
  { key: "responsible", label: "Responsable" },
  {
    key: "createdAt",
    label: "Fecha de creación",
    render: (val) => new Date(val as string).toLocaleDateString("es-CO"),
  },
];
