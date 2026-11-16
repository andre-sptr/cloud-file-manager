import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfiguration {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  type?: "standard" | "icon";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  logo_alignment?: "left" | "center";
  width?: number;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdInitializeConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
let gisLoadPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;

const loadGisScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window unavailable"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gisLoadPromise) {
    return gisLoadPromise;
  }

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_URL}"]`
    );
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => {
          gisLoadPromise = null;
          reject(new Error("Failed to load Google Sign-In script"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        gisLoadPromise = null;
        reject(new Error("Failed to load Google Sign-In script"));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return gisLoadPromise;
};

const GoogleLogo = () => (
  <svg
    className="w-4 h-4 shrink-0"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

interface GoogleAuthButtonProps {
  mode: "login" | "signup";
  clientId: string | null;
  configLoading?: boolean;
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onUnavailableClick?: (reason: string) => void;
}

export const GoogleAuthButton = ({
  mode,
  clientId,
  configLoading = false,
  disabled = false,
  onCredential,
  onUnavailableClick,
}: GoogleAuthButtonProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  const [gisReady, setGisReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [containerWidth, setContainerWidth] = useState(360);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      const next = Math.min(400, Math.max(220, Math.floor(el.clientWidth)));
      setContainerWidth((prev) => (prev === next ? prev : next));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!clientId) {
      setGisReady(false);
      return;
    }

    let cancelled = false;
    setScriptFailed(false);

    loadGisScript()
      .then(() => {
        if (!cancelled && window.google?.accounts?.id) {
          setGisReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGisReady(false);
          setScriptFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !gisReady || !buttonHostRef.current) return;
    const googleId = window.google?.accounts?.id;
    if (!googleId) return;

    if (initializedClientId !== clientId) {
      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            onCredentialRef.current(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });
      initializedClientId = clientId;
    }

    buttonHostRef.current.replaceChildren();
    googleId.renderButton(buttonHostRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: mode === "signup" ? "signup_with" : "continue_with",
      logo_alignment: "center",
      width: containerWidth,
    });
  }, [clientId, gisReady, mode, containerWidth]);

  const fallbackLabel = mode === "signup" ? "Sign up with Google" : "Continue with Google";

  const handleFallbackClick = () => {
    if (disabled || configLoading) return;
    if (!clientId) {
      onUnavailableClick?.(
        "Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID to server/.env and restart the backend."
      );
      return;
    }
    if (scriptFailed) {
      setScriptFailed(false);
      loadGisScript()
        .then(() => {
          if (window.google?.accounts?.id) {
            setGisReady(true);
          }
        })
        .catch(() => {
          setScriptFailed(true);
          onUnavailableClick?.(
            "Unable to load Google Sign-In. Check your network connection or content blocker."
          );
        });
    }
  };

  return (
    <div ref={wrapperRef} className="w-full">
      {clientId && gisReady && !scriptFailed ? (
        <div
          aria-disabled={disabled ? "true" : undefined}
          className={`flex justify-center min-h-[44px] transition-opacity ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div ref={buttonHostRef} className="w-full flex justify-center" />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || configLoading}
          onClick={handleFallbackClick}
          className="w-full min-h-[48px] rounded-full border-slate-400/90 bg-white/95 hover:bg-white hover:border-slate-900 hover:text-slate-950 text-slate-900 font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-colors"
        >
          <GoogleLogo />
          <span>{configLoading ? "Checking Google Sign-In..." : fallbackLabel}</span>
        </Button>
      )}
    </div>
  );
};
