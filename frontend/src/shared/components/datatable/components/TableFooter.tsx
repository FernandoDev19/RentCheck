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

type Props = {
  paginated: any[];
  serverSidePagination: boolean;
  safePage: number;
  pageSize: number;
  sorted: any[];
  totalItems: number | undefined;
  effectiveTotalPages: number;
  pageNumbers: (number | string)[];
  setPage: (page: number) => void;
};

export default function TableFooter({
  paginated,
  serverSidePagination,
  safePage,
  pageSize,
  sorted,
  totalItems,
  effectiveTotalPages,
  pageNumbers,
  setPage,
}: Props) {
  return (
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
                className={`min-w-8 h-8 rounded-md text-sm font-medium border transition
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
            onClick={() => setPage(Math.min(effectiveTotalPages, safePage + 1))}
            disabled={safePage === effectiveTotalPages}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40
                disabled:cursor-not-allowed transition"
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      )}
    </div>
  );
}
