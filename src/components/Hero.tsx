import type { ImgHTMLAttributes } from "react";
import { ArrowDownRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/scroll";
import heroImage from "@/assets/hero-cloud.jpg";

interface HeroProps {
  onUploadClick: () => void;
  onFeaturesClick?: () => void;
}

export const Hero = ({ onUploadClick, onFeaturesClick }: HeroProps) => {
  const handleViewFeatures = () => {
    if (onFeaturesClick) {
      onFeaturesClick();
    } else {
      scrollToSection("features");
    }
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 overflow-x-clip"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div>
          <p className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-600 mb-5">
            <span className="inline-block w-2 h-2 bg-blue-600 shrink-0" aria-hidden="true" />
            <span>Self-Hosted File Storage</span>
          </p>

          <h1
            id="hero-heading"
            className="text-[clamp(2.35rem,5.4vw,4.35rem)] font-bold tracking-[-0.035em] leading-[1.03] text-slate-950 max-w-4xl"
          >
            Store and share files
            <span className="block text-blue-600 mt-1">on your own server.</span>
          </h1>
        </div>

        <div className="mt-8 sm:mt-11 border-t border-slate-300/80 pt-8 sm:pt-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 flex flex-col justify-between gap-7 sm:gap-9">
            <p className="text-base sm:text-[17px] leading-[1.65] text-slate-700">
              Upload images, audio, video, and documents straight to private server storage. Create
              public links one file at a time whenever you choose to share.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="min-h-[44px] px-6 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-none"
                onClick={onUploadClick}
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Upload Files
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[44px] px-5 rounded-md text-sm font-medium border-slate-500 bg-white/85 text-slate-900 hover:bg-white hover:border-slate-800 active:bg-slate-100"
                onClick={handleViewFeatures}
              >
                View Features
                <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            <dl className="border-t border-slate-300/80 pt-5 grid grid-cols-3 gap-3 sm:gap-5">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
                  Max Size
                </dt>
                <dd className="mt-1 text-base sm:text-lg font-semibold tabular-nums text-slate-950">
                  15 MB
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
                  Batch
                </dt>
                <dd className="mt-1 text-base sm:text-lg font-semibold tabular-nums text-slate-950">
                  10 Files
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
                  Access
                </dt>
                <dd className="mt-1 text-base sm:text-lg font-semibold text-slate-950">
                  Private
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <figure className="overflow-hidden rounded-lg border border-slate-300/80 bg-[#edf4ff]">
              <div className="aspect-[16/10] sm:aspect-[16/11] w-full overflow-hidden">
                <img
                  src={heroImage}
                  alt="Isometric illustration of stacked server storage blocks and floating uploaded media files on a pale blue canvas"
                  width={1920}
                  height={1080}
                  decoding="async"
                  {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
                  className="h-full w-full object-cover object-right"
                />
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};
