import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { parseOsmLocation } from "../utils/locationLookup.js";

const DEFAULT_CENTER = [3.139, 101.6869];
const REVERSE_GEOCODER_URL =
  import.meta.env.VITE_REVERSE_GEOCODER_URL ||
  "https://nominatim.openstreetmap.org/reverse";

const isCoordinate = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const readCachedAddressLocation = (address) => {
  if (!address) return null;

  try {
    const value = localStorage.getItem(
      `cloudstay_geocode_${address.trim().toLowerCase()}`,
    );
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const cacheAddressLocation = (address, location) => {
  try {
    localStorage.setItem(
      `cloudstay_geocode_${address.trim().toLowerCase()}`,
      JSON.stringify(location),
    );
  } catch {
    // The map still works when browser storage is unavailable.
  }
};

const createHomeIcon = (picker) =>
  L.divIcon({
    className: "",
    html: `<span style="
      display:grid;
      place-items:center;
      width:42px;
      height:42px;
      border-radius:9999px;
      border:3px solid white;
      background:${picker ? "#f43f5e" : "#0f172a"};
      color:white;
      font-size:21px;
      font-weight:800;
      box-shadow:0 8px 22px rgba(15,23,42,.28);
    ">⌂</span>`,
    iconAnchor: [21, 21],
    iconSize: [42, 42],
  });

function LeafletCanvas({
  address,
  latitude,
  longitude,
  mode,
  onLocationChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const geocodeTimerRef = useRef(null);
  const geocodeRequestRef = useRef(null);
  const selectionVersionRef = useRef(0);
  const initialPositionRef = useRef({ latitude, longitude });
  const [geocoding, setGeocoding] = useState(false);
  const isPicker = mode === "picker";

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const initialPosition = initialPositionRef.current;
    const hasPosition =
      isCoordinate(initialPosition.latitude) &&
      isCoordinate(initialPosition.longitude);
    const center = hasPosition
      ? [Number(initialPosition.latitude), Number(initialPosition.longitude)]
      : DEFAULT_CENTER;
    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      wheelPxPerZoomLevel: 90,
      zoomControl: true,
    }).setView(center, hasPosition ? 16 : 12);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (hasPosition) {
      markerRef.current = L.marker(center, {
        icon: createHomeIcon(isPicker),
        alt: "Property location",
      }).addTo(map);
    }

    if (isPicker) {
      map.on("click", (event) => {
        const nextLatitude = Number(event.latlng.lat.toFixed(6));
        const nextLongitude = Number(event.latlng.lng.toFixed(6));
        selectionVersionRef.current += 1;
        const selectionVersion = selectionVersionRef.current;

        if (markerRef.current) {
          markerRef.current.setLatLng(event.latlng);
        } else {
          markerRef.current = L.marker(event.latlng, {
            icon: createHomeIcon(true),
            alt: "Selected property location",
          }).addTo(map);
        }

        onLocationChangeRef.current?.({
          latitude: nextLatitude,
          longitude: nextLongitude,
        });

        window.clearTimeout(geocodeTimerRef.current);
        geocodeRequestRef.current?.abort();
        geocodeTimerRef.current = window.setTimeout(async () => {
          const controller = new AbortController();
          geocodeRequestRef.current = controller;
          setGeocoding(true);

          try {
            const query = new URLSearchParams({
              format: "jsonv2",
              lat: String(nextLatitude),
              lon: String(nextLongitude),
              addressdetails: "1",
              "accept-language": "en",
            });
            const response = await fetch(`${REVERSE_GEOCODER_URL}?${query}`, {
              headers: { Accept: "application/json" },
              signal: controller.signal,
            });

            if (!response.ok) throw new Error("Reverse geocoding failed");
            const result = await response.json();

            if (selectionVersionRef.current === selectionVersion) {
              const location = parseOsmLocation(result);

              onLocationChangeRef.current?.({
                latitude: nextLatitude,
                longitude: nextLongitude,
                address: result.display_name || "",
                addressLine: location.addressLine,
                city: location.city,
                state: location.state,
                postalCode: location.postalCode,
                country: location.country,
              });
            }
          } catch (error) {
            if (error.name !== "AbortError") {
              // Coordinates remain saved even if address lookup is unavailable.
            }
          } finally {
            if (selectionVersionRef.current === selectionVersion) {
              setGeocoding(false);
            }
          }
        }, 1100);
      });
    }

    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(geocodeTimerRef.current);
      geocodeRequestRef.current?.abort();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isPicker]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isCoordinate(latitude) || !isCoordinate(longitude)) return;

    const position = [Number(latitude), Number(longitude)];
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, {
        icon: createHomeIcon(isPicker),
        alt: "Property location",
      }).addTo(map);
    }

    map.setView(position, Math.max(map.getZoom(), 13), {
      animate: true,
    });
  }, [isPicker, latitude, longitude]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[360px] w-full overflow-hidden rounded-3xl bg-slate-100"
        aria-label={
          isPicker
            ? "Map for selecting the property location"
            : `Map showing ${address || "the property location"}`
        }
      />
      {isPicker && (
        <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-[calc(100%-2rem)] rounded-xl bg-white/95 px-4 py-3 text-xs font-bold text-slate-700 shadow-lg">
          {geocoding
            ? "Finding the nearest address..."
            : "Click the map to place the property pin"}
        </div>
      )}
    </div>
  );
}

export function MapPicker({
  address,
  latitude,
  longitude,
  onLocationChange,
}) {
  return (
    <div>
      <LeafletCanvas
        address={address}
        latitude={latitude}
        longitude={longitude}
        mode="picker"
        onLocationChange={onLocationChange}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {isCoordinate(latitude) && isCoordinate(longitude)
            ? `Pinned at ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
            : "No location selected yet"}
        </span>
        <span>Address lookup may return the nearest mapped place.</span>
      </div>
    </div>
  );
}

export function PropertyLocationMap({ address, latitude, longitude }) {
  if (!isCoordinate(latitude) || !isCoordinate(longitude)) {
    return <AddressFallbackMap address={address} />;
  }

  const openMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;

  return (
    <div>
      <LeafletCanvas
        address={address}
        latitude={latitude}
        longitude={longitude}
        mode="display"
      />
      <a
        href={openMapUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-sm font-bold text-rose-600 hover:text-rose-700"
      >
        View larger map ↗
      </a>
    </div>
  );
}

function AddressFallbackMap({ address }) {
  const [location, setLocation] = useState(() =>
    readCachedAddressLocation(address),
  );
  const [loading, setLoading] = useState(!location);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address || location) return undefined;

    let active = true;
    const controller = new AbortController();
    const lookupId = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          format: "jsonv2",
          q: address,
          limit: "1",
          "accept-language": "en",
        });
        const searchUrl = REVERSE_GEOCODER_URL.replace(/\/reverse\/?$/, "/search");
        const response = await fetch(`${searchUrl}?${query}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Address lookup failed");
        const results = await response.json();
        const result = results[0];

        if (!result) {
          throw new Error("Address could not be located");
        }

        const nextLocation = {
          latitude: Number(result.lat),
          longitude: Number(result.lon),
        };
        cacheAddressLocation(address, nextLocation);

        if (active) {
          setLocation(nextLocation);
          setError("");
        }
      } catch (lookupError) {
        if (active && lookupError.name !== "AbortError") {
          setError("The host has not pinned this property on the map yet.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 1100);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(lookupId);
    };
  }, [address, location]);

  if (loading) {
    return (
      <div className="flex h-52 items-center justify-center rounded-3xl bg-slate-50 text-sm font-semibold text-slate-500">
        Locating this address...
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex h-52 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
        {error || "The host has not pinned this property on the map yet."}
      </div>
    );
  }

  return (
    <div>
      <LeafletCanvas
        address={address}
        latitude={location.latitude}
        longitude={location.longitude}
        mode="display"
      />
      <p className="mt-3 text-xs text-slate-500">
        Approximate location based on the listing address. The host can add a
        precise pin from the listing editor.
      </p>
    </div>
  );
}
