import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Rental } from "../../../models/rental.model";
import type { Customer } from "../../../models/customer.model";
import FeedbackForm from "../components/FeedbackForm";
import {
  rentalFeedbackService,
  SCORE_FIELDS,
  type CreateFeedbackScore,
} from "../../../services/rental-feedback.service";
import { catchError } from "../../../common/errors/catch-error";

export const useCreateFeedback = () => {
  const MySwal = withReactContent(Swal);

  const handleFeedback = async (row: Rental, loadRentals: () => Promise<void> | void) => {
    const { isConfirmed, value } = await MySwal.fire({
      title: `Feedback — ${(row.customer as Customer)?.name} ${(row.customer as Customer)?.lastName}`,
      html: <FeedbackForm row={row} />,
      width: 560,
      showCancelButton: true,
      confirmButtonText: "Guardar feedback",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      focusConfirm: false,
      preConfirm: () => {
        const score: CreateFeedbackScore = {
          damageToCar: 0,
          unpaidFines: 0,
          arrears: 0,
          carAbuse: 0,
          badAttitude: 0,
        };
        for (const { key } of SCORE_FIELDS) {
          const selected = document.querySelector(
            `input[name="score-${key}"]:checked`,
          ) as HTMLInputElement;

          if (!selected) {
            MySwal.showValidationMessage(`Por favor califica: ${key}`);
            return false;
          }

          score[key] = parseInt(selected.value);
        }

        return {
          rentalId: row.id,
          score,
          criticalFlags: {
            vehicleTheft: (
              document.getElementById("flag-vehicleTheft") as HTMLInputElement
            ).checked,
            impersonation: (
              document.getElementById("flag-impersonation") as HTMLInputElement
            ).checked,
          },
          comments:
            (
              document.getElementById(
                "feedback-comments",
              ) as HTMLTextAreaElement
            ).value || undefined,
        };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await rentalFeedbackService.create(value);
      MySwal.fire({
        title: "✅ Feedback guardado",
        text: "El feedback ha sido registrado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadRentals();
    } catch (error) {
      await catchError(error, MySwal, "Error al guardar el feedback");
    }
  };

  return {
    handleFeedback,
  };
};
