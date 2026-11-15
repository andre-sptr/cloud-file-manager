import { FileCheck, Link2, Shield, Upload } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Multi-File Upload",
    description:
      "Drag and drop up to 10 files at once with real-time upload progress for images, audio, video, PDFs, and archives.",
  },
  {
    icon: Shield,
    title: "Private by Default",
    description:
      "Every uploaded file requires authentication to view or download unless you explicitly enable public sharing.",
  },
  {
    icon: Link2,
    title: "Controlled Sharing",
    description:
      "Generate a public share link for any file in one click and revoke public access again whenever you need.",
  },
  {
    icon: FileCheck,
    title: "Validated Storage",
    description:
      "Server-side MIME, extension, and file-signature verification ensures safe handling before storing files locally.",
  },
];

export const Features = () => {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-slate-900">
            Built for direct file control
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Upload, organize, and share files straight from your server without third-party storage lock-in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 lg:p-7 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 shadow-sm transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};