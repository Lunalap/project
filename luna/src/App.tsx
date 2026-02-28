import { Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { APP_ROUTES } from "@/routes";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "./components/theme-provider";
import { Skeleton } from "./components/ui/skeleton";

function App() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (activeMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [activeMenu]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <div className="relative min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 transition-colors duration-300">
          <Header activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          <div 
            className={cn(
              "fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300",
              activeMenu ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setActiveMenu(null)}
          />
          <div className="pt-20">
            <Suspense fallback={<Skeleton />}>
              <main className="pt-20 flex-1">
                <Routes>
                  {APP_ROUTES.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Routes>
              </main>
            </Suspense>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;