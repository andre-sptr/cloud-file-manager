import { Cloud, LogOut, User as UserIcon } from "lucide-react";
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

export const Navbar = ({ user }: NavbarProps) => {
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-slate-200/80">
      <nav aria-label="Primary" className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between min-h-16 py-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 min-h-[44px] hover:opacity-80 transition-opacity"
          >
            <span className="w-7 h-7 rounded-md border border-slate-300/90 bg-white flex items-center justify-center">
              <Cloud className="w-4 h-4 text-blue-600" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-slate-950">
              VPS File Hub
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-7">
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("features");
                }}
                className="inline-flex items-center min-h-[44px] text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors"
              >
                Features
              </a>
              <a
                href="#dashboard"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("dashboard");
                }}
                className="inline-flex items-center min-h-[44px] text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors"
              >
                Workspace
              </a>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="min-h-[44px] gap-2 px-2.5 text-slate-800 hover:text-slate-950 hover:bg-slate-100/80"
                  >
                    <span className="w-7 h-7 rounded-full border border-slate-300 bg-white flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                    </span>
                    <span className="hidden sm:inline max-w-[200px] truncate text-sm font-medium">
                      {user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white border-slate-200 text-slate-700"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-200" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="min-h-[44px] px-5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-none"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
