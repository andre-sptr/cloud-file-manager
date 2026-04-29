import { Upload, Link2, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Fast Upload",
    description:
      "Upload your files quickly with our optimized infrastructure. Support for images, videos, and documents.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your files are protected with enterprise-grade security. Only you can access your uploads.",
  },
  {
    icon: Link2,
    title: "Instant Sharing",
    description:
      "Generate shareable links instantly. Share your files with anyone, anywhere in the world.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Experience blazing fast speeds for uploads and downloads. No waiting, just results.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900">Everything You Need</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Powerful features designed to make file sharing effortless
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 lg:p-8 rounded-2xl bg-white hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 hover:shadow-blue-100 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3 text-slate-800">
                {feature.title}
              </h3>
              <p className="text-sm lg:text-base text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};