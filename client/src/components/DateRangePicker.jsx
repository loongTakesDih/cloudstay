import { useMemo, useState } from "react";

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const sameDay = (left, right) =>
  left &&
  right &&
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const parseBlockedRanges = (ranges = []) =>
  ranges
    .map((range) => ({
      start: fromDateValue(String(range.checkIn || range.start || "").slice(0, 10)),
      end: fromDateValue(String(range.checkOut || range.end || "").slice(0, 10)),
    }))
    .filter((range) => range.start && range.end);

const dateInBlockedRange = (day, blockedRanges) =>
  blockedRanges.some((range) => day >= range.start && day < range.end);

const rangeOverlapsBlocked = (start, end, blockedRanges) =>
  blockedRanges.some((range) => start < range.end && end > range.start);

function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate = toDateValue(new Date()),
  maxDate,
  disabledRanges = [],
  onBlockedSelection,
}) {
  const initialDate = fromDateValue(startDate) || fromDateValue(minDate) || new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const start = fromDateValue(startDate);
  const end = fromDateValue(endDate);
  const minimum = fromDateValue(minDate);
  const maximum = fromDateValue(maxDate);
  const blockedRanges = useMemo(
    () => parseBlockedRanges(disabledRanges),
    [disabledRanges],
  );

  const selectDate = (day) => {
    if (dateInBlockedRange(day, blockedRanges)) {
      onBlockedSelection?.();
      return;
    }

    const value = toDateValue(day);

    if (!startDate || endDate) {
      onChange({ startDate: value, endDate: "" });
      return;
    }

    if (day <= start) return;
    if (rangeOverlapsBlocked(start, day, blockedRanges)) {
      onBlockedSelection?.();
      return;
    }

    onChange({ startDate, endDate: value });
  };

  const changeMonth = (offset) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <div className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Previous month">
          ‹
        </button>
        <p className="font-bold text-slate-900">
          {visibleMonth.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}
        </p>
        <button type="button" onClick={() => changeMonth(1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Next month">
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-xs font-bold text-slate-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label) => <span key={label}>{label}</span>)}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
          const disabled =
            (minimum && day < minimum) ||
            (maximum && day > maximum) ||
            (start && !end && day <= start) ||
            dateInBlockedRange(day, blockedRanges);
          const selected = sameDay(day, start) || sameDay(day, end);
          const inRange = start && end && day > start && day < end;

          return (
            <button
              key={toDateValue(day)}
              type="button"
              disabled={disabled}
              onClick={() => selectDate(day)}
              className={`h-10 rounded-full text-sm transition ${
                selected
                  ? "bg-slate-950 font-bold text-white"
                  : inRange
                    ? "rounded-none bg-rose-50 font-semibold text-rose-700"
                    : "hover:bg-slate-100"
              } ${outsideMonth ? "text-slate-300" : "text-slate-700"} disabled:cursor-not-allowed disabled:text-slate-200 disabled:hover:bg-transparent`}
              aria-label={day.toLocaleDateString("en-MY")}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs font-semibold text-slate-500">
        {!startDate ? "Select a start date" : !endDate ? "Now select an end date" : "Select another date to start over"}
      </p>
    </div>
  );
}

export default DateRangePicker;
