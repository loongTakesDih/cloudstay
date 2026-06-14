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
        <section key={group.id}>
          <h3 className="text-sm font-bold text-slate-900">{group.label}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.options.map((option) => {
              const selected = values[group.id]?.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleValue(group.id, option)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {option}
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
