const steps = ["Place", "Details", "Finish"];

function HostOnboardingProgress({ progress, stepIndex }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500">
        {steps.map((step, index) => (
          <div
            key={step}
            className={index === stepIndex ? "text-rose-500" : "text-slate-500"}
          >
            {step}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const sectionStart = index / steps.length;
          const sectionEnd = (index + 1) / steps.length;
          const localProgress = Math.min(
            1,
            Math.max(0, (progress - sectionStart) / (sectionEnd - sectionStart))
          );

          return (
            <div
              key={step}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-300 ease-out"
                style={{ width: `${localProgress * 100}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HostOnboardingProgress;
