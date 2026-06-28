import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";
import AmenitySelector from "./AmenitySelector";
import CounterControl from "./CounterControl";
import PriceSelector from "./PriceSelector";
import WizardShell from "./WizardShell";
import WizardVisual from "./WizardVisual";

const propertyCategories = [
  "Apartment",
  "House",
  "Condominium",
  "Villa",
  "Studio",
  "Townhouse",
  "Cabin",
  "Guesthouse",
  "Unique Stay",
  "Other",
];

const placeTypes = ["Entire place", "A room", "Shared room"];

const amenityGroups = [
  {
    id: "unitFeatures",
    label: "Unit Features",
    options: [
      "Wi-Fi",
      "TV",
      "Air conditioning",
      "Kitchen",
      "Washing machine",
      "Workspace",
      "Balcony",
      "Heating",
      "Free parking",
      "Private entrance",
    ],
  },
  {
    id: "propertyFacilities",
    label: "Facilities and Entertainment",
    options: [
      "Swimming pool",
      "Gym",
      "BBQ area",
      "Garden",
      "Fire pit",
      "Snooker table",
      "Cinema room",
      "Rooftop area",
      "Lounge",
      "Playground",
    ],
  },
  {
    id: "safetyFeatures",
    label: "Safety Features",
    options: [
      "CCTV",
      "Smoke alarm",
      "Fire extinguisher",
      "First aid kit",
      "Carbon monoxide alarm",
      "Smart lock",
      "Security guard",
      "Emergency exit",
      "Lock on bedroom door",
    ],
  },
];

const initialForm = {
  propertyCategory: "",
  placeType: "",
  address: "",
  guestCount: 1,
  bedroomCount: 0,
  bedCount: 0,
  bathroomCount: 0,
  unitFeatures: [],
  propertyFacilities: [],
  safetyFeatures: [],
  title: "",
  description: "",
  availableFrom: "",
  availableTo: "",
  pricePerNight: 120,
};

const screens = [
  { id: "placeIntro", mainStep: 0 },
  { id: "category", mainStep: 0 },
  { id: "placeType", mainStep: 0 },
  { id: "address", mainStep: 0 },
  { id: "basics", mainStep: 0 },
  { id: "standOutIntro", mainStep: 1 },
  { id: "amenities", mainStep: 1 },
  { id: "photos", mainStep: 1 },
  { id: "title", mainStep: 1 },
  { id: "description", mainStep: 1 },
  { id: "finishIntro", mainStep: 2 },
  { id: "availability", mainStep: 2 },
  { id: "price", mainStep: 2 },
  { id: "done", mainStep: 2 },
];

const stepNames = ["Tell us about your place", "Make it stand out", "Finish up"];
const hasText = (value) => value.trim().length > 0;

const optionIcons = {
  Apartment: "🏢",
  House: "🏡",
  Condominium: "🌆",
  Villa: "🌴",
  Studio: "🛋️",
  Townhouse: "🏘️",
  Cabin: "🪵",
  Guesthouse: "🛎️",
  "Unique Stay": "✨",
  Other: "📍",
  "Entire place": "🏠",
  "A room": "🚪",
  "Shared room": "🛏️",
};

const screenVisuals = {
  placeIntro: { icon: "🏡", label: "Start your hosting journey", accent: "rose" },
  category: { icon: "🏘️", label: "Choose your home type", accent: "amber" },
  placeType: { icon: "🚪", label: "Set the guest space", accent: "sky" },
  address: { icon: "📍", label: "Pin the location", accent: "rose" },
  basics: { icon: "🛏️", label: "Beds, baths, guests", accent: "slate" },
  standOutIntro: { icon: "✨", label: "Add the details", accent: "amber", type: "chips" },
  amenities: { icon: "✨", label: "Guest favorites", accent: "emerald", type: "chips" },
  photos: { icon: "📸", label: "Photo preview", accent: "sky", type: "photo" },
  title: { icon: "📝", label: "Name your stay", accent: "rose" },
  description: { icon: "📖", label: "Tell the story", accent: "amber" },
  finishIntro: { icon: "📅", label: "Final details", accent: "sky", type: "calendar" },
  availability: { icon: "📅", label: "Open calendar", accent: "sky", type: "calendar" },
  price: { icon: "💸", label: "Nightly rate", accent: "emerald", type: "price" },
  done: { icon: "🎉", label: "Ready to save", accent: "rose" },
};

