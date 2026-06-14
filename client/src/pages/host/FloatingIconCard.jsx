function FloatingIconCard({ caption, icon, tone = "rose", title }) {
  const tones = {
    amber: "from-amber-50 to-white text-amber-700 shadow-amber-100/80",
    emerald: "from-emerald-50 to-white text-emerald-700 shadow-emerald-100/80",
    rose: "from-rose-50 to-white text-rose-700 shadow-rose-100/80",
    sky: "from-sky-50 to-white text-sky-700 shadow-sky-100/80",
    slate: "from-slate-50 to-white text-slate-700 shadow-slate-100/80",
  };

  return (
    <div
      className={`rounded-2xl border border-white/80 bg-gradient-to-br ${tones[tone]} p-4 shadow-xl animate-[float_5s_ease-in-out_infinite]`}
    >
      <div className="text-3xl" aria-hidden="true">
        {icon}
      </div>
      <p className="mt-3 text-sm font-bold text-slate-950">{title}</p>
      {caption && <p className="mt-1 text-xs font-semibold">{caption}</p>}
    </div>
  );
}

export default FloatingIconCard;
