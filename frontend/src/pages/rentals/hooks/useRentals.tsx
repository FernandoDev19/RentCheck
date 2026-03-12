import { useCallback, useEffect, useState } from "react";
import type { ListResponse } from "../../../common/interfaces/list-response.interface";
import type { Rental } from "../../../models/rental.model";
import { rentalService } from "../../../services/rental.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { catchError } from "../../../common/errors/catch-error";
import FeedbackForm from "../../pending-feedbacks/components/FeedbackForm";
import { rentalFeedbackService, SCORE_FIELDS, type CreateFeedbackScore } from "../../../services/rental-feedback.service";

const MySwal = withReactContent(Swal);

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  returned: "Devuelto",
  late: "Tardío",
  cancelled: "Cancelado",
};

export const RENTAL_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  returned: { bg: "bg-blue-100", text: "text-blue-700" },
  late: { bg: "bg-red-100", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500" },
};

export const useRentals = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "startDate",
    direction: "desc",
  });
  const limit = 10;

  const loadRentals = useCallback(async () => {
    const response: ListResponse<Rental> = await rentalService.getAll({
      page,
      limit,
      orderBy: orderBy.key,
      orderDir: orderBy.direction,
      search: searchTerm,
    });
    setRentals(response.data);
    setTotalItems(response.total);
    setTotalPages(response.lastPage);
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm]);

  useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        await loadRentals();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar las rentas");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [loadRentals]);

  const handleSearchChange = (term: string) => {
    setPage(1);
    setSearchTerm(term);
  };

  const handleSortChange = (key: string, direction: string = "asc") => {
    if (!key) return;
    setPage(1);
    setOrderBy({ key, direction: direction === "desc" ? "desc" : "asc" });
  };

  const handleReturn = async (row: Rental) => {
    const result = await MySwal.fire({
      title: "¿Marcar como devuelto?",
      text: "¿Estás seguro de que quieres marcar esta renta como devuelto?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, marcar como devuelto",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    try {
      await rentalService.returnRental(row.id);
    } catch (error) {
      await catchError(error, MySwal, "Error al marcar como devuelto");
      return;
    }

    // ── Inmediatamente abre el feedback ──

    const { isConfirmed, value } = await MySwal.fire({
      title: `✍️ Feedback — ${row.customer?.name} ${row.customer?.lastName}`,
      html: <FeedbackForm row={row} />,
      showCancelButton: true,
      confirmButtonText: "Guardar feedback",
      cancelButtonText: "Omitir por ahora",
      confirmButtonColor: "#4f46e5",
      width: 560,
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

    loadRentals();

    if (!isConfirmed || !value) return;

    try {
      await rentalFeedbackService.create(value);
      MySwal.fire({
        title: "✅ Todo listo",
        text: "Renta devuelta y feedback guardado",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      await catchError(error, MySwal, "Error al guardar feedback");
    }
  };

  const handleDelete = async (row: Rental) => {
    const result = await MySwal.fire({
      title: "¿Cancelar Renta?",
      text: "¿Estás seguro de que quieres cancelar esta renta?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await rentalService.cancelRental(row.id);
        MySwal.fire({
          title: "Renta cancelada",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRentals();
      } catch (error) {
        await catchError(error, MySwal, "Error al cancelar la renta");
      }
    }
  };

  return {
    rentals,
    totalItems,
    totalPages,
    page,
    limit,
    setPage,
    handleReturn,
    handleDelete,
    loadRentals,
    handleSearchChange,
    handleSortChange,
    isLoading
  };
};
