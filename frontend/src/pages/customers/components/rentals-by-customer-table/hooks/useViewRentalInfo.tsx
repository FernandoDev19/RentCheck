import withReactContent from "sweetalert2-react-content";
import ViewRentalDetails from "../components/ViewRentalDetails";
import Swal from "sweetalert2";

const MySwal = withReactContent(Swal);

export const useViewRentalInfo = () => {

  const handleViewRentalInfo = (rentalId: string) => {
    MySwal.fire({
      title: "Detalle de la renta",
      html: <ViewRentalDetails rentalId={rentalId} />,
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
    });
  };

  return {
    handleViewRentalInfo
  }
};