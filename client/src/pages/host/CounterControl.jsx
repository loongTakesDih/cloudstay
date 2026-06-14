function CounterControl({ label, min = 0, onChange, value }) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(value + 1);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/85 px-5 py-4 shadow-sm shadow-rose-100/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <span className="text-base font-bold text-slate-800">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-10 text-center text-xl font-bold text-slate-950">
          {value}
        </span>
        <button
          type="button"
          onClick={increase}
          className="grid h-10 w-10 place-items-center rounded-full border border-rose-200 bg-rose-50 text-lg font-bold text-rose-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default CounterControl;
