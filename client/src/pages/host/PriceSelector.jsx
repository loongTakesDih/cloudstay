function PriceSelector({ onChange, value }) {
  const updatePrice = (nextValue) => {
    const parsedValue = Number(nextValue);

    if (Number.isNaN(parsedValue)) {
      onChange("");
      return;
    }

    onChange(Math.max(1, parsedValue));
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-rose-100/50">
      <p className="text-sm font-bold uppercase tracking-normal text-slate-500">
        Nightly price
      </p>
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-5xl font-bold tracking-normal text-slate-950">
          RM {value || 1}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updatePrice((Number(value) || 1) - 10)}
            className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-lg font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400"
            aria-label="Decrease price"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            step="1"
            value={value}
            onChange={(event) => updatePrice(event.target.value)}
            className="w-32 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-bold text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          />
          <button
            type="button"
            onClick={() => updatePrice((Number(value) || 1) + 10)}
            className="grid h-12 w-12 place-items-center rounded-full border border-rose-200 bg-rose-50 text-lg font-bold text-rose-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100"
            aria-label="Increase price"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default PriceSelector;
