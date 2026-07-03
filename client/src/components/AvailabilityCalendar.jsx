import { useEffect, useMemo, useState } from "react";
import { getPropertyAvailability } from "../api/api.js";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const parseDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const CalendarMonth = ({ availability, month }) => {
  const monthStart = startOfMonth(month);
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = monthStart.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableFrom = parseDate(availability.availableFrom);
  const availableTo = parseDate(availability.availableTo);
  const blockedRanges = availability.blockedRanges.map((range) => ({
    checkIn: parseDate(range.checkIn),
    checkOut: parseDate(range.checkOut),
  }));

  const isUnavailable = (date) => {
    if (!availability.isAvailable || date < today) return true;
    if (availableFrom && date < availableFrom) return true;
    if (availableTo && date > availableTo) return true;

    return blockedRanges.some(
      (range) => date >= range.checkIn && date < range.checkOut,
    );
  };

  return (
    <div>
      <h3 className="text-center text-base font-bold text-slate-950">
        {new Intl.DateTimeFormat("en-MY", {
          month: "long",
          year: "numeric",
        }).format(monthStart)}
      </h3>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={`${weekday}-${index}`}
            className="pb-2 text-xs font-bold text-slate-500"
          >
            {weekday}
          </span>
        ))}
        {Array.from({ length: leadingDays }).map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
          const unavailable = isUnavailable(date);
          const isToday = dateKey(date) === dateKey(today);

          return (
            <span
              key={day}
              aria-label={`${date.toDateString()}, ${unavailable ? "unavailable" : "available"}`}
              className={`grid aspect-square place-items-center rounded-full text-sm font-semibold ${
                unavailable
                  ? "text-slate-300 line-through"
                  : "border border-slate-200 bg-white text-slate-900"
              } ${isToday ? "ring-2 ring-rose-400 ring-offset-1" : ""}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
};

function AvailabilityCalendar({ propertyId }) {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const initialMonth = useMemo(() => startOfMonth(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  useEffect(() => {
    let active = true;

    const loadId = window.setTimeout(async () => {
      try {
        const data = await getPropertyAvailability(propertyId);
        if (active) {
          setAvailability(data);
          setError("");
        }
      } catch {
        if (active) setError("Availability could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [propertyId]);

  return (
    <section className="border-b border-slate-200 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Availability</h2>
          <p className="mt-2 text-sm text-slate-500">
            Crossed-out dates are unavailable. Confirmed stays update this calendar.
          </p>
        </div>
        {!loading && availability && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
          Loading availability...
        </div>
      ) : error || !availability ? (
        <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <CalendarMonth availability={availability} month={visibleMonth} />
            <CalendarMonth availability={availability} month={addMonths(visibleMonth, 1)} />
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border border-slate-300 bg-white" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center text-slate-300 line-through">8</span>
              Unavailable
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export default AvailabilityCalendar;
