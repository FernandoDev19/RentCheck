import { useEffect, useState } from "react";
import Paragraph from "../../../../../common/components/ui/Paragraph";
import TitleSpan from "../../../../../common/components/ui/TitleSpan";
import type { Branch } from "../../../../../models/branch.model";
import type { Employee } from "../../../../../models/employee.model";
import type { Renter } from "../../../../../models/renter.model";
import { getUser } from "../../../../dashboard/helpers/user.helper";
import { rentalService } from "../../../../../services/rental.service";
import { catchError } from "../../../../../common/errors/catch-error";
import Swal from "sweetalert2";
import type { Rental } from "../../../../../models/rental.model";

type Props = {
  rentalId: string;
};

export default function ViewRentalDetails({ rentalId }: Props) {
  const [rental, setRental] = useState<Rental>();
  const user = getUser();
  const feedback = rental?.rentalFeedback;
  const values = feedback ? (Object.values(feedback.score) as number[]) : [];
  const avg = values.length
    ? values.reduce((acc, val) => acc + val, 0) / values.length
    : null;

  useEffect(() => {
    const fetchRenter = async () => {
      try {
        const response = await rentalService.findOne(rentalId);
        console.log(response);
        setRental(response);
      } catch (error) {
        await catchError(error, Swal, "Error al obtener rentadora");
      }
    };
    fetchRenter();
  }, [rentalId]);

  return (
    <>
      <div className="text-left text-sm" style={{ lineHeight: "1.8" }}>
        <TitleSpan className="mb-4">Datos de la renta</TitleSpan>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 16px",
            marginBottom: "12px",
          }}
        >
          {rental?.renter?.id === user?.renterId && (
            <>
              <div>
                <TitleSpan>Rentadora</TitleSpan>
                <Paragraph>{(rental?.renter as Renter)?.name}</Paragraph>
              </div>
              <div>
                <TitleSpan>Sede</TitleSpan>
                <Paragraph>{(rental?.branch as Branch)?.name ?? "-"}</Paragraph>
              </div>
              <div>
                <TitleSpan>Empleado</TitleSpan>
                <Paragraph>
                  {(rental?.employee as Employee)?.name ?? "-"}
                </Paragraph>
              </div>
            </>
          )}
          <div>
            <TitleSpan>Estado</TitleSpan>
            <Paragraph>
              <span
                className="py-1 px-2 rounded-full text-xs font-semibold"
                style={{
                  background:
                    rental?.rentalStatus === "active"
                      ? "#dcfce7"
                      : rental?.rentalStatus === "returned"
                        ? "#dbeafe"
                        : rental?.rentalStatus === "late"
                          ? "#fee2e2"
                          : "#f3f4f6",
                  color:
                    rental?.rentalStatus === "active"
                      ? "#16a34a"
                      : rental?.rentalStatus === "returned"
                        ? "#2563eb"
                        : rental?.rentalStatus === "late"
                          ? "#dc2626"
                          : "#6b7280",
                }}
              >
                {rental?.rentalStatus === "active"
                  ? "Activo"
                  : rental?.rentalStatus === "returned"
                    ? "Devuelto"
                    : rental?.rentalStatus === "late"
                      ? "Tardío"
                      : "Cancelado"}
              </span>
            </Paragraph>
          </div>
          <div>
            <TitleSpan>Fecha inicio</TitleSpan>
            <Paragraph>
              {new Date(rental?.startDate || "").toLocaleDateString("es-CO")}
            </Paragraph>
          </div>
          <div>
            <TitleSpan>Devolución esperada</TitleSpan>
            <Paragraph>
              {new Date(rental?.expectedReturnDate || "").toLocaleDateString(
                "es-CO",
              )}
            </Paragraph>
          </div>
          <div>
            <TitleSpan>Devolución real</TitleSpan>
            <Paragraph>
              {rental?.actualReturnDate
                ? new Date(rental?.actualReturnDate || "").toLocaleDateString(
                    "es-CO",
                  )
                : "-"}
            </Paragraph>
          </div>
        </div>

        <hr className="my-4" />

        <TitleSpan>Feedback</TitleSpan>

        {!feedback ? (
          <p className="text-[#6b7280] text-xs">
            Esta renta aún no tiene feedback registrado.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 16px",
                marginBottom: "12px",
              }}
            >
              <div>
                <TitleSpan>Score promedio</TitleSpan>
                <Paragraph>
                  <span
                    style={{
                      color:
                        avg && avg >= 4
                          ? "#16a34a"
                          : avg && avg >= 2.5
                            ? "#92400e"
                            : "#dc2626",
                    }}
                  >
                    {avg ? avg.toFixed(1) : 0} / 5
                  </span>
                </Paragraph>
              </div>
              <div>
                <TitleSpan>Daño al vehículo</TitleSpan>
                <Paragraph>{feedback.score.damageToCar} / 5</Paragraph>
              </div>
              <div>
                <TitleSpan>Multas impagas</TitleSpan>
                <Paragraph>{feedback.score.unpaidFines} / 5</Paragraph>
              </div>
              <div>
                <TitleSpan>Atrasos</TitleSpan>
                <Paragraph>{feedback.score.arrears} / 5</Paragraph>
              </div>
              <div>
                <TitleSpan>Abuso del vehículo</TitleSpan>
                <Paragraph>{feedback.score.carAbuse} / 5</Paragraph>
              </div>
              <div>
                <TitleSpan>Mala Actitud</TitleSpan>
                <Paragraph>{feedback.score.badAttitude} / 5</Paragraph>
              </div>
            </div>
            <div>
              <TitleSpan>Flags críticos</TitleSpan>
              <Paragraph>
                {feedback
                  ? Object.entries(feedback.criticalFlags)
                      .filter(([_, v]) => v === true)
                      .map(([key]) => {
                        const labels: Record<string, string> = {
                          vehicleTheft: "🚗 Robo de vehículo",
                          impersonation: "🪪 Suplantación de identidad",
                        };
                        
                        return (
                          <span
                            style={{
                              padding: "2px 8px",
                              background: "#fee2e2",
                              color: "#dc2626",
                              borderRadius: "9999px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {labels[key] ?? key}
                          </span>
                        );
                      }) ||
                    <span style={{ color: "#6b7280", fontSize: "12px" }}>
                      Sin flags críticos
                    </span>
                  : <span style={{ color: "#6b7280", fontSize: "12px" }}>
                      Sin feedback
                    </span>}
              </Paragraph>
            </div>
            
            {feedback.comments &&
              (
            <div className="mt-2">
              <TitleSpan>Comentarios</TitleSpan>
              <Paragraph className="my-1 text-[#374151] text-xs bg-[#f9fafb] rounded-lg py-2 px-3">{feedback.comments}</Paragraph>
            </div>
          )}
          </>
        )}
      </div>
    </>
  );
}
