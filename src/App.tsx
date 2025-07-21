
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    console.log("App component mounted");
    console.log("CSS loaded:", !!document.querySelector('style, link[rel="stylesheet"]'));
    console.log("Body background color:", window.getComputedStyle(document.body).backgroundColor);
    console.log("HTML classes:", document.documentElement.className);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Debug banner */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: 'red',
            color: 'white',
            padding: '5px 10px',
            zIndex: 9999,
            fontSize: '12px'
          }}>
            APP LOADED - If you see this, React is working
          </div>
          
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
