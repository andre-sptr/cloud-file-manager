import type { ImgHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import heroImage from "@/assets/hero-cloud.jpg";

interface HeroProps {
  onUploadClick: () => void;
  onFeaturesClick?: () => void;
}

const getScrollBehavior = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

export const Hero = ({ onUploadClick, onFeaturesClick }: HeroProps) => {
  const handleViewFeatures = () => {
    if (onFeaturesClick) {
      onFeaturesClick();
    } else {
      document.getElementById("features")?.scrollIntoView({ behavior: getScrollBehavior() });
    }
  };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative py-12 sm:py-16 lg:py-24 overflow-x-clip"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <h1
              id="hero-heading"
              className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.12] text-slate-900"
            >
              Store and share files
              <span className="block text-blue-600 mt-1.5">on your own server.</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl">
              Upload images, audio, video, and documents straight to private server storage. Create
              public links one file at a time whenever you choose to share.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button
                size="lg"
                className="min-h-[44px] px-7 text-base font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/15"
                onClick={onUploadClick}
              >
                <Upload aria-hidden="true" />
                Upload Files
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[44px] px-7 text-base font-medium border-slate-500 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-700 active:bg-slate-200"
                onClick={handleViewFeatures}
              >
                View Features
              </Button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-slate-200/90 max-w-lg">
              <div>
                <dt className="text-xs font-medium text-slate-600">Max File Size</dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">15 MB</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-600">Batch Limit</dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">10 Files</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-600">Default Access</dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">Private</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6">
            <figure className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/5">
              <div className="overflow-hidden rounded-xl bg-slate-100 aspect-video">
                <img
                  src={heroImage}
                  alt="Isometric illustration of layered server storage blocks and uploaded media cards on a light canvas"
                  width={1920}
                  height={1080}
                  decoding="async"
                  {...({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>)}
                  className="h-full w-full object-cover"
                />
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
};