function CounterControl({ label, min = 0, onChange, value }) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(value + 1);

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span className="w-8 text-center text-sm font-bold text-slate-950">
          {value}
        </span>
        <button
          type="button"
          onClick={increase}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:border-slate-500"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default CounterControl;
