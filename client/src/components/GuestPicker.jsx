import { formatGuests, getGuestTotal } from "../utils/searchOptions.js";

const rows = [
  { key: "adults", label: "Adults", detail: "Ages 13 or above" },
  { key: "children", label: "Children", detail: "Ages 2–12" },
  { key: "infants", label: "Infants", detail: "Under 2" },
];

function GuestPicker({ value, onChange, minAdults = 0, maxGuests }) {
  const total = getGuestTotal(value);

  const update = (key, amount) => {
    const nextValue = Math.max(key === "adults" ? minAdults : 0, value[key] + amount);
    const next = { ...value, [key]: nextValue };
    if (key !== "infants" && maxGuests && getGuestTotal(next) > maxGuests) return;
    onChange(next);
  };

  return (
    <div className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-6">
            <div>
              <p className="font-bold text-slate-900">{row.label}</p>
              <p className="mt-0.5 text-sm text-slate-500">{row.detail}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => update(row.key, -1)}
                disabled={value[row.key] <= (row.key === "adults" ? minAdults : 0)}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-lg text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Remove ${row.label.toLowerCase()}`}
              >
                −
              </button>
              <span className="w-5 text-center font-semibold">{value[row.key]}</span>
              <button
                type="button"
                onClick={() => update(row.key, 1)}
                disabled={row.key !== "infants" && maxGuests && total >= maxGuests}
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-lg text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={`Add ${row.label.toLowerCase()}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {maxGuests && (
        <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
          {formatGuests(value)} · Maximum {maxGuests} guests, excluding infants
        </p>
      )}
    </div>
  );
}

export default GuestPicker;