function OptionGrid({ options, selectedValue, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`group rounded-2xl border px-5 py-5 text-left text-base font-bold shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
            selectedValue === option
              ? "border-rose-500 bg-gradient-to-br from-rose-50 to-white text-rose-700 shadow-rose-100"
              : "border-white/80 bg-white/85 text-slate-800 hover:border-rose-100"
          }`}
        >
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-2xl transition group-hover:bg-rose-50">
            {optionIcons[option] || "✨"}
          </span>
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}

function ScreenHeading({ helper, kicker, title }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
        {kicker}
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
        {title}
      </h1>
      {helper && (
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          {helper}
        </p>
      )}
    </div>
  );
}

function WizardScreen({ children, visual }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-3xl border border-white/80 bg-white/80 text-3xl shadow-lg shadow-rose-100/70 lg:hidden">
          <span aria-hidden="true">{visual.icon}</span>
        </div>
        {children}
      </div>
      <WizardVisual {...visual} />
    </div>
  );
}

function ListingWizard({ mode = "become-host" }) {
  const navigate = useNavigate();
  const { completeHostOnboarding, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [screenIndex, setScreenIndex] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentScreen = screens[screenIndex];
  const datesValid =
    form.availableFrom &&
    form.availableTo &&
    new Date(form.availableTo) >= new Date(form.availableFrom);

  const currentScreenValid = useMemo(() => {
    switch (currentScreen.id) {
      case "category":
        return hasText(form.propertyCategory);
      case "placeType":
        return hasText(form.placeType);
      case "address":
        return hasText(form.address);
      case "basics":
        return (
          form.guestCount >= 1 &&
          form.bedroomCount >= 0 &&
          form.bedCount >= 0 &&
          form.bathroomCount >= 0
        );
      case "title":
        return hasText(form.title);
      case "description":
        return hasText(form.description);
      case "availability":
        return Boolean(datesValid);
      case "price":
      case "done":
        return Number(form.pricePerNight) >= 1;
      default:
        return true;
    }
  }, [currentScreen.id, datesValid, form]);

  const progress = (screenIndex + 1) / screens.length;
  const isFinal = currentScreen.id === "done";
  const isCreateMode = mode === "create-listing";

  const updateForm = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateAmenities = (values) => {
    setForm((currentForm) => ({
      ...currentForm,
      unitFeatures: values.unitFeatures || [],
      propertyFacilities: values.propertyFacilities || [],
      safetyFeatures: values.safetyFeatures || [],
    }));
  };

  const buildPayload = () => ({
    title: form.title,
    description: form.description,
    pricePerNight: Number(form.pricePerNight),
    location: form.address,
    propertyCategory: form.propertyCategory,
    placeType: form.placeType,
    address: form.address,
    guestCount: form.guestCount,
    bedroomCount: form.bedroomCount,
    bedCount: form.bedCount,
    bathroomCount: form.bathroomCount,
    unitFeatures: form.unitFeatures,
    propertyFacilities: form.propertyFacilities,
    safetyFeatures: form.safetyFeatures,
    availableFrom: form.availableFrom,
    availableTo: form.availableTo,
    isAvailable: true,
  });

  const handleNext = () => {
    setError("");

    if (!currentScreenValid) {
      setError("Complete this step before continuing.");
      return;
    }

    setScreenIndex((currentIndex) =>
      Math.min(screens.length - 1, currentIndex + 1)
    );
  };

  const handleBack = () => {
    setError("");
    setScreenIndex((currentIndex) => Math.max(0, currentIndex - 1));
  };

  const handleExit = () => {
    navigate(isCreateMode ? "/hosting/dashboard" : "/dashboard");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isFinal) {
      handleNext();
      return;
    }

    if (!currentScreenValid) {
      setError("Complete the required details before saving.");
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isCreateMode) {
        await createListing(payload);
      } else {
        await completeHostOnboarding(payload);
      }

      navigate("/hosting/listings");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this listing.");
    } finally {
      setSaving(false);
    }
  };

  const renderScreen = () => {
    const content = (() => {
      switch (currentScreen.id) {
      case "placeIntro":
        return (
          <>
            <ScreenHeading
              kicker="Step 1"
              title="Tell us about your place"
              helper="We will start with the basics so guests understand what kind of stay you are offering."
            />
            <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-rose-100/50">
              <p className="text-lg font-semibold text-slate-900">
                {isCreateMode
                  ? "Create another listing for your host account."
                  : `Welcome${user?.username ? `, ${user.username}` : ""}. Your first listing starts here.`}
              </p>
            </div>
          </>
        );
      case "category":
        return (
          <>
            <ScreenHeading
              kicker="Property category"
              title="Which of these best describes your place?"
            />
            <OptionGrid
              options={propertyCategories}
              selectedValue={form.propertyCategory}
              onSelect={(value) => updateForm("propertyCategory", value)}
            />
          </>
        );
      case "placeType":
        return (
          <>
            <ScreenHeading
              kicker="Place type"
              title="What will guests have?"
            />
            <OptionGrid
              options={placeTypes}
              selectedValue={form.placeType}
              onSelect={(value) => updateForm("placeType", value)}
            />
          </>
        );
      case "address":
        return (
          <>
            <ScreenHeading
              kicker="Location"
              title="Where is your place located?"
              helper="Use the address or a clear location guests and hosts can recognize."
            />
            <input
              type="text"
              value={form.address}
              onChange={(event) => updateForm("address", event.target.value)}
              className="w-full rounded-3xl border border-white/80 bg-white/90 px-6 py-5 text-lg font-semibold text-slate-950 shadow-xl shadow-rose-100/40 outline-none transition-all duration-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Unit, street, city, state"
              autoFocus
            />
          </>
        );
      case "basics":
        return (
          <>
            <ScreenHeading
              kicker="Basics"
              title="Share some basics about your place"
            />
            <div className="grid gap-3">
              <CounterControl
                label="Guests"
                min={1}
                value={form.guestCount}
                onChange={(value) => updateForm("guestCount", value)}
              />
              <CounterControl
                label="Bedrooms"
                value={form.bedroomCount}
                onChange={(value) => updateForm("bedroomCount", value)}
              />
              <CounterControl
                label="Beds"
                value={form.bedCount}
                onChange={(value) => updateForm("bedCount", value)}
              />
              <CounterControl
                label="Bathrooms"
                value={form.bathroomCount}
                onChange={(value) => updateForm("bathroomCount", value)}
              />
            </div>
          </>
        );
      case "standOutIntro":
        return (
          <ScreenHeading
            kicker="Step 2"
            title="Make your place stand out"
            helper="Now add the details that help guests understand comfort, safety, and the character of your stay."
          />
        );
      case "amenities":
        return (
          <>
            <ScreenHeading
              kicker="Amenities"
              title="Tell guests what your place offers"
            />
            <AmenitySelector
              groups={amenityGroups}
              values={{
                unitFeatures: form.unitFeatures,
                propertyFacilities: form.propertyFacilities,
                safetyFeatures: form.safetyFeatures,
              }}
              onChange={updateAmenities}
            />
          </>
        );
      case "photos":
        return (
          <>
            <ScreenHeading
              kicker="Photos"
              title="Add photos later"
              helper="Photo upload is intentionally a placeholder for now. No upload, S3, or base64 storage is used in this flow."
            />
            <div className="grid gap-4 rounded-3xl border border-dashed border-rose-200 bg-white/85 p-6 shadow-xl shadow-rose-100/40 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[4/3] rounded-2xl border border-white/80 bg-gradient-to-br from-slate-50 to-rose-50 shadow-sm"
                />
              ))}
              <p className="sm:col-span-3 text-center text-sm font-bold text-slate-500">
                Photo upload placeholder
              </p>
            </div>
          </>
        );
      case "title":
        return (
          <>
            <ScreenHeading
              kicker="Listing title"
              title="Give your place a short title"
            />
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              className="w-full rounded-3xl border border-white/80 bg-white/90 px-6 py-5 text-lg font-semibold text-slate-950 shadow-xl shadow-rose-100/40 outline-none transition-all duration-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Cozy studio near the city center"
              autoFocus
            />
          </>
        );
      case "description":
        return (
          <>
            <ScreenHeading
              kicker="Description"
              title="Describe what guests can expect"
            />
            <textarea
              rows="7"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              className="w-full resize-none rounded-3xl border border-white/80 bg-white/90 px-6 py-5 text-lg font-semibold leading-8 text-slate-950 shadow-xl shadow-rose-100/40 outline-none transition-all duration-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              placeholder="Describe the space, nearby attractions, and anything guests should know."
              autoFocus
            />
          </>
        );
      case "finishIntro":
        return (
          <ScreenHeading
            kicker="Step 3"
            title="Finish up"
            helper="Set when the stay can be booked and choose a nightly price. New listings stay unlisted until you publish them."
          />
        );
      case "availability":
        return (
          <>
            <ScreenHeading
              kicker="Availability"
              title="When is your place available?"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Available From
                </label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={(event) =>
                    updateForm("availableFrom", event.target.value)
                  }
                  className="w-full rounded-3xl border border-white/80 bg-white/90 px-6 py-5 text-lg font-semibold text-slate-950 shadow-xl shadow-rose-100/40 outline-none transition-all duration-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Available To
                </label>
                <input
                  type="date"
                  value={form.availableTo}
                  onChange={(event) =>
                    updateForm("availableTo", event.target.value)
                  }
                  className="w-full rounded-3xl border border-white/80 bg-white/90 px-6 py-5 text-lg font-semibold text-slate-950 shadow-xl shadow-rose-100/40 outline-none transition-all duration-300 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>
            </div>
          </>
        );
      case "price":
        return (
          <>
            <ScreenHeading
              kicker="Nightly price"
              title="Now, set your price"
            />
            <PriceSelector
              value={form.pricePerNight}
              onChange={(value) => updateForm("pricePerNight", value)}
            />
          </>
        );
      case "done":
        return (
          <>
            <ScreenHeading
              kicker="Ready"
              title="You are done. Happy hosting."
              helper="We will save this as an unlisted, available listing so you can review it before guests see it."
            />
            <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-rose-100/50">
              <h2 className="text-xl font-bold tracking-normal text-slate-950">
                {form.title || "Your new listing"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{form.address}</p>
              <p className="mt-4 text-2xl font-bold tracking-normal text-slate-950">
                RM {form.pricePerNight} per night
              </p>
            </div>
          </>
        );
      default:
        return null;
      }
    })();

    return (
      <WizardScreen visual={screenVisuals[currentScreen.id]}>
        {content}
      </WizardScreen>
    );
  };

  return (
    <WizardShell
      canGoBack={screenIndex > 0}
      canGoNext={currentScreenValid}
      error={error}
      isFinal={isFinal}
      isSubmitting={saving}
      nextLabel={isFinal ? (isCreateMode ? "Save listing" : "Finish setup") : "Next"}
      onBack={handleBack}
      onExit={handleExit}
      onNext={handleNext}
      onSubmit={handleSubmit}
      progress={progress}
      progressLabel={`${stepNames[currentScreen.mainStep]} - ${screenIndex + 1} of ${screens.length}`}
    >
      {renderScreen()}
    </WizardShell>
  );
}

export default ListingWizard;
