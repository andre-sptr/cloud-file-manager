import { Button } from "@/components/ui/button";
import { Cloud, Upload } from "lucide-react";
import heroImage from "@/assets/hero-cloud.jpg";

interface HeroProps {
  onUploadClick: () => void;
  onLearnMoreClick?: () => void;
}

export const Hero = ({ onUploadClick, onLearnMoreClick }: HeroProps) => {
  const handleLearnMore = () => {
    if (onLearnMoreClick) {
      onLearnMoreClick();
    } else {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-blue-50 to-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.08),transparent)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium w-fit mt-4">
              <Cloud className="w-4 h-4" />
              Secure Cloud Storage
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900">
              Upload, Share, and Store
              <span className="block text-blue-600 mt-2">Your Files with Ease</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-xl">
              A modern and secure file hosting platform. Upload images, videos, and
              documents. Share instantly with public links.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="text-lg px-8 shadow-lg hover:shadow-xl transition-all bg-blue-600 hover:bg-blue-700"
                onClick={onUploadClick}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-700"
                onClick={handleLearnMore}
              >
                Learn More
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-8">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "300ms" }}>
                <div className="text-3xl font-bold text-blue-600">15MB</div>
                <div className="text-sm text-slate-500">Max File Size</div>
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "400ms" }}>
                <div className="text-3xl font-bold text-blue-600">Unlimited</div>
                <div className="text-sm text-slate-500">Storage Space</div>
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "500ms" }}>
                <div className="text-3xl font-bold text-blue-600">Secure</div>
                <div className="text-sm text-slate-500">& Private</div>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-700" style={{ animationDelay: "200ms" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl blur-3xl animate-pulse" />
            <img
              src={heroImage}
              alt="Cloud storage illustration"
              className="relative w-full rounded-3xl shadow-2xl hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
};