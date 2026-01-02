import { Link, useLocation } from "react-router-dom";
import { Home, Target, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/avatar/dashboard", icon: Home, label: "Home" },
  { path: "/avatar/start", icon: Target, label: "Practice" },
  { path: "/avatar/results", icon: BarChart3, label: "Results" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/avatar/dashboard") {
      return location.pathname === "/avatar/dashboard";
    }
    if (path === "/avatar/start") {
      return location.pathname === "/avatar/start" ||
             location.pathname.startsWith("/avatar/practice") || 
             location.pathname.startsWith("/interview") ||
             location.pathname.startsWith("/exercise-mode");
    }
    if (path === "/avatar/results") {
      return location.pathname === "/avatar/results" || 
             location.pathname.includes("/session-analysis");
    }
    if (path === "/profile") {
      return location.pathname === "/profile";
    }
    return false;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 z-50 pb-safe">
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
                  ? "text-brand-accent" 
                  : "text-gray-400"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                active && "bg-brand-accent/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold",
                active ? "text-brand-accent" : "text-gray-500"
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
