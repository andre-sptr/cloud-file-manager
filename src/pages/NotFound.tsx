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
    <main className="min-h-screen flex items-center justify-center app-page-canvas p-4">
      <div className="text-center space-y-8">
        <div className="inline-flex">
          <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center border border-red-200">
            <AlertTriangle className="w-12 h-12 text-red-600" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-slate-900">404</h1>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Page Not Found
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button
            asChild
            size="lg"
            className="min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
          >
            <Link to="/">
              <Home aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="min-h-[44px] border-slate-500 bg-white text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft aria-hidden="true" />
            Go Back
          </Button>
        </div>

        <p className="text-sm text-slate-600 pt-2">
          Requested path: <code className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-800">{location.pathname}</code>
        </p>
      </div>
    </main>
  );
};

export default NotFound;