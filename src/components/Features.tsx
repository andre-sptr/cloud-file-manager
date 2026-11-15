const capabilities = [
  {
    index: "01",
    title: "Multi-File Upload",
    description:
      "Drag and drop up to 10 files at once with real-time upload progress for images, audio, video, PDFs, and archives.",
  },
  {
    index: "02",
    title: "Private by Default",
    description:
      "Every uploaded file requires authentication to view or download unless you explicitly enable public sharing.",
  },
  {
    index: "03",
    title: "Controlled Sharing",
    description:
      "Generate a public share link for any file in one click and revoke public access again whenever you need.",
  },
  {
    index: "04",
    title: "Validated Storage",
    description:
      "Server-side MIME, extension, and file-signature verification ensures safe handling before storing files locally.",
  },
];

export const Features = () => {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-14 sm:py-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="border-t border-slate-300/80 pt-12 sm:pt-16 grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600 mb-3">
              01 / Capabilities
            </p>
            <h2
              id="features-heading"
              className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] leading-[1.15] text-slate-950"
            >
              Built for direct file control.
            </h2>
            <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600">
              Upload, organize, and share files straight from your server without third-party
              storage lock-in.
            </p>
          </div>

          <ol className="lg:col-span-8 divide-y divide-slate-300/80 border-y border-slate-300/80">
            {capabilities.map((capability) => (
              <li
                key={capability.index}
                className="grid sm:grid-cols-12 gap-2 sm:gap-6 py-5 sm:py-6 items-baseline"
              >
                <span className="sm:col-span-2 text-xs font-mono font-semibold tracking-widest text-blue-700 tabular-nums">
                  {capability.index}
                </span>
                <h3 className="sm:col-span-4 text-base sm:text-lg font-semibold tracking-tight text-slate-950">
                  {capability.title}
                </h3>
                <p className="sm:col-span-6 text-sm leading-relaxed text-slate-600">
                  {capability.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
