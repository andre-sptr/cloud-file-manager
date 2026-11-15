/**
 * Scrolls to a page section while honoring the user's reduced-motion setting.
 */
export const scrollToSection = (sectionId: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  document.getElementById(sectionId)?.scrollIntoView({ behavior });
};
