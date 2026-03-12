import Paragraph from "../../../common/components/ui/Paragraph";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import type { Renter } from "../../../models/renter.model";

type Props = {
  renter: Renter;
};

export default function ViewRenter({ renter }: Props) {
  return (
            <div className="text-left text-sm" style={{ lineHeight: "1.8" }}>
    
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: "12px" }}>
                <div>
                    <TitleSpan>Nombre</TitleSpan>
                    <Paragraph>{renter.name}</Paragraph>
                </div>
                <div>
                    <TitleSpan>NIT</TitleSpan>
                    <Paragraph>{renter.nit}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Ciudad</TitleSpan>
                    <Paragraph>{renter.city}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Dirección</TitleSpan>
                    <Paragraph>{renter.address}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Teléfono</TitleSpan>
                    <Paragraph>{renter.phone}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Representante Legal</TitleSpan>
                    <Paragraph>{renter.legalRepresentative}</Paragraph>
                </div>
                </div>
    
                <hr />
    
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: "12px" }}>
                <div>
                    <TitleSpan>Plan</TitleSpan>
                    <Paragraph>{renter.plan?.name ?? "-"}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Vence</TitleSpan>
                    <Paragraph>{renter.planExpiresAt ? new Date(renter.planExpiresAt).toLocaleDateString("es-CO") : "-"}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Balance</TitleSpan>
                    <Paragraph>${renter.balance.toLocaleString("es-CO")}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Umbral de alerta</TitleSpan>
                    <Paragraph>${renter.lowBalanceThreshold.toLocaleString("es-CO")}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Alerta balance bajo</TitleSpan>
                    <Paragraph>
                        <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: renter.lowBalanceAlertEnabled ? "#dcfce7" : "#f3f4f6",
                            color: renter.lowBalanceAlertEnabled ? "#16a34a" : "#6b7280"
                        }}>
                            {renter.lowBalanceAlertEnabled ? "Activa" : "Inactiva"}
                        </span>
                    </Paragraph>
                </div>
                <div>
                    <TitleSpan>Estado</TitleSpan>
                    <Paragraph>
                        <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: renter.status === "active" ? "#dcfce7" : "#fee2e2",
                            color: renter.status === "active" ? "#16a34a" : "#dc2626"
                        }}>
                            {renter.status === "active" ? "Activo" : "Suspendido"}
                        </span>
                    </Paragraph>
                </div>
                </div>
    
                <hr />
    
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                <div>
                    <TitleSpan>Creado</TitleSpan>
                    <Paragraph>${new Date(renter.createdAt).toLocaleDateString("es-CO")}</Paragraph>
                </div>
                <div>
                    <TitleSpan>Actualizado</TitleSpan>
                    <Paragraph>${new Date(renter.updatedAt).toLocaleDateString("es-CO")}</Paragraph>
                </div>
                </div>
    
            </div>
            )
            
}
