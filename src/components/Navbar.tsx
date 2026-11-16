import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Cloud,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { scrollToSection } from "@/lib/scroll";
import type { User } from "@/types";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavbarProps {
  user: User | null;
}

type NavSectionId = "overview" | "features" | "dashboard";

const navItems: { id: NavSectionId; index: string; label: string; href: string }[] = [
  { id: "overview", index: "00", label: "Overview", href: "#main-content" },
  { id: "features", index: "01", label: "Features", href: "#features" },
  { id: "dashboard", index: "02", label: "Workspace", href: "#dashboard" },
];

export const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSectionId>("overview");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
      if (window.scrollY < 100) {
        setActiveSection("overview");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const heroEl = document.querySelector("main > section:first-of-type");
    const featuresEl = document.getElementById("features");
    const dashboardEl = document.getElementById("dashboard");

    const targets: { id: NavSectionId; el: Element }[] = [];
    if (heroEl) targets.push({ id: "overview", el: heroEl });
    if (featuresEl) targets.push({ id: "features", el: featuresEl });
    if (dashboardEl) targets.push({ id: "dashboard", el: dashboardEl });

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const matched = targets.find((item) => item.el === entry.target);
          if (matched) {
            setActiveSection(matched.id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    targets.forEach(({ el }) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, id: NavSectionId) => {
    event.preventDefault();
    setMobileOpen(false);
    setActiveSection(id);

    if (id === "overview") {
      const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      window.scrollTo({ top: 0, behavior });
      return;
    }

    scrollToSection(id);
  };

  const handleLogout = async () => {
    try {
      await api.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-200 ${
        isScrolled
          ? "bg-white/90 border-slate-300/85 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.16)]"
          : "bg-white/75 border-slate-200/80"
      }`}
    >
      <nav aria-label="Primary" className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between min-h-16 py-2 gap-3">
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 min-h-[44px] shrink-0"
          >
            <span className="w-8 h-8 rounded-lg border border-slate-300/90 bg-white flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-colors duration-200 group-hover:border-blue-400">
              <Cloud className="w-4 h-4 text-blue-600" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
              VPS File Hub
            </span>
          </Link>

          <div className="hidden md:inline-flex items-center gap-1 rounded-full border border-slate-300/85 bg-slate-100/80 backdrop-blur-md p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => handleNavClick(event, item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 min-h-[36px] text-xs tracking-tight transition-colors duration-200 border ${
                    isActive
                      ? "bg-white text-slate-950 font-semibold border-slate-300/90 shadow-[0_1px_3px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)]"
                      : "border-transparent text-slate-600 font-medium hover:text-slate-950 hover:bg-white/65"
                  }`}
                >
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`font-mono text-[10px] tabular-nums ${
                      isActive ? "text-blue-700 font-semibold" : "text-slate-600"
                    }`}
                  >
                    {item.index}
                  </span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-full border border-slate-300/90 bg-white/85 text-xs font-medium text-slate-800 hover:bg-white hover:border-slate-400 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Menu</span>
            </button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="group min-h-[44px] rounded-full border border-slate-300/90 bg-white/90 hover:bg-white hover:border-slate-400 pl-1.5 pr-3 gap-2.5 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,1)]"
                  >
                    <span className="relative w-7 h-7 rounded-full border border-blue-200/80 bg-blue-50 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="hidden sm:inline max-w-[180px] truncate text-xs font-mono text-slate-800">
                      {user.email}
                    </span>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-slate-600 motion-safe:transition-transform motion-safe:duration-200 group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-xl bg-white/95 backdrop-blur-xl border-slate-200/90 text-slate-700 p-1.5 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.16)]"
                >
                  <DropdownMenuLabel className="px-2.5 py-2">
                    <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                      Signed in
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-900">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-200/80" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg focus:bg-slate-100 focus:text-slate-950 cursor-pointer min-h-[44px] px-2.5 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2 text-slate-600" aria-hidden="true" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                onClick={() => navigate("/auth")}
                className="nav-cta-pill group min-h-[44px] pl-5 pr-2 gap-2.5 rounded-full text-sm font-semibold bg-slate-950 hover:bg-blue-600 active:bg-blue-700 text-white border border-slate-800/80 hover:border-blue-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_6px_-2px_rgba(15,23,42,0.22)] transition-colors duration-200"
              >
                <span className="relative inline-flex overflow-hidden h-[1.25em] leading-[1.25]">
                  <span className="nav-cta-label nav-cta-label-primary block">Login</span>
                  <span
                    aria-hidden="true"
                    className="nav-cta-label nav-cta-label-hover motion-reduce:hidden absolute inset-0 translate-y-full"
                  >
                    Login
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white text-white group-hover:text-blue-600 flex items-center justify-center transition-colors duration-200"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-[1px] motion-safe:group-hover:-translate-y-[1px]" />
                </span>
              </Button>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-nav-panel" className="md:hidden pb-3 pt-1">
            <div className="hero-glass-surface rounded-2xl p-2 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "true" : undefined}
                    onClick={(event) => handleNavClick(event, item.id)}
                    className={`flex items-center justify-between rounded-xl px-3.5 min-h-[44px] text-sm transition-colors border ${
                      isActive
                        ? "bg-white text-slate-950 font-semibold border-slate-300/90"
                        : "border-transparent text-slate-700 font-medium hover:bg-white/70 hover:text-slate-950"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          isActive ? "text-blue-700 font-semibold" : "text-slate-600"
                        }`}
                      >
                        {item.index}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {isActive && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
