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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-3 z-40 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
              isActive(path)
                ? "text-white bg-brand-dark shadow-md"
                : "text-brand-muted hover:text-brand-dark hover:bg-gray-50"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-brand-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wide">Logout</span>
        </button>
      </div>
    </nav>
  );
}
