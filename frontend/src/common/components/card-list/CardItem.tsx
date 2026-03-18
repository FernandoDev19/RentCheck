import type { ReactNode } from "react";

export interface CardField<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => ReactNode;
  fullWidth?: boolean;
  sortable?: boolean;
}

interface CardItemProps<T> {
  data: T;
  fields: CardField<T>[];
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: (data: T) => void;
}

export default function CardItem<T extends object>({
  data,
  fields,
  title,
  subtitle,
  badge,
  icon,
  footer,
  className = "",
  onClick,
}: CardItemProps<T>) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={isClickable ? () => onClick!(data) : undefined}
      className={`
        group relative bg-white border border-slate-200 rounded-2xl overflow-hidden
        transition-all duration-200 max-w-[300px]
        ${isClickable ? "cursor-pointer hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5" : ""}
        ${className}
      `}
    >
      {/* Accent line top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* ── Header ── */}
      {(title || subtitle || badge || icon) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}

      {/* ── Fields grid ── */}
      <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
        {fields.map((field) => {
          const rawValue =
            typeof field.key === "string" && field.key in data
              ? (data as Record<string, unknown>)[field.key as string]
              : undefined;

          const rendered = field.render
            ? field.render(rawValue, data)
            : rawValue != null && rawValue !== ""
              ? String(rawValue)
              : <span className="text-slate-300">—</span>;

          return (
            <div
              key={String(field.key)}
              className={field.fullWidth ? "col-span-2" : "col-span-1"}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
                {field.label}
              </span>
              <div className="text-sm text-slate-700 font-medium leading-snug">
                {rendered}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}