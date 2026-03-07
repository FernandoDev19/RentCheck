import { useCallback, useEffect, useState } from "react";
import DataTable, { type Column } from "../../common/components/DataTable";
import type { Rental } from "../../models/rental.model";
import type { ListResponse } from "../../common/interfaces/list-response.interface";
import { rentalService } from "../../services/rental.service";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { Branch } from "../../models/branch.model";
import type { Renter } from "../../models/renter.model";
import type { Customer } from "../../models/customer.model";
import type { Employee } from "../../models/employee.model";
import {
  rentalFeedbackService,
  SCORE_FIELDS,
  type CreateFeedbackScore,
} from "../../services/rental-feedback.service";
import FeedbackForm from "./components/FeedbackForm";
import PageHeader from "../../common/components/PageHeader";

const MySwal = withReactContent(Swal);

export default function PendingFeedbacks() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "expectedReturnDate",
    direction: "asc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const user = JSON.parse(localStorage.getItem("user")!);

  const columns: Column<Rental>[] = [
    {
      key: "customer",
      label: "Cliente",
      sortable: false,
      render: (_v, r) =>
        `${(r.customer as Customer)?.name} ${(r.customer as Customer)?.lastName}`,
    },
    {
      key: "renter",
      label: "Rentadora",
      sortable: false,
      render: (_v, r) => (r.renter as Renter)?.name ?? "-",
    },
    {
      key: "branch",
      label: "Sede",
      sortable: false,
      render: (_v, r) => (r.branch as Branch)?.name ?? "-",
    },
    {
      key: "employee",
      label: "Empleado",
      sortable: false,
      render: (_v, r) => (r.employee as Employee)?.name ?? "-",
    },
    {
      key: "startDate",
      label: "Fecha inicio",
      render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
    },
    {
      key: "expectedReturnDate",
      label: "Fecha devolución",
      render: (v) => {
        const date = new Date(v as string);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isLate = date < today;
        return (
          <span
            className={isLate ? "text-red-600 font-semibold" : "text-slate-700"}
          >
            {date.toLocaleDateString("es-CO")}
            {isLate && " ⚠️"}
          </span>
        );
      },
    },
    {
      key: "rentalStatus",
      label: "Estado",
      render: (val) => {
        const status = val as string;
        const colors: Record<string, string> = {
          active: "bg-green-100 text-green-700",
          returned: "bg-blue-100 text-blue-700",
          late: "bg-red-100 text-red-600",
          cancelled: "bg-gray-100 text-gray-500",
        };
        const labels: Record<string, string> = {
          active: "Activo",
          returned: "Devuelto",
          late: "Tardío",
          cancelled: "Cancelado",
        };
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-500"}`}
          >
            {labels[status] ?? status}
          </span>
        );
      },
    },
  ];

  const loadRentals = useCallback(async () => {
    const response: ListResponse<Rental> =
      await rentalService.getPendingFeedbacks({
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
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Error al cargar los feedbacks pendientes";
        MySwal.fire({ title: "Error", text: message, icon: "error" });
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

  const handleFeedback = async (row: Rental) => {
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
      console.log(value);
      await rentalFeedbackService.create(value);
      MySwal.fire({
        title: "✅ Feedback guardado",
        text: "El feedback ha sido registrado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      loadRentals();
    } catch (error: any) {
      MySwal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "No se pudo enviar la solicitud",
        icon: "error",
      });
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="Feedbacks"
        title="Feedbacks pendientes"
        description="Rentas devueltas que aún no han sido calificadas"
      />

      <DataTable
        data={rentals}
        columns={columns}
        pageSize={limit}
        serverSidePagination
        serverSideSearch
        serverSideSort
        currentPage={page}
        onPageChange={setPage}
        onSearchChange={handleSearchChange}
        onSortChange={(key, direction) =>
          handleSortChange(key, direction ?? "asc")
        }
        totalPages={totalPages}
        totalItems={totalItems}
        searchPlaceholder="Buscar por cliente, rentadora, sede..."
        emptyMessage="No hay rentas pendientes de feedback 🎉"
        actions={(row) => (
          <button
            onClick={() => handleFeedback(row)}
            className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer font-medium"
          >
            ✍️ Dar feedback
          </button>
        )}
      />
    </div>
  );
}
