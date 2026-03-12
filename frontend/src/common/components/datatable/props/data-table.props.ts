import type { Column } from "../types/column.type";

export interface DataTableProps<T> {
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
