import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, Lock, Share2, ShieldCheck, UploadCloud, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_FILES_UPLOAD, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { scrollToSection } from "@/lib/scroll";

interface Capability {
  index: string;
  tag: string;
  title: string;
  description: string;
  specs: string[];
  icon: LucideIcon;
}

const capabilities: Capability[] = [
  {
    index: "01",
    tag: "Batch Transfer",
    title: "Multi-File Upload",
    description: `Drag and drop up to ${MAX_FILES_UPLOAD} files at once with real-time upload progress and cancel control for images, audio, video, PDFs, and archives.`,
    specs: [`${MAX_FILES_UPLOAD} files / batch`, `${MAX_FILE_SIZE_MB} MB max`, "Live progress"],
    icon: UploadCloud,
  },
  {
    index: "02",
    tag: "Access Control",
    title: "Private by Default",
    description:
      "Every uploaded file requires an authenticated session to preview or download unless you explicitly switch public sharing on.",
    specs: ["Bearer auth", "Protected media", "Opt-in public"],
    icon: Lock,
  },
  {
    index: "03",
    tag: "Scoped Links",
    title: "Controlled Sharing",
    description:
      "Generate a dedicated public share link for any file in one click and revoke public access back to private whenever you need.",
    specs: ["1-click /f/:id", "Instant revoke", "Per-file toggle"],
    icon: Share2,
  },
  {
    index: "04",
    tag: "Server Verification",
    title: "Validated Storage",
    description:
      "Server-side MIME, extension, and binary file-signature verification ensures safe handling before storing files directly on your VPS.",
    specs: ["MIME + ext check", "Magic signature", "Local VPS disk"],
    icon: ShieldCheck,
  },
];

const pipelineSteps = [
  { step: "01. Ingest", label: "Batch XHR" },
  { step: "02. Guard", label: "MIME + Sig" },
  { step: "03. Scope", label: "Private / Link" },
];

export const Features = () => {
  const listRef = useRef<HTMLOListElement | null>(null);
  const [revealState, setRevealState] = useState<"static" | "pending" | "visible">("static");

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl || typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      return;
    }

    if (!CSS.supports("animation-delay: calc(sibling-index() * 0.1s)")) {
      Array.from(listEl.children).forEach((child, idx) => {
        (child as HTMLElement).style.setProperty("--sibling-index", String(idx + 1));
      });
    }

    const rect = listEl.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94) {
      setRevealState("visible");
      return;
    }

    setRevealState("pending");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(listEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="features" aria-labelledby="features-heading" className="relative py-14 sm:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="relative border-t border-slate-300/80 pt-12 sm:pt-16">
          <span
            aria-hidden="true"
            className="absolute -top-[1.5px] left-0 h-[2px] w-16 bg-blue-600"
          />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <div>
                <p className="inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-700 mb-3.5">
                  <span
                    className="inline-block w-2 h-2 bg-blue-600 ring-4 ring-blue-600/15 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-blue-700 font-semibold">01</span>
                  <span aria-hidden="true" className="text-slate-400">
                    /
                  </span>
                  <span>Capabilities</span>
                </p>

                <h2
                  id="features-heading"
                  className="text-2xl sm:text-3xl lg:text-[2.15rem] font-bold tracking-[-0.03em] leading-[1.12] text-slate-950"
                >
                  Built for direct{" "}
                  <span className="text-blue-600">file control.</span>
                </h2>

                <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600">
                  Upload, organize, and share files straight from your own server without
                  third-party storage lock-in.
                </p>
              </div>

              <div className="hero-glass-surface rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-slate-600">
                  <span>Server Pipeline</span>
                  <span className="text-blue-700 font-semibold">Direct VPS</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {pipelineSteps.map((item) => (
                    <div
                      key={item.step}
                      className="rounded-lg border border-slate-200/80 bg-white/80 px-2.5 py-2"
                    >
                      <p className="text-[10px] font-mono text-slate-600 uppercase">
                        {item.step}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-950">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("dashboard")}
                className="group w-full sm:w-auto min-h-[44px] px-5 rounded-md text-sm font-medium border-slate-400/90 bg-white/85 backdrop-blur-sm text-slate-900 hover:bg-white hover:border-slate-900 hover:text-slate-950 active:bg-slate-100"
              >
                <span>Open Workspace</span>
                <ArrowDownRight
                  className="w-4 h-4 text-slate-600 group-hover:text-slate-950 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </Button>
            </div>

            <ol
              ref={listRef}
              data-reveal={revealState}
              className="features-list lg:col-span-8 divide-y divide-slate-300/80 border-y border-slate-300/80"
            >
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                return (
                  <li
                    key={capability.index}
                    className="features-item group relative grid sm:grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-7 px-3 sm:px-5 rounded-sm transition-colors duration-200 hover:bg-white/75"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-3 bottom-3 w-[2px] bg-blue-600 scale-y-0 group-hover:scale-y-100 origin-top motion-safe:transition-transform motion-safe:duration-300"
                    />

                    <div className="sm:col-span-2 flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2.5">
                      <span className="text-xs font-mono font-semibold tracking-widest text-blue-700 tabular-nums">
                        {capability.index}
                      </span>
                      <span
                        aria-hidden="true"
                        className="w-9 h-9 rounded-md border border-slate-200/90 bg-white flex items-center justify-center text-slate-700 transition-colors duration-200 group-hover:border-blue-300 group-hover:bg-blue-50/70 group-hover:text-blue-700"
                      >
                        <Icon className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5" />
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-950">
                        {capability.title}
                      </h3>
                      <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.12em] text-slate-600">
                        {capability.tag}
                      </p>
                    </div>

                    <div className="sm:col-span-6 space-y-3">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {capability.description}
                      </p>
                      <ul
                        aria-label={`${capability.title} specifications`}
                        className="flex flex-wrap gap-1.5"
                      >
                        {capability.specs.map((spec) => (
                          <li
                            key={spec}
                            className="inline-flex items-center rounded border border-slate-200/90 bg-white/80 px-2 py-0.5 text-[11px] font-mono text-slate-700 transition-colors duration-200 group-hover:border-slate-300 group-hover:bg-white"
                          >
                            {spec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};
