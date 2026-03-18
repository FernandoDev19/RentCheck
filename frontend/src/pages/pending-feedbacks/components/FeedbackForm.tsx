import { useState } from "react";
import type { Rental } from "../../../models/rental.model";
import type { Branch } from "../../../models/branch.model";
import { SCORE_FIELDS } from "../../../services/rental-feedback.service";
import TitleSpan from "../../../common/components/ui/TitleSpan";
import Paragraph from "../../../common/components/ui/Paragraph";

export default function FeedbackForm({ row }: { row: Rental }) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState({ vehicleTheft: false, impersonation: false });

  const hasCriticalFlag = flags.vehicleTheft || flags.impersonation;

  const handleFlagChange = (flag: keyof typeof flags, checked: boolean) => {
    const newFlags = { ...flags, [flag]: checked };
    setFlags(newFlags);

    // Si se activa cualquier flag → forzar todos los scores a 1
    if (newFlags.vehicleTheft || newFlags.impersonation) {
      const forced: Record<string, number> = {};
      SCORE_FIELDS.forEach(({ key }) => { forced[key] = 1; });
      setScores(forced);
    }
  };

  const effectiveScore = (key: string) =>
    hasCriticalFlag ? 1 : scores[key];

  return (
    <div className="text-left text-sm">
      {/* Info renta */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <TitleSpan>Cliente</TitleSpan>
          <Paragraph>{row.customer?.name} {row.customer?.lastName}</Paragraph>
        </div>
        <div>
          <TitleSpan>Sede</TitleSpan>
          <Paragraph>{(row.branch as Branch)?.name ?? "-"}</Paragraph>
        </div>
        <div>
          <TitleSpan>Inicio</TitleSpan>
          <Paragraph>{new Date(row.startDate).toLocaleDateString("es-CO")}</Paragraph>
        </div>
        <div>
          <TitleSpan>Devolución esp.</TitleSpan>
          <Paragraph>{new Date(row.expectedReturnDate).toLocaleDateString("es-CO")}</Paragraph>
        </div>
      </div>

      {/* Scores */}
      <p className="text-xs font-bold uppercase text-indigo-600 mb-3">
        Calificación (1 = Peor, 5 = Mejor)
      </p>

      {hasCriticalFlag && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold">
          ⚠️ Flag crítico activo — todas las calificaciones se fijan en 1
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        {SCORE_FIELDS.map(({ key, label }) => {
          const current = effectiveScore(key);
          return (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {label}
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={hasCriticalFlag ? "cursor-not-allowed" : "cursor-pointer"}>
                    <input
                      type="radio"
                      name={`score-${key}`}
                      value={n}
                      className="hidden"
                      checked={current === n}
                      disabled={hasCriticalFlag}
                      onChange={() => {
                        if (!hasCriticalFlag)
                          setScores((prev) => ({ ...prev, [key]: n }));
                      }}
                    />
                    <span
                      onClick={() => {
                        if (!hasCriticalFlag)
                          setScores((prev) => ({ ...prev, [key]: n }));
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold transition
                        ${hasCriticalFlag
                          ? n === 1
                            ? "bg-red-400 text-white cursor-not-allowed"
                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                          : current !== undefined && n <= current
                            ? "bg-primary text-white cursor-pointer"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                        }`}
                    >
                      {n}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <hr className="border-slate-200 my-3" />

      {/* Flags */}
      <p className="text-xs font-bold uppercase text-red-600 mb-2">
        Flags críticos
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            id="flag-vehicleTheft"
            className="w-4 h-4"
            checked={flags.vehicleTheft}
            onChange={(e) => handleFlagChange("vehicleTheft", e.target.checked)}
          />
          🚗 Robo de vehículo
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            id="flag-impersonation"
            className="w-4 h-4"
            checked={flags.impersonation}
            onChange={(e) => handleFlagChange("impersonation", e.target.checked)}
          />
          🪪 Suplantación de identidad
        </label>
      </div>

      <hr className="border-slate-200 my-3" />

      {/* Comentarios */}
      <p className="text-xs font-bold uppercase text-indigo-600 mb-2">
        Comentarios
      </p>
      <textarea
        id="feedback-comments"
        rows={3}
        placeholder="Observaciones adicionales..."
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </div>
  );
}