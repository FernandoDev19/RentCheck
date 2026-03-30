import { useState } from "react";

export default function DatePickerForm({
  onSearch,
  loading,
}: {
  onSearch: (startDate: string, endDate: string) => void;
  loading: boolean;
}) {
  const getTodayLocal = () => {
    const d = new Date();
    return d.toLocaleDateString("en-CA");
  };

  const getTomorrowLocal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("en-CA");
  };

  const [startDate, setStartDate] = useState(getTodayLocal());
  const [endDate, setEndDate] = useState(getTomorrowLocal());
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      setError("Selecciona ambas fechas");
      return;
    }
    if (endDate <= startDate) {
      setError("La fecha de devolución debe ser posterior al inicio");
      return;
    }
    setError("");
    onSearch(startDate, endDate);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Fecha inicio
          </p>
          <input
            type="date"
            value={startDate}
            min={getTodayLocal()}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Fecha devolución
          </p>
          <input
            type="date"
            value={endDate}
            min={startDate || getTomorrowLocal()}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl
          hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Buscando..." : "🔍 Buscar vehículos disponibles"}
      </button>
    </div>
  );
}