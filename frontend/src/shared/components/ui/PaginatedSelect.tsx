import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatedSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface PaginatedSelectProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  /** Función que carga opciones. Recibe page y search, devuelve { data, lastPage } */
  loadOptions: (page: number, search: string) => Promise<{
    data: PaginatedSelectOption[];
    lastPage: number;
  }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaginatedSelect({
  id,
  name,
  placeholder = "Seleccionar...",
  value,
  onChange,
  className = "",
  error = false,
  disabled = false,
  loadOptions,
}: PaginatedSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<PaginatedSelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(0);
  const loadingRef = useRef(false);

  // ── Load options ──
  const load = useCallback(async (p: number, s: string, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await loadOptions(p, s);
      setOptions((prev) => reset ? result.data : [...prev, ...result.data]);
      setLastPage(result.lastPage);
      setPage(p);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [loadOptions]);

  // Initial load when opening
  useEffect(() => {
    if (open) {
      setOptions([]);
      setPage(1);
      load(1, "", true);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, load]);

  // Load initial label when value changes
  useEffect(() => {
    if (value && !selectedLabel) {
      // Try to find the label in current options first
      const existingOption = options.find(opt => opt.value === value);
      if (existingOption) {
        setSelectedLabel(existingOption.label);
      } else if (!loading) {
        // If not found and not loading, load options to find it
        load(1, "", true);
      }
    } else if (!value) {
      setSelectedLabel("");
    }
  }, [value, selectedLabel, options, loading, load]);

  // Search with debounce
  const handleSearch = (term: string) => {
    setSearch(term);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setOptions([]);
      setPage(1);
      load(1, term, true);
    }, 300);
  };

  // Infinite scroll
  const handleScroll = () => {
    const el = listRef.current;
    if (!el || loading || page >= lastPage) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (nearBottom) load(page + 1, search, false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: PaginatedSelectOption) => {
    onChange?.(opt.value);
    setSelectedLabel(opt.label);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
    setSelectedLabel("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for form reading via getElementById */}
      <input type="hidden" id={id} name={name} value={value ?? ""} />

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between px-3 py-2
          border rounded-lg bg-white text-left text-sm transition
          focus:outline-none focus:ring-2 focus:ring-indigo-400
          ${error ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"}
          ${className}
        `}
      >
        <span className={value ? "text-slate-800 font-medium" : "text-slate-400"}>
          {value ? selectedLabel || placeholder : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="text-slate-300 hover:text-slate-500 transition text-xs px-1"
            >
              ✕
            </span>
          )}
          <span className={`text-slate-400 text-xs transition-transform ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* List */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-52 overflow-y-auto"
          >
            {options.length === 0 && !loading && (
              <p className="text-center text-slate-400 text-sm py-6">
                {search ? "Sin resultados" : "Sin opciones"}
              </p>
            )}

            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition hover:bg-indigo-50
                  flex items-center justify-between
                  ${value === opt.value ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700"}
                `}
              >
                <span>{opt.label}</span>
                {opt.sublabel && (
                  <span className="text-xs text-slate-400">{opt.sublabel}</span>
                )}
              </button>
            ))}

            {loading && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && page < lastPage && (
              <button
                type="button"
                onClick={() => load(page + 1, search, false)}
                className="w-full text-center text-xs text-indigo-500 hover:text-indigo-700 py-2 transition"
              >
                Cargar más
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}