import MarketplaceHeader from "../../components/MarketplaceHeader";

function WizardShell({
  backLabel = "Back",
  canGoBack,
  canGoNext,
  children,
  error,
  isFinal,
  isSubmitting,
  nextLabel = "Next",
  onBack,
  onExit,
  onNext,
  onSubmit,
  progress,
  progressLabel,
}) {
  const percent = Math.round(progress * 100);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_48%,#f8fafc_100%)] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/70 bg-white/90 shadow-sm shadow-rose-100/40 backdrop-blur-xl">
        <MarketplaceHeader />
        <div className="border-t border-white/70 bg-white/70 px-4 py-3">
          <div className="mx-auto flex max-w-[1600px] items-center gap-4 sm:px-2 lg:px-6 2xl:px-8">
            <div className="grid flex-1 grid-cols-3 gap-2">
              {[0, 1, 2].map((section) => {
                const start = section / 3;
                const end = (section + 1) / 3;
                const localProgress = Math.min(
                  1,
                  Math.max(0, (progress - start) / (end - start))
                );

                return (
                  <div
                    key={section}
                    className="h-2 overflow-hidden rounded-full bg-slate-200/80"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 shadow-[0_0_16px_rgba(244,63,94,0.35)] transition-all duration-500 ease-out"
                      style={{ width: `${localProgress * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <span className="hidden min-w-12 text-right text-xs font-bold text-slate-500 sm:block">
              {percent}%
            </span>
            <button
              type="button"
              onClick={onExit}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={onSubmit}>
        <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 pb-32 pt-44 sm:px-6 lg:px-8">
          <section
            key={progressLabel}
            className="w-full animate-[fadeSlide_260ms_ease-out]"
          >
            {children}
            {error && (
              <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
                {error}
              </div>
            )}
          </section>
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/70 bg-white/90 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              {backLabel}
            </button>

            <div className="hidden text-sm font-semibold text-slate-500 sm:block">
              {progressLabel}
            </div>

            {isFinal ? (
              <button
                type="submit"
                disabled={!canGoNext || isSubmitting}
                className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                {isSubmitting ? "Saving..." : nextLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className="rounded-full bg-slate-950 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {nextLabel}
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
}

export default WizardShell;
