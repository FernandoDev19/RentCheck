import { useCallback, useEffect, useState } from "react";
import type { ListResponse } from "../../../shared/types/list-response.type";
import type { Rental } from "../../../shared/types/rental.type";
import { rentalService } from "../../../services/rental.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { catchError } from "../../../shared/errors/catch-error";
import FeedbackForm from "../../pending-feedbacks/components/FeedbackForm";
import {
  rentalFeedbackService,
  SCORE_FIELDS,
  type CreateFeedbackScore,
} from "../../../services/rental-feedback.service";
import { useLoading } from "../../../core/context/loading-context/hooks/useLoading";

const MySwal = withReactContent(Swal);

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  returned: "Devuelto",
  late: "Tardío",
  cancelled: "Cancelado",
};

export const RENTAL_STATUS_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  returned: { bg: "bg-blue-100", text: "text-blue-700" },
  late: { bg: "bg-red-100", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500" },
};

export const useRentals = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "createdAt",
    direction: "desc",
  });
  const limit = 10;
  const { setLoading } = useLoading();

  const loadRentals = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [page, limit, orderBy.key, orderBy.direction, searchTerm, setLoading]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadRentals();
      } catch (error) {
        await catchError(error, MySwal, "Error al cargar las rentas");
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
    const isPending = row.rentalStatus === "pending";

    const { isConfirmed: confirmCancel } = await MySwal.fire({
      title: isPending ? "¿Eliminar renta?" : "¿Cancelar renta?",
      text: isPending
        ? "Esta renta aún no ha iniciado. Se eliminará sin afectar el historial del cliente."
        : "¿Estás seguro? Esta acción quedará registrada.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: isPending ? "Sí, eliminar" : "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!confirmCancel) return;

    // Renta pending → cancelar directo, sin feedback
    if (isPending) {
      try {
        await rentalService.cancelRental(row.id);
        MySwal.fire({
          title: "Renta eliminada",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        loadRentals();
      } catch (error) {
        await catchError(error, MySwal, "Error al eliminar la renta");
      }
      return;
    }

    const { isConfirmed, value } = await MySwal.fire({
      title: "📋 Motivo de cancelación",
      html: `
      <div style="text-align:left; font-size:13px;">
        <p style="color:#6b7280; margin:0 0 14px;">
          Registra el motivo antes de cancelar. Esto queda en el historial del cliente.
        </p>

        <p style="font-size:11px; font-weight:600; text-transform:uppercase; 
          color:#6b7280; margin:0 0 8px;">Flags críticos</p>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
          <label style="display:flex; align-items:center; gap:10px; padding:8px 12px;
            background:#fef2f2; border-radius:8px; cursor:pointer;">
            <input type="checkbox" id="flag-vehicleTheft" style="width:16px;height:16px;" />
            <span style="color:#dc2626; font-weight:600;">🚗 Sospecha de robo de vehículo</span>
          </label>
          <label style="display:flex; align-items:center; gap:10px; padding:8px 12px;
            background:#fef2f2; border-radius:8px; cursor:pointer;">
            <input type="checkbox" id="flag-impersonation" style="width:16px;height:16px;" />
            <span style="color:#dc2626; font-weight:600;">🪪 Sospecha de suplantación</span>
          </label>
        </div>

        <p style="font-size:11px; font-weight:600; text-transform:uppercase; 
          color:#6b7280; margin:0 0 6px;">Comentario <span style="color:#dc2626;">*</span></p>
        <textarea id="cancel-comments" rows="3"
          placeholder="Describe brevemente el motivo de la cancelación..."
          style="width:100%; padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px;
            font-size:13px; resize:none; outline:none; font-family:inherit;
            box-sizing:border-box;">
        </textarea>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "Cancelar renta",
      cancelButtonText: "Atrás",
      confirmButtonColor: "#d33",
      width: 480,
      focusConfirm: false,
      preConfirm: () => {
        const comments = (
          document.getElementById("cancel-comments") as HTMLTextAreaElement
        ).value.trim();
        if (!comments) {
          MySwal.showValidationMessage("El comentario es obligatorio");
          return false;
        }
        return {
          criticalFlags: {
            vehicleTheft: (
              document.getElementById("flag-vehicleTheft") as HTMLInputElement
            ).checked,
            impersonation: (
              document.getElementById("flag-impersonation") as HTMLInputElement
            ).checked,
          },
          comments,
        };
      },
    });

    if (!isConfirmed || !value) return;

    try {
      await rentalService.cancelRental(row.id);

      if (
        value.criticalFlags.vehicleTheft ||
        value.criticalFlags.impersonation
      ) {
        await rentalFeedbackService.create({
          rentalId: row.id,
          score: {
            damageToCar: 0,
            unpaidFines: 0,
            arrears: 0,
            carAbuse: 0,
            badAttitude: 0,
          },
          criticalFlags: value.criticalFlags,
          comments: value.comments,
        });
      }

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
  };
};
