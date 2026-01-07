import { Link, useLocation } from "react-router-dom";
import { Home, Target, BarChart3, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/avatar/dashboard", icon: Home, label: "Dashboard" },
  { path: "/interview", icon: Target, label: "Practice" },
  { path: "/avatar/results", icon: BarChart3, label: "Results" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    const pathname = location.pathname;
    
    if (path === "/avatar/dashboard") {
      return pathname === "/avatar/dashboard";
    }
    if (path === "/interview") {
      // Practice includes /interview but NOT /interview/results (that's Results)
      return (pathname.startsWith("/interview") && !pathname.includes("/results")) ||
             pathname.startsWith("/exercise-mode");
    }
    if (path === "/avatar/results") {
      return pathname.startsWith("/avatar/results") || 
             pathname.includes("/session-analysis") ||
             pathname.includes("/results");
    }
    if (path === "/jobs") {
      return pathname.startsWith("/jobs");
    }
    return false;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-50 pb-safe">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 transition-all duration-200 active:scale-95",
                active 
                  ? "text-[#ee7e65]" 
                  : "text-slate-400"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                active && "bg-[#ee7e65]/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold",
                active ? "text-[#ee7e65]" : "text-slate-500"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
