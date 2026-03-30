import { useCallback } from "react";
import AvailabilityModalContent from "../components/AvailabilityModalContent";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withReactContent(Swal);

export const useVehicleAvailability = () => {
  const openAvailabilityModal = useCallback((onRentalCreated?: () => void) => {
    MySwal.fire({
      title: "🚗 Disponibilidad de vehículos",
      html: (
        <AvailabilityModalContent
          onClose={() => MySwal.close()}
          onRentalCreated={onRentalCreated ?? (() => {})}
        />
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: 640,
    });
  }, []);

  return { openAvailabilityModal };
};