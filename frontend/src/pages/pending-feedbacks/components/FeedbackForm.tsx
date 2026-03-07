import { useState } from "react";
import type { Rental } from "../../../models/rental.model";
import type { Branch } from "../../../models/branch.model";
import { SCORE_FIELDS } from "../../../services/rental-feedback.service";

export default function FeedbackForm({ row }: { row: Rental }) {
  const [scores, setScores] = useState<Record<string, number>>({});

  return (
    <div className="text-left text-sm">
      {/* Info renta */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500 uppercase font-semibold">
            Cliente
          </span>
          <p className="text-slate-800 font-medium">
            {row.customer?.name} {row.customer?.lastName}
          </p>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold">Sede</span>
          <p className="text-slate-800 font-medium">
            {(row.branch as Branch)?.name ?? "-"}
          </p>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold">Inicio</span>
          <p className="text-slate-800 font-medium">
            {new Date(row.startDate).toLocaleDateString("es-CO")}
          </p>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-semibold">
            Devolución esp.
          </span>
          <p className="text-slate-800 font-medium">
            {new Date(row.expectedReturnDate).toLocaleDateString("es-CO")}
          </p>
        </div>
      </div>

      {/* Scores */}
      <p className="text-xs font-bold uppercase text-indigo-600 mb-3">
        Calificación (0 = peor, 5 = mejor)
      </p>
      <div className="flex flex-col gap-3 mb-4">
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {label}
            </label>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name={`score-${key}`}
                    value={n}
                    className="hidden"
                    onChange={() =>
                      setScores((prev) => ({ ...prev, [key]: n }))
                    }
                  />
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold transition cursor-pointer
                    ${
                      scores[key] !== undefined && n <= scores[key]
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    onClick={() => setScores((prev) => ({ ...prev, [key]: n }))}
                  >
                    {n}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <hr className="border-slate-200 my-3" />

      {/* Flags */}
      <p className="text-xs font-bold uppercase text-red-600 mb-2">
        Flags críticos
      </p>
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" id="flag-vehicleTheft" className="w-4 h-4" />
          🚗 Robo de vehículo
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input type="checkbox" id="flag-impersonation" className="w-4 h-4" />
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
