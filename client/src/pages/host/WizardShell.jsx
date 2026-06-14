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
  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onExit}
            className="text-xl font-bold tracking-normal text-rose-500"
          >
            CloudStay
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Exit
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-slate-100">
          {[0, 1, 2].map((section) => {
            const start = section / 3;
            const end = (section + 1) / 3;
            const localProgress = Math.min(
              1,
              Math.max(0, (progress - start) / (end - start))
            );

            return (
              <div key={section} className="h-1.5 overflow-hidden bg-slate-100">
                <div
                  className="h-full bg-rose-500 transition-all duration-300 ease-out"
                  style={{ width: `${localProgress * 100}%` }}
                />
              </div>
            );
          })}
        </div>
      </header>

      <form onSubmit={onSubmit}>
        <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 pb-32 pt-28 sm:px-6 lg:px-8">
          <section
            key={progressLabel}
            className="w-full animate-[fadeIn_220ms_ease-out]"
          >
            {children}
            {error && (
              <div className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </section>
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-lg bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Saving..." : nextLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
