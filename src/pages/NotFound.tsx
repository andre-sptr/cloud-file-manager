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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-4">
      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative inline-flex">
          <div className="relative w-28 h-28 rounded-3xl bg-red-50 flex items-center justify-center border border-red-200">
            <AlertTriangle className="w-14 h-14 text-red-600" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl lg:text-8xl font-bold text-slate-900">404</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            asChild
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
            className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        <p className="text-sm text-slate-500 pt-4">
          Requested path: <code className="bg-slate-100 px-2 py-1 rounded text-slate-700">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;