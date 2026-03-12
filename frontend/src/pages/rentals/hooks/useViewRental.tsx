import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Rental } from "../../../models/rental.model";
import ViewRental from "../components/ViewRental";

const MySwal = withReactContent(Swal);

export const useViewRental = () => {
  const handleViewDetails = (row: Rental) => {

    MySwal.fire({
      title: `Detalle de Renta #${row.id.slice(0, 8)}...`,
      html: <ViewRental row={row} />,
      confirmButtonColor: "#4f46e5",
      width: 500,
    });
  };

  return {
    handleViewDetails,
  };
};
