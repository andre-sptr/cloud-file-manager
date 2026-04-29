import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />

      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Icon */}
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-3xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-3xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="w-16 h-16 text-destructive" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-8xl lg:text-9xl font-bold text-destructive">404</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Link to="/">
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-slate-500 pt-8">
          Requested path: <code className="bg-slate-800 px-2 py-1 rounded text-slate-300">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;