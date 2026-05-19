function AppHeader({ actions, eyebrow, subtitle, title }) {
  return (
    <header className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-bold tracking-normal text-rose-500">
            CloudStay
          </div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              {eyebrow}
            </p>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
