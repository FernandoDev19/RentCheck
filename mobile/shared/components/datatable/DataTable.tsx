import { useState, useMemo } from "react";
import type { DataTableProps } from "./props/data-table.props";
import SearchBar from "./components/SearchBar";
import TableFooter from "./components/TableFooter";
import ButtonCallUp from "../ui/ButtonCallUp";

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
      <div className="flex items-center justify-between gap-5">
        {/* Search bar */}
        {searchable && (
          <SearchBar
            search={search}
            handleSearch={handleSearch}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        {createButton && (
          <div className="mb-4">
            <ButtonCallUp
              type="button"
              id="create-button"
              onClick={onCreateClick}
              isLoading={false}
            >
              Crear nuevo
            </ButtonCallUp>
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
      <TableFooter
        paginated={paginated}
        serverSidePagination={serverSidePagination}
        safePage={safePage}
        pageSize={pageSize}
        sorted={sorted}
        totalItems={totalItems}
        effectiveTotalPages={effectiveTotalPages}
        pageNumbers={pageNumbers}
        setPage={setPage}
      />
    </div>
  );
}
