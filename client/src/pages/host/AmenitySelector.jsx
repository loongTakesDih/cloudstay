const amenityIcons = {
  "Air conditioning": "❄️",
  Balcony: "🌿",
  "BBQ area": "🔥",
  "Carbon monoxide alarm": "🧪",
  CCTV: "📹",
  "Cinema room": "🎬",
  "Emergency exit": "🚪",
  "Fire extinguisher": "🧯",
  "Fire pit": "🔥",
  "First aid kit": "➕",
  "Free parking": "🅿️",
  Garden: "🌳",
  Gym: "🏋️",
  Heating: "♨️",
  Kitchen: "🍳",
  "Lock on bedroom door": "🔐",
  Lounge: "🛋️",
  Playground: "🛝",
  "Private entrance": "🚪",
  "Rooftop area": "🌇",
  "Security guard": "🛡️",
  "Smart lock": "🔑",
  "Smoke alarm": "🚨",
  "Snooker table": "🎱",
  "Swimming pool": "🏊",
  TV: "📺",
  "Washing machine": "🧺",
  Workspace: "💻",
  "Wi-Fi": "📶",
};

const groupIcons = {
  propertyFacilities: "✨",
  safetyFeatures: "🛡️",
  unitFeatures: "🏠",
};

function AmenitySelector({ groups, onChange, values }) {
  const toggleValue = (groupId, option) => {
    const currentValues = values[groupId] || [];
    const nextValues = currentValues.includes(option)
      ? currentValues.filter((value) => value !== option)
      : [...currentValues, option];

    onChange({
      ...values,
      [groupId]: nextValues,
    });
  };

  return (
    <div className="grid gap-5">
      {groups.map((group) => (
        <section
          key={group.id}
          className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg shadow-rose-100/40"
        >
          <h3 className="text-sm font-bold uppercase tracking-normal text-slate-500">
            <span className="mr-2" aria-hidden="true">
              {groupIcons[group.id]}
            </span>
            {group.label}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.options.map((option) => {
              const selected = values[group.id]?.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleValue(group.id, option)}
                  className={`group flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    selected
                      ? "border-rose-500 bg-gradient-to-br from-rose-50 to-white text-rose-700 shadow-rose-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-rose-200"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl text-2xl transition ${
                      selected ? "bg-white" : "bg-slate-50 group-hover:bg-rose-50"
                    }`}
                    aria-hidden="true"
                  >
                    {amenityIcons[option] || "✨"}
                  </span>
                  <span className="mt-3 text-sm font-bold leading-5">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default AmenitySelector;
