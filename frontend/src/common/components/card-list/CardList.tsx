import SearchBar from "../datatable/components/SearchBar";
import TableFooter from "../datatable/components/TableFooter";
import ButtonCallUp from "../ui/ButtonCallUp";
import CardItem, { type CardField } from "./CardItem";
import { useMemo, useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardListProps<T> {
  data: T[];
  fields: CardField<T>[];
  title?: (row: T) => ReactNode;
  subtitle?: (row: T) => ReactNode;
  badge?: (row: T) => ReactNode;
  icon?: (row: T) => ReactNode;
  footer?: (row: T) => ReactNode;
  onClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;

  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
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
  onCreateClick?: () => void;
}

type SortDirection = "asc" | "desc" | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardList<T extends object & { id?: string | number }>({
  data,
  fields,
  title,
  subtitle,
  badge,
  icon,
  footer,
  onClick,
  emptyMessage = "No hay elementos para mostrar",
  className = "",

  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Buscar...",
  totalPages = 1,
  currentPage,
  onPageChange,
  serverSidePagination = false,
  totalItems,
  serverSideSearch = false,
  onSearchChange,
  serverSideSort = false,
  onSortChange,
  onCreateClick,
  createButton = false,
}: CardListProps<T>) {
  const [search, setSearch] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const page = currentPage ?? localPage;

  // ── Filter ──
  const filtered = useMemo(() => {
    if (serverSideSearch || !search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      fields.some((col) => {
        const key = col.key as string;
        if (!(key in row)) return false;
        return String((row as Record<string, unknown>)[key] ?? "")
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [data, search, fields, serverSideSearch]);

  // ── Sort ──
  const sorted = useMemo(() => {
    if (serverSideSort || !sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime();
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, serverSideSort]);

  // ── Paginate ──
  const computedTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const effectiveTotalPages = serverSidePagination ? totalPages : computedTotalPages;
  const safePage = Math.min(page, effectiveTotalPages);
  const paginated = serverSidePagination
    ? sorted
    : sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Handlers ──
  const setPage = (nextPage: number) => {
    if (currentPage === undefined) setLocalPage(nextPage);
    onPageChange?.(nextPage);
  };

  const handleSort = (key: string) => {
    let nextKey: string | null = sortKey;
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

    if (serverSideSort) onSortChange?.(nextKey ?? "", nextDir);
    setPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearch(term);
    if (serverSideSearch) onSearchChange?.(term);
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

  if (data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-16 text-slate-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const sortableFields = fields.filter((f) => f.sortable !== false && typeof f.key === "string");

  return (
    <div className="w-full font-sans">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-5 mb-4">
        {searchable && (
          <SearchBar
            search={search}
            handleSearch={handleSearch}
            searchPlaceholder={searchPlaceholder}
            className="m-0!"
          />
        )}
        {createButton && (
          <ButtonCallUp className="w-40!" type="button" onClick={onCreateClick} isLoading={false}>
            Crear nuevo
          </ButtonCallUp>
        )}
      </div>

      {/* ── Sort pills ── */}
      {sortableFields.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sortableFields.map((f) => {
            const key = f.key as string;
            const active = sortKey === key;
            return (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`
                  px-3 py-1 rounded-full text-xs font-semibold border transition
                  ${active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }
                `}
              >
                {f.label}
                {active && sortDir === "asc" && " ↑"}
                {active && sortDir === "desc" && " ↓"}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Grid — usa paginated, no data ── */}
      <div
        className={`w-full grid gap-4 ${className}`}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        {paginated.map((item, index) => (
          <CardItem
            key={item.id ?? index}
            data={item}
            fields={fields}
            title={title?.(item)}
            subtitle={subtitle?.(item)}
            badge={badge?.(item)}
            icon={icon?.(item)}
            footer={footer?.(item)}
            onClick={onClick}
          />
        ))}
      </div>

      {/* ── Footer ── */}
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