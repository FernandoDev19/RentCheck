import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Customer } from "../../../../../models/customer.model";
import { customerService } from "../../../../../services/customer.service";
import RentalsByCustomerTable from "../../../../customers/components/RentalsByCustomerTable";
import ViewCustomer from "../../../../customers/components/ViewCustomer";
import { useCreateRental } from "../../../../rentals/hooks/useCreateRental";

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
    try {
      const customer: Customer =
        await customerService.findByIdentity(identityNumber);

      if (
        customer &&
        customer.status !== "normal" &&
        customer.status !== "yellow_alert"
      ) {
        // Recopilar qué critical flags están activos
        const activeFlags = customer.rentals
          ?.flatMap((rental) => rental.rentalFeedback)
          ?.flatMap((fb) => Object.entries(fb?.criticalFlags ?? {}))
          .filter(([_, value]) => value === true)
          .map(([key]) => key);

        const flagLabels: Record<string, string> = {
          vehicleTheft: "🚗 Robo de vehículo",
          impersonation: "🪪 Suplantación de identidad",
          // agrega más si tienes
        };

        const flagsHtml = activeFlags?.length
          ? activeFlags.map((f) => `<li>${flagLabels[f] ?? f}</li>`).join("")
          : "<li>Sin flags específicos</li>";

        // Mostrar advertencia ANTES del swal de crear renta
        await MySwal.fire({
          title: "⚠️ Cliente en alerta",
          html: `
            <p style="color:#6b7280; margin-bottom:12px;">
              Este cliente tiene estado <strong style="color:#dc2626">${customer.status}</strong>.
              Se han reportado los siguientes flags críticos:
            </p>
            <ul style="text-align:left; color:#dc2626; font-weight:600; list-style:none; padding:0; 
              background:#fee2e2; border-radius:8px; padding:12px 16px; margin:0;">
              ${flagsHtml}
            </ul>
          `,
          icon: "warning",
        });
      }

      MySwal.fire({
        title: "Resultado de búsqueda",
        html: <ViewCustomer row={customer} />,
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
        }
      });
    } catch {
      MySwal.fire({
        title: "Cliente no encontrado",
        text: "Este cliente no tiene historial en RentCheck",
        icon: "info",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setSearching(false);
    }
  };

  return {
    handleSearch,
    searching
  };
};
