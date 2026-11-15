import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const SharedFile = lazy(() => import("./pages/SharedFile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-3 app-page-canvas" role="status">
    <div
      className="app-spinner w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full"
      aria-hidden="true"
    />
    <p className="text-sm font-medium text-slate-600">Loading page...</p>
  </main>
);

const App = () => (
  <>
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/f/:id" element={<SharedFile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </>
);

export default App;
