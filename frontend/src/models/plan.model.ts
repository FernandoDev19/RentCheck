import type { Renter } from "./renter.model";

export interface Plan {
  id: number;
  name: string;
  price: number;
  // Cantidad total de Usuarios a nombre de una rentadora (Owner, Manager & Employees)
  max_users: number;
  // Cantidad total de Sucursales a nombre de una rentadora (Owner)
  max_branches: number;
  // Habilitar reportes avanzados
  advanced_reports_enabled: boolean;
  email_alerts_enabled: boolean;
  priority_support: boolean;

  renters?: Renter[];
}
