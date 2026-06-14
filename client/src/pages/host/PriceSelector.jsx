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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-500">Nightly price</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="text-4xl font-bold tracking-normal text-slate-950">
          RM {value || 1}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updatePrice((Number(value) || 1) - 10)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:border-slate-500"
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
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          />
          <button
            type="button"
            onClick={() => updatePrice((Number(value) || 1) + 10)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:border-slate-500"
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
