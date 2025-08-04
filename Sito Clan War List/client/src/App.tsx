import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Componenti pagine
import Navigation from "@/components/navigation";
import Home from "@/pages/home";
import Registration from "@/pages/registration";
import Admin from "@/pages/admin";

function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderCurrentTab = () => {
    switch (activeTab) {
      case "home":
        return <Home onTabChange={setActiveTab} />;
      case "register":
        return <Registration />;
      case "admin":
        return <Admin />;
      default:
        return <Home onTabChange={setActiveTab} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Navigazione */}
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Contenuto principale */}
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {renderCurrentTab()}
          </main>
          
          {/* Footer */}
          <footer className="bg-gray-900 text-white mt-16">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl mr-3">🛡️</span>
                  <span className="text-lg font-semibold">CWL Manager</span>
                </div>
                <div className="text-sm text-gray-400">
                  Sistema di gestione Clan War League - Clash of Clans
                </div>
              </div>
            </div>
          </footer>
        </div>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
