import { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  serverSidePagination?: boolean;
  totalItems?: number;
  serverSideSearch?: boolean;
  onSearchChange?: (term: string) => void;
  serverSideSort?: boolean;
  createButton?: boolean;
  onSortChange?: (key: string, direction: "asc" | "desc" | null) => void;
  actions?: (row: T) => React.ReactNode;
  onCreateClick?: () => void;
}

type SortDirection = "asc" | "desc" | null;

// ─── Icons ───────────────────────────────────────────────────────────────────

const SortIcon = ({ direction }: { direction: SortDirection }) => (
  <span className="inline-flex flex-col ml-1.5 opacity-60">
    <svg
      width="8"
      height="5"
      viewBox="0 0 8 5"
      className={`transition-all ${direction === "asc" ? "opacity-100 text-indigo-400" : "opacity-40"}`}
    >
      <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
    </svg>
    <svg
      width="8"
      height="5"
      viewBox="0 0 8 5"
      className={`transition-all mt-0.5 ${direction === "desc" ? "opacity-100 text-indigo-400" : "opacity-40"}`}
    >
      <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
    </svg>
  </span>
);

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
    />
  </svg>
);

const ChevronIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
    />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 8,
  searchable = true,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No hay datos disponibles",
  totalPages = 1,
  currentPage,
  onPageChange,
  serverSidePagination = false,
  totalItems,
  serverSideSearch = false,
  onSearchChange,
  serverSideSort = false,
  onSortChange,
  actions,
  onCreateClick,
  createButton = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const page = currentPage ?? localPage;

  // ── Filter ──
  const filtered = useMemo(() => {
    if (serverSideSearch) return data;
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search, columns, serverSideSearch]);

  // ── Sort ──
  const sorted = useMemo(() => {
    if (serverSideSort) return filtered;
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, serverSideSort]);

  // ── Paginate ──
  const computedTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const effectiveTotalPages = serverSidePagination
    ? totalPages
    : computedTotalPages;
  const safePage = Math.min(page, effectiveTotalPages);
  const paginated = serverSidePagination
    ? sorted
    : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setPage = (nextPage: number) => {
    if (currentPage === undefined) {
      setLocalPage(nextPage);
    }
    onPageChange?.(nextPage);
  };

  const handleSort = (key: keyof T) => {
    console.log(key)
    let nextKey: keyof T | null = sortKey;
    let nextDir: SortDirection = sortDir;

    if (sortKey !== key) {
      nextKey = key;
      nextDir = "asc";
    } else if (sortDir === "asc") {
      nextKey = key;
      nextDir = "desc";
    } else {
      nextKey = null;
      nextDir = null;
    }

    setSortKey(nextKey);
    setSortDir(nextDir);

    if (serverSideSort) {
      onSortChange?.(nextKey ? String(nextKey) : "", nextDir);
    }
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearch(term);
    if (serverSideSearch) {
      onSearchChange?.(term);
    }
    setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: (number | "...")[] = [];
    for (let i = 1; i <= effectiveTotalPages; i++) {
      if (
        i === 1 ||
        i === effectiveTotalPages ||
        (i >= safePage - delta && i <= safePage + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [effectiveTotalPages, safePage]);

  return (
    <div className="w-full font-sans">
      <div className="flex gap-5">
        {/* Search bar */}
        {searchable && (
          <div className="mb-4 relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
              placeholder:text-slate-400 text-slate-700 transition"
            />
          </div>
        )}

        {createButton && (
          <div className="mb-4">
            <button
              onClick={onCreateClick}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Crear nuevo
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-3 font-semibold text-slate-600 whitespace-nowrap select-none
                    ${col.sortable !== false ? "cursor-pointer hover:text-indigo-600 hover:bg-slate-100 transition-colors" : ""}`}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable !== false && (
                      <SortIcon
                        direction={sortKey === col.key ? sortDir : null}
                      />
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap select-none">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3 text-slate-700 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "-")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          Mostrando{" "}
          <span className="font-medium text-slate-700">
            {paginated.length === 0
              ? 0
              : serverSidePagination
                ? (safePage - 1) * pageSize + 1
                : (safePage - 1) * pageSize + 1}
            –
            {paginated.length === 0
              ? 0
              : serverSidePagination
                ? (safePage - 1) * pageSize + paginated.length
                : Math.min(safePage * pageSize, sorted.length)}
          </span>{" "}
          de{" "}
          <span className="font-medium text-slate-700">
            {serverSidePagination ? (totalItems ?? 0) : sorted.length}
          </span>{" "}
          resultados
        </span>

        {effectiveTotalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40
                disabled:cursor-not-allowed transition"
            >
              <ChevronIcon dir="left" />
            </button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[2rem] h-8 rounded-md text-sm font-medium border transition
                    ${
                      safePage === p
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() =>
                setPage(Math.min(effectiveTotalPages, safePage + 1))
              }
              disabled={safePage === effectiveTotalPages}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40
                disabled:cursor-not-allowed transition"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Usage Example (puedes borrar esto) ──────────────────────────────────────
//
// interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: string;
//   status: "active" | "inactive";
// }
//
// const columns: Column<User>[] = [
//   { key: "id", label: "ID" },
//   { key: "name", label: "Nombre" },
//   { key: "email", label: "Correo" },
//   { key: "role", label: "Rol" },
//   {
//     key: "status",
//     label: "Estado",
//     render: (val) => (
//       <span className={`px-2 py-0.5 rounded-full text-xs font-medium
//         ${val === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
//         {val === "active" ? "Activo" : "Inactivo"}
//       </span>
//     ),
//   },
// ];
//
// <DataTable data={users} columns={columns} pageSize={10} />
