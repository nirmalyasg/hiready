import { Link, useLocation } from "react-router-dom";
import { Home, Target, BarChart3, Briefcase, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/avatar/dashboard", icon: Home, label: "Home" },
  { path: "/interview", icon: Target, label: "Practice" },
  { path: "/hiready-index", icon: Award, label: "Score" },
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
    if (path === "/hiready-index") {
      return pathname.startsWith("/hiready-index");
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
                  ? "text-[#000000]" 
                  : "text-gray-400"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                active && "bg-[#24c4b8]/10"
              )}>
                <Icon className={cn("w-5 h-5", active && "text-[#24c4b8]")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active ? "text-[#000000]" : "text-gray-500"
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
