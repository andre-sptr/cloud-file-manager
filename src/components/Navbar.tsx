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
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/90">
      <nav aria-label="Primary" className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-16 py-2">
          <Link to="/" className="inline-flex items-center gap-2.5 min-h-[44px] hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
              <Cloud className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-slate-800">VPS File Hub</span>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="min-h-[44px] gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  </div>
                  <span className="hidden sm:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 text-slate-700">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem onClick={handleLogout} className="focus:bg-slate-100 focus:text-slate-900 cursor-pointer min-h-[44px]">
                  <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/auth")} className="min-h-[44px] px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white">
              Login
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};
