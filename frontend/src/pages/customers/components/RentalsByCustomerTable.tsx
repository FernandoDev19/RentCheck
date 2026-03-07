import { useEffect, useState } from "react";
import type { Column } from "../../../common/components/DataTable";
import type { Rental } from "../../../models/rental.model";
import { rentalService } from "../../../services/rental.service";
import DataTable from "../../../common/components/DataTable";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import type { Renter } from "../../../models/renter.model";
import type { Branch } from "../../../models/branch.model";
import type { Employee } from "../../../models/employee.model";
import { getUser } from "../../dashboard/helpers/user.helper";

const MySwal = withReactContent(Swal);

export default function RentalsByCustomerTable({
  customerId,
}: {
  customerId: string;
}) {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  useEffect(() => {
    rentalService.getAllByCustomer(customerId, { page, limit }).then((res) => {
      setRentals(res.data);
      setTotalPages(res.lastPage);
      setTotalItems(res.total);
    });
  }, [customerId, page]);

  const user = getUser();

  const columns: Column<Rental>[] = [
    {
      key: "renter",
      label: "Rentadora",
      sortable: false,
      render: (_v, r) => {
        const renter = r.renter as Renter;
        return renter.id === user?.renterId ? renter.name : "-";
      },
    },
    {
      key: "branch",
      label: "Sede",
      sortable: false,
      render: (_v, r) => {
        const branch = r.branch as Branch;
        return branch?.renterId === user?.renterId ? branch.name : "-";
      },
    },
    {
      key: "startDate",
      label: "Inicio",
      render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
    },
    {
      key: "actualReturnDate",
      label: "Devolución",
      render: (v) =>
        v ? new Date(v as string).toLocaleDateString("es-CO") : "-",
    },
    {
      key: "rentalStatus",
      label: "Estado",
      sortable: false,
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
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status]}`}
          >
            {labels[status]}
          </span>
        );
      },
    },
    {
      key: "rentalFeedback",
      label: "Score",
      sortable: false,
      render: (_v, r) => {
        if (!r.rentalFeedback) return <span className="text-slate-400">-</span>;

        const scores = Object.values(r.rentalFeedback.score) as number[];

        const invertedTotal = scores.reduce((acc, val) => acc + (5 - val), 0);
        const avg = invertedTotal / scores.length;

        const color =
          avg >= 4
            ? "text-green-600"
            : avg >= 2.5
              ? "text-yellow-600"
              : "text-red-600";

        return (
          <span className={`font-semibold text-xs ${color}`}>
            {avg.toFixed(1)}/5
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Creado",
      render: (v) => new Date(v as string).toLocaleDateString("es-CO"),
    },
  ];

  const handleViewRentalInfo = (r: Rental) => {
    const feedback = r.rentalFeedback;
    const values = feedback ? (Object.values(feedback.score) as number[]) : [];

    // Aquí es donde está el truco: invertimos cada valor antes de promediar
    const avg = values.length
      ? values.reduce((acc, val) => acc + (5 - val), 0) / values.length
      : null;

    const flagsHtml = feedback
      ? Object.entries(feedback.criticalFlags)
          .filter(([_, v]) => v === true)
          .map(([key]) => {
            const labels: Record<string, string> = {
              vehicleTheft: "🚗 Robo de vehículo",
              impersonation: "🪪 Suplantación de identidad",
            };
            return `<span style="padding:2px 8px; background:#fee2e2; color:#dc2626; 
            border-radius:9999px; font-size:11px; font-weight:600;">
            ${labels[key] ?? key}
          </span>`;
          })
          .join(" ") ||
        `<span style="color:#6b7280; font-size:12px;">Sin flags críticos</span>`
      : `<span style="color:#6b7280; font-size:12px;">Sin feedback</span>`;

    MySwal.fire({
      title: "Detalle de la renta",
      html: `
      <div style="text-align:left; font-size:14px; line-height:1.8;">

        <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#4f46e5; margin:0 0 8px;">
          Datos de la renta
        </p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
        ${(r.renter as Renter).id === user?.renterId ? `
          
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Rentadora</span>
              <p style="margin:0; color:#111827; font-weight:500;">${(r.renter as Renter).name}</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Sede</span>
              <p style="margin:0; color:#111827; font-weight:500;">${(r.branch as Branch)?.name ?? "-"}</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Empleado</span>
              <p style="margin:0; color:#111827; font-weight:500;">${(r.employee as Employee)?.name ?? "-"}</p>
            </div>
          ` : ''}
          <div>
            <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Estado</span>
            <p style="margin:0;">
              <span style="padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:600;
                background:${r.rentalStatus === "active" ? "#dcfce7" : r.rentalStatus === "returned" ? "#dbeafe" : r.rentalStatus === "late" ? "#fee2e2" : "#f3f4f6"};
                color:${r.rentalStatus === "active" ? "#16a34a" : r.rentalStatus === "returned" ? "#2563eb" : r.rentalStatus === "late" ? "#dc2626" : "#6b7280"};">
                ${r.rentalStatus === "active" ? "Activo" : r.rentalStatus === "returned" ? "Devuelto" : r.rentalStatus === "late" ? "Tardío" : "Cancelado"}
              </span>
            </p>
          </div>
          <div>
            <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Fecha inicio</span>
            <p style="margin:0; color:#111827; font-weight:500;">${new Date(r.startDate).toLocaleDateString("es-CO")}</p>
          </div>
          <div>
            <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Devolución esperada</span>
            <p style="margin:0; color:#111827; font-weight:500;">${new Date(r.expectedReturnDate).toLocaleDateString("es-CO")}</p>
          </div>
          <div>
            <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Devolución real</span>
            <p style="margin:0; color:#111827; font-weight:500;">
              ${r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString("es-CO") : "-"}
            </p>
          </div>
        </div>

        <hr style="border:none; border-top:1px solid #e5e7eb; margin:12px 0;" />

        <p style="font-size:11px; font-weight:600; text-transform:uppercase; color:#4f46e5; margin:0 0 8px;">
          Feedback
        </p>

        ${
          !feedback
            ? `
          <p style="color:#6b7280; font-size:13px;">Esta renta aún no tiene feedback registrado.</p>
        `
            : `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; margin-bottom:12px;">
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Score promedio</span>
              <p style="margin:0; font-weight:700; font-size:16px; color:${avg && avg >= 4 ? "#16a34a" : avg && avg >= 2.5 ? "#92400e" : "#dc2626"};">
                ${avg ? avg.toFixed(1) : "-"} / 5
              </p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Daño al vehículo</span>
              <p style="margin:0; color:#111827; font-weight:500;">${feedback.score.damageToCar} / 5</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Multas impagas</span>
              <p style="margin:0; color:#111827; font-weight:500;">${feedback.score.unpaidFines} / 5</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Atrasos</span>
              <p style="margin:0; color:#111827; font-weight:500;">${feedback.score.arrears} / 5</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Abuso del vehículo</span>
              <p style="margin:0; color:#111827; font-weight:500;">${feedback.score.carAbuse} / 5</p>
            </div>
            <div>
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Mala Actitud</span>
              <p style="margin:0; color:#111827; font-weight:500;">${feedback.score.badAttitude} / 5</p>
            </div>
          </div>

          <div>
            <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Flags críticos</span>
            <p style="margin:4px 0 0;">${flagsHtml}</p>
          </div>

          ${
            feedback.comments
              ? `
            <div style="margin-top:8px;">
              <span style="color:#6b7280; font-size:11px; text-transform:uppercase; font-weight:600;">Comentarios</span>
              <p style="margin:4px 0 0; color:#374151; font-size:13px; background:#f9fafb; 
                padding:8px 12px; border-radius:8px;">${feedback.comments}</p>
            </div>
          `
              : ""
          }
        `
        }

      </div>
    `,
      showConfirmButton: false,
      showCloseButton: true,
      width: 560,
    });
  };

  return (
    <DataTable
      data={rentals}
      columns={columns}
      pageSize={limit}
      serverSidePagination
      currentPage={page}
      onPageChange={setPage}
      totalPages={totalPages}
      totalItems={totalItems}
      searchable={false}
      emptyMessage="Sin rentas registradas"
      actions={(r) => (
        <button
          onClick={() => handleViewRentalInfo(r)}
          className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition cursor-pointer"
        >
          Ver info
        </button>
      )}
    />
  );
}
