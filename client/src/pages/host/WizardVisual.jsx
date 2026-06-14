import FloatingIconCard from "./FloatingIconCard";

function MiniBar({ width }) {
  return (
    <div className="h-2 rounded-full bg-white/80">
      <div
        className="h-full rounded-full bg-rose-400 transition-all duration-500"
        style={{ width }}
      />
    </div>
  );
}

function PhotoTile({ delay = "0ms" }) {
  return (
    <div
      className="aspect-square rounded-xl border border-white/80 bg-white/70 shadow-sm animate-[softPulse_3.5s_ease-in-out_infinite]"
      style={{ animationDelay: delay }}
    />
  );
}

function WizardVisual({ accent = "rose", icon, label, type = "card" }) {
  const accentClasses = {
    amber: "from-amber-50 via-white to-rose-50 text-amber-700",
    emerald: "from-emerald-50 via-white to-rose-50 text-emerald-700",
    rose: "from-rose-50 via-white to-amber-50 text-rose-700",
    sky: "from-sky-50 via-white to-rose-50 text-sky-700",
    slate: "from-slate-50 via-white to-rose-50 text-slate-700",
  };

  return (
    <aside className="relative hidden min-h-[360px] lg:block">
      <div className="absolute inset-0 rounded-[2rem] border border-white/80 bg-gradient-to-br shadow-2xl shadow-rose-100/70 backdrop-blur-sm" />
      <div
        className={`relative grid min-h-[360px] place-items-center rounded-[2rem] bg-gradient-to-br ${accentClasses[accent]} p-8 overflow-hidden`}
      >
        <div className="absolute left-8 top-8 h-20 w-20 rounded-3xl border border-white/70 bg-white/40 rotate-6" />
        <div className="absolute bottom-8 right-8 h-24 w-24 rounded-3xl border border-white/70 bg-white/40 -rotate-6" />

        <div className="relative w-full max-w-xs">
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] border border-white/80 bg-white/80 text-5xl shadow-xl animate-[float_5s_ease-in-out_infinite]">
            <span aria-hidden="true">{icon}</span>
          </div>

          {type === "photo" && (
            <div className="mt-8 grid grid-cols-3 gap-3">
              <PhotoTile />
              <PhotoTile delay="160ms" />
              <PhotoTile delay="320ms" />
              <PhotoTile delay="480ms" />
              <PhotoTile delay="640ms" />
              <PhotoTile delay="800ms" />
            </div>
          )}

          {type === "price" && (
            <div className="mt-8 rounded-2xl border border-white/80 bg-white/75 p-5 text-center shadow-xl">
              <p className="text-xs font-bold uppercase tracking-normal text-slate-500">
                Suggested range
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">RM 120</p>
              <MiniBar width="72%" />
            </div>
          )}

          {type === "calendar" && (
            <div className="mt-8 rounded-2xl border border-white/80 bg-white/75 p-5 shadow-xl">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 21 }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-7 rounded-lg ${
                      index > 6 && index < 17 ? "bg-rose-400" : "bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {type === "chips" && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Wi-Fi", "Pool", "Kitchen", "Safety"].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/80 bg-white/75 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {type === "card" && (
            <div className="mt-8 grid gap-3">
              <FloatingIconCard
                icon={icon}
                title={label}
                caption="CloudStay setup"
                tone={accent}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default WizardVisual;
