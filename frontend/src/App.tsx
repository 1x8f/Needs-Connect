import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Needs from "./pages/Needs";
import Basket from "./pages/Basket";
import Dashboard from "./pages/Dashboard";
import AddNeed from "./pages/AddNeed";
import EditNeed from "./pages/EditNeed";
import Events from "./pages/Events";
import HelperActivity from "./pages/HelperActivity";
import Volunteer from "./pages/Volunteer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/needs" element={<Needs />} />
                  <Route path="/basket" element={<Basket />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/add-need" element={<AddNeed />} />
                  <Route path="/edit-need/:id" element={<EditNeed />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/helper-activity" element={<HelperActivity />} />
                  <Route path="/volunteer" element={<Volunteer />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
