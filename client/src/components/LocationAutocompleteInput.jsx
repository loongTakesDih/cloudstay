import { useEffect, useRef, useState } from "react";
import {
  parseOsmLocation,
  searchLocationSuggestions,
} from "../utils/locationLookup.js";

function LocationAutocompleteInput({
  autoFocus = false,
  className = "",
  context = {},
  onChange,
  onResolve,
  onSelect,
  placeholder,
  required = false,
  value,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const blurTimerRef = useRef(null);
  const contextRef = useRef(context);
  const onResolveRef = useRef(onResolve);
  const wrapperRef = useRef(null);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    onResolveRef.current = onResolve;
  }, [onResolve]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const cleanValue = String(value || "").trim();

    if (cleanValue.length < 3) {
      const clearTimer = window.setTimeout(() => {
        setSuggestions([]);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(clearTimer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const results = await searchLocationSuggestions(cleanValue, {
          city: contextRef.current.city,
          country: contextRef.current.country,
          state: contextRef.current.state,
          signal: controller.signal,
        });
        setSuggestions(results);
        setOpen(results.length > 0);

        if (results[0]) {
          onResolveRef.current?.(parseOsmLocation(results[0]));
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 550);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  const selectSuggestion = (suggestion) => {
    const location = parseOsmLocation(suggestion);

    onSelect?.(location);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => {
          blurTimerRef.current = window.setTimeout(() => setOpen(false), 140);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={className}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
      />
      {(open || loading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[1000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
          {loading && (
            <div className="px-4 py-3 text-sm font-bold text-slate-500">
              Searching locations...
            </div>
          )}
          {!loading &&
            suggestions.map((suggestion) => {
              const location = parseOsmLocation(suggestion);

              return (
                <button
                  key={`${suggestion.place_id}-${suggestion.lat}-${suggestion.lon}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    window.clearTimeout(blurTimerRef.current);
                    selectSuggestion(suggestion);
                  }}
                  className="block w-full border-t border-slate-100 px-4 py-3 text-left transition first:border-t-0 hover:bg-rose-50"
                >
                  <span className="block text-sm font-bold text-slate-800">
                    {location.addressLine || location.city || "Suggested location"}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                    {suggestion.display_name}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default LocationAutocompleteInput;
