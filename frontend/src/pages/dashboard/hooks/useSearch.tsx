import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../shared/types/customer.type";
import { customerService } from "../../../services/customer.service";
import RentalsByCustomerTable from "../../customers/components/rentals-by-customer-table/RentalsByCustomerTable";
import ViewCustomer from "../../customers/components/ViewCustomer";
import { useCreateRental } from "../../rentals/hooks/useCreateRental";
import { CUSTOMER_STATUS } from "../../customers/interfaces/customer-status.interface";
import { CUSTOMER_STATUS_LABELS } from "../../customers/constants/customer-status-label";
import { catchError } from "../../../shared/errors/catch-error";

const MySwal = withReactContent(Swal);

export const useSearch = () => {
  const [searching, setSearching] = useState(false);

  const { handleCreateClick } = useCreateRental();

  const handleSearch = async () => {
    const { value: identityNumber, isConfirmed } = await MySwal.fire({
      title: "🔍 Buscar Cliente",
      html: `<input id="swal-identity" class="swal2-input" placeholder="Número de cédula / NIT" />`,
      confirmButtonText: "Buscar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f172a",
      preConfirm: () => {
        const val = (
          document.getElementById("swal-identity") as HTMLInputElement
        ).value.trim();
        if (!val) {
          MySwal.showValidationMessage("Ingresa un número de identificación");
          return false;
        }
        return val;
      },
    });

    if (!isConfirmed || !identityNumber) return;

    setSearching(true);
    let customer: Customer | null = null;

    try {
      customer = await customerService.findByIdentity(identityNumber);
    } catch (e) {
      await catchError(e, MySwal, "Error al buscar cliente");
    }

    if (!customer) {
      setSearching(false);
      return MySwal.fire({
        title: "Cliente no encontrado",
        text: "Este cliente no tiene historial en RentCheck",
        icon: "info",
        confirmButtonColor: "#0f172a",
      });
    }

    try {
      if (
        customer.status !== CUSTOMER_STATUS.NORMAL &&
        customer.status !== CUSTOMER_STATUS.YELLOW_ALERT
      ) {
        const rentalsWithCriticalFlags =
          customer.rentals
            ?.filter((rental) => rental.rentalFeedback?.criticalFlags)
            .filter((rental) => {
              const flags = rental?.rentalFeedback!.criticalFlags;
              return flags.vehicleTheft || flags.impersonation;
            }) ?? [];
  
        const flagLabels: Record<string, string> = {
          vehicleTheft: "🚗 Robo de vehículo",
          impersonation: "🪪 Suplantación de identidad",
        };
  
        const flagSummary: Record<
          string,
          { count: number; cities: Set<string> }
        > = {};
  
        for (const rental of rentalsWithCriticalFlags) {
          const flags = rental?.rentalFeedback!.criticalFlags;
          const city =
            rental.branch?.city ?? rental.renter?.city ?? rental.renter.name ?? "Ciudad desconocida";
  
          for (const [key, active] of Object.entries(flags)) {
            if (!active) continue;
            if (!flagSummary[key])
              flagSummary[key] = { count: 0, cities: new Set() };
            flagSummary[key].count++;
            flagSummary[key].cities.add(city);
          }
        }
  
        const flagsHtml = Object.entries(flagSummary)
          .map(
            ([key, { count, cities }]) => `
              <li style="margin-bottom:8px;">
                <span style="font-weight:700;">${flagLabels[key] ?? key}</span>
                <span style="font-weight:400; color:#9b1c1c;">
                  — ${count} ${count === 1 ? "vez" : "veces"}
                </span>
                <div style="font-size:11px; color:#b91c1c; margin-top:2px;">
                  📍 ${[...cities].join(", ")}
                </div>
              </li>
            `,
          )
          .join("");
  
        // Mostrar advertencia ANTES del swal de crear renta
        await MySwal.fire({
          title: "⚠️ Cliente en alerta",
          html: `
            <p style="color:#6b7280; margin-bottom:12px; font-size:13px;">
              Estado: <strong style="color:#dc2626">${CUSTOMER_STATUS_LABELS[customer.status]}</strong>
              — reportado en <strong>${rentalsWithCriticalFlags.length}</strong> ${rentalsWithCriticalFlags.length === 1 ? "renta" : "rentas"}
            </p>
            <ul style="text-align:left; list-style:none; padding:12px 16px; margin:0;
              background:#fee2e2; border-radius:8px; color:#dc2626;">
              ${flagsHtml}
            </ul>
          `,
          icon: "warning",
        });
      }
  
      await MySwal.fire({
        title: "Resultado de búsqueda",
        html: <ViewCustomer customer={customer} />,
        showConfirmButton: true,
        confirmButtonText: "Crear renta",
        showCloseButton: true,
        width: 540,
        didOpen: () => {
          document
            .getElementById("btn-ver-rentas")
            ?.addEventListener("click", () => {
              MySwal.close();
              MySwal.fire({
                title: `Historial — ${customer.name} ${customer.lastName}`,
                html: <RentalsByCustomerTable customerId={customer.id} />,
                showConfirmButton: false,
                showCloseButton: true,
                width: 780,
              });
            });
        },
        preConfirm: async () => {
          await handleCreateClick(() => {}, identityNumber);
          return true;
        },
      });
    } catch (error) {
      console.error('Error', error);
    } finally {
      setSearching(false);
    }


  };

  return {
    handleSearch,
    searching,
  };
};
