import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, ChevronRight, Settings, HelpCircle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SidebarLayout from '@/components/layout/sidebar-layout';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: Settings, label: 'Settings', onClick: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
    { icon: Shield, label: 'Privacy', onClick: () => {} },
  ];

  return (
    <SidebarLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-brand-dark mb-6 lg:mb-8">Profile</h1>
        
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.firstName || 'User'}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center">
                <User className="w-8 h-8 text-brand-accent" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-brand-dark truncate">
                {user.firstName || user.username || 'User'}
              </h2>
              {user.email && (
                <p className="text-sm text-brand-muted flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-muted" />
                </div>
                <span className="flex-1 text-left font-medium text-brand-dark">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="flex-1 text-left font-medium text-red-500">Sign Out</span>
        </button>
      </div>
    </SidebarLayout>
  );
}
