import Paragraph from "../../../common/components/ui/Paragraph";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import type { Branch } from "../../../models/branch.model";

type Props = {
  row: Branch;
};

export default function ViewBranch({ row }: Props) {
  return (
    <div className="text-left text-lg space-y-4">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
          marginBottom: "12px",
        }}
      >
        <div>
          <TitleSpan>Nombre</TitleSpan>
          <Paragraph>{row.name}</Paragraph>
        </div>
        <div>
          <TitleSpan>Ciudad</TitleSpan>
          <Paragraph>{row.city ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Dirección</TitleSpan>
          <Paragraph>{row.address ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Celular</TitleSpan>
          <Paragraph>{row.phone}</Paragraph>
        </div>
        <div>
          <TitleSpan>Representante</TitleSpan>
          <Paragraph>{row.responsible}</Paragraph>
        </div>
        <div>
          <TitleSpan>Telefono representante</TitleSpan>
          <Paragraph>{row.responsiblePhone}</Paragraph>
        </div>
      </div>

      <hr />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
        }}
      >

        <div>
          <TitleSpan>Email</TitleSpan>
          <Paragraph>{row.email}</Paragraph>
        </div>
        <div>
          <TitleSpan>Estado</TitleSpan>
            <Paragraph>
            <span
                className={`py-[2px] px-2 rounded-full text-xs font-semibold ${row.status === true ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
                {row.status === true ? "Activo" : "Suspendido"}
            </span>
            </Paragraph>
        </div>
    </div>

      <hr />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
        }}
      >
        <div>
          <TitleSpan>Creado</TitleSpan>
          <Paragraph>
            {new Date(row.createdAt).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
        <div>
          <TitleSpan>Actualizado</TitleSpan>
          <Paragraph>
            {new Date(row.updatedAt).toLocaleDateString("es-CO")}
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
