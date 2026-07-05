import { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleIdentityScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

function GoogleSignInButton({
  disabled,
  onCredential,
  onError,
  text = "signin_with",
}) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const configured =
    clientId && clientId !== "PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE";

  useEffect(() => {
    if (!configured || disabled) return undefined;

    let active = true;

    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
            } else {
              onError?.("Google did not return a sign-in credential.");
            }
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text,
          width: buttonRef.current.offsetWidth || 320,
        });
        setReady(true);
      })
      .catch(() => {
        if (active) {
          onError?.("Could not load Google Sign-In.");
        }
      });

    return () => {
      active = false;
    };
  }, [clientId, configured, disabled, onCredential, onError, text]);

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Google sign-in needs VITE_GOOGLE_CLIENT_ID.
      </div>
    );
  }

  return (
    <div
      className={`min-h-11 w-full ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <div ref={buttonRef} className="grid min-h-11 w-full place-items-center" />
      {!ready && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-500">
          Loading Google sign-in...
        </div>
      )}
    </div>
  );
}

export default GoogleSignInButton;
