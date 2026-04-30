import React from "react";

export type PageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  onBack,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  onBack?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={`${String(b.label)}-${idx}`}>
              {idx > 0 ? <span className="px-1">/</span> : null}
              {b.href ? (
                <a href={b.href} className="hover:text-slate-700">
                  {b.label}
                </a>
              ) : (
                <span className="text-slate-600">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              {eyebrow}
            </p>
          ) : null}

          <div className="flex items-start gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Volver"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : null}

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>

      <div className="mt-4 h-px w-full bg-slate-200" />
    </div>
  );
}