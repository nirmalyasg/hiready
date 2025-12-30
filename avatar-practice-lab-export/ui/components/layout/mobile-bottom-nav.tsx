import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PlayCircle, BarChart3, LogOut } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/avatar/dashboard") {
      return location.pathname === "/avatar/dashboard";
    }
    if (path === "/avatar/start") {
      return location.pathname.startsWith("/avatar/practice") || location.pathname === "/avatar/start";
    }
    if (path === "/avatar/results") {
      return location.pathname === "/avatar/results" || location.pathname.includes("/session-analysis");
    }
    return false;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const navItems = [
    { path: "/avatar/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/avatar/start", icon: PlayCircle, label: "Practice" },
    { path: "/avatar/results", icon: BarChart3, label: "Results" },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-40">
      <div className="flex justify-around items-center">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              isActive(path)
                ? "text-brand-primary"
                : "text-slate-500 hover:text-brand-primary"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
