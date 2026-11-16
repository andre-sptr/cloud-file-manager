import { useEffect, useRef, type CSSProperties, type ImgHTMLAttributes, type PointerEvent } from "react";
import { ArrowDownRight, Link2, Lock, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_FILES_UPLOAD, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { scrollToSection } from "@/lib/scroll";
import heroImage from "@/assets/hero-cloud.jpg";

interface HeroProps {
  onUploadClick: () => void;
  onFeaturesClick?: () => void;
}

export const Hero = ({ onUploadClick, onFeaturesClick }: HeroProps) => {
  const stageRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleViewFeatures = () => {
    if (onFeaturesClick) {
      onFeaturesClick();
    } else {
      scrollToSection("features");
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || !stageRef.current) return;

    const { clientX, clientY } = event;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      el.style.setProperty("--mx", `${(normX * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(normY * 100).toFixed(1)}%`);
      el.style.setProperty("--hx", ((normX - 0.5) * 2).toFixed(3));
      el.style.setProperty("--hy", ((normY - 0.5) * 2).toFixed(3));
    });
  };

  const handlePointerLeave = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty("--hx", "0");
    el.style.setProperty("--hy", "0");
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20 overflow-x-clip"
    >
      <div
        className="hero-architectural-grid absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4 max-w-6xl">
        <div>
          <div
            className="hero-reveal flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6"
            style={{ "--hero-delay": "0ms" } as CSSProperties}
          >
            <p className="inline-flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-700">
              <span
                className="inline-block w-2 h-2 bg-blue-600 ring-4 ring-blue-600/15 shrink-0"
                aria-hidden="true"
              />
              <span>Self-Hosted File Storage</span>
            </p>

            <p className="hidden sm:flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-slate-600">
              <span className="text-blue-700 font-semibold">00</span>
              <span aria-hidden="true" className="text-slate-400">
                /
              </span>
              <span>Overview</span>
            </p>
          </div>

          <h1
            id="hero-heading"
            className="text-[clamp(2.45rem,5.5vw,4.45rem)] font-bold tracking-[-0.038em] leading-[1.01] text-slate-950 max-w-4xl"
          >
            <span className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
              <span
                className="hero-clip-line block"
                style={{ "--hero-delay": "50ms" } as CSSProperties}
              >
                Store and share files
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
              <span
                className="hero-clip-line block text-blue-600 mt-1"
                style={{ "--hero-delay": "120ms" } as CSSProperties}
              >
                on your own server.
              </span>
            </span>
          </h1>
        </div>

        <div className="relative mt-8 sm:mt-10 border-t border-slate-300/80 pt-8 sm:pt-10">
          <span
            aria-hidden="true"
            className="absolute -top-[1.5px] left-0 h-[2px] w-16 bg-blue-600"
          />

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 flex flex-col justify-between gap-7 sm:gap-8">
              <p
                className="hero-reveal text-base sm:text-[17px] leading-[1.65] text-slate-700"
                style={{ "--hero-delay": "160ms" } as CSSProperties}
              >
                <strong className="font-semibold text-slate-950">
                  Private by default, shareable on your terms.
                </strong>{" "}
                Upload images, audio, video, and documents straight to your own server, then create
                public links one file at a time whenever you choose.
              </p>

              <div
                className="hero-reveal space-y-3"
                style={{ "--hero-delay": "220ms" } as CSSProperties}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    className="group min-h-[44px] px-6 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_1px_2px_rgba(15,23,42,0.1)]"
                    onClick={onUploadClick}
                  >
                    <Upload
                      className="w-4 h-4 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                    <span>Upload Files</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="group min-h-[44px] px-5 rounded-md text-sm font-medium border-slate-400/90 bg-white/85 backdrop-blur-sm text-slate-900 hover:bg-white hover:border-slate-900 hover:text-slate-950 active:bg-slate-100"
                    onClick={handleViewFeatures}
                  >
                    <span>View Features</span>
                    <ArrowDownRight
                      className="w-4 h-4 text-slate-600 group-hover:text-slate-950 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:translate-y-0.5"
                      aria-hidden="true"
                    />
                  </Button>
                </div>

                <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono uppercase tracking-[0.12em] text-[10px] text-blue-700 font-semibold">
                    Formats
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    /
                  </span>
                  <span>JPG, PNG, WebP, MP4, MP3, PDF, CSV, JSON, ZIP</span>
                </p>
              </div>

              <dl
                className="hero-reveal border-t border-slate-300/80 pt-5 grid grid-cols-3 gap-3 sm:gap-0 sm:divide-x sm:divide-slate-300/70"
                style={{ "--hero-delay": "280ms" } as CSSProperties}
              >
                <div className="sm:pr-5">
                  <dt className="text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-600">
                    Max File
                  </dt>
                  <dd className="mt-1 text-base sm:text-lg font-semibold tabular-nums tracking-tight text-slate-950">
                    {MAX_FILE_SIZE_MB} MB
                  </dd>
                </div>
                <div className="sm:px-5">
                  <dt className="text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-600">
                    Batch Limit
                  </dt>
                  <dd className="mt-1 text-base sm:text-lg font-semibold tabular-nums tracking-tight text-slate-950">
                    {MAX_FILES_UPLOAD} Files
                  </dd>
                </div>
                <div className="sm:pl-5">
                  <dt className="text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-600">
                    Visibility
                  </dt>
                  <dd className="mt-1 text-base sm:text-lg font-semibold tracking-tight text-slate-950">
                    Private
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              <figure
                ref={stageRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                className="hero-stage rounded-xl border border-slate-300/85 bg-white/75 backdrop-blur-sm p-1.5 sm:p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.95)]"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden rounded-lg border border-slate-200/90 bg-[#edf4ff]">
                  <img
                    src={heroImage}
                    alt="Isometric illustration of stacked server storage blocks and floating uploaded media files on a pale blue canvas"
                    width={1920}
                    height={1080}
                    decoding="async"
                    {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
                    className="hero-stage-image h-full w-full object-cover object-right"
                  />

                  <div
                    className="hero-grain absolute inset-0 pointer-events-none"
                    aria-hidden="true"
                  />
                  <div
                    className="hero-stage-sheen absolute inset-0 pointer-events-none"
                    aria-hidden="true"
                  />

                  <div
                    aria-hidden="true"
                    className="hero-reveal absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none"
                    style={{ "--hero-delay": "220ms" } as CSSProperties}
                  >
                    <div className="hero-glass-surface hero-parallax-subtle inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-medium text-slate-800">
                      <Lock className="w-3 h-3 text-blue-700 shrink-0" />
                      <span>AUTH-PROTECTED STORAGE</span>
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className="hero-reveal hidden sm:block absolute bottom-4 left-4 w-[228px] pointer-events-none"
                    style={{ "--hero-delay": "300ms" } as CSSProperties}
                  >
                    <div className="hero-glass-surface hero-parallax-card rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-950">
                            release-notes.pdf
                          </p>
                          <p className="mt-0.5 text-[11px] font-mono tabular-nums text-slate-600">
                            4.2 MB · PDF
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded bg-blue-600/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-700 shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          MIME OK
                        </span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          Private by default
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600">
                          <Link2 className="w-3 h-3 text-blue-700" />
                          /f/share
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <figcaption className="flex items-center justify-between gap-3 px-2 pt-2.5 pb-1 text-[11px] font-mono tracking-[0.06em] text-slate-600">
                  <span className="truncate uppercase">
                    Fig. 01 — Self-hosted vault &amp; scoped sharing
                  </span>
                  <span className="hidden sm:inline shrink-0 text-blue-700 font-semibold uppercase">
                    Zero 3P Lock-in
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
