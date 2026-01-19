import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, CreditCard, LogOut, Loader2, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SidebarLayout from '@/components/layout/sidebar-layout';

interface ProfileLayoutProps {
  children: ReactNode;
  activeTab: 'profile' | 'settings' | 'account';
}

export default function ProfileLayout({ children, activeTab }: ProfileLayoutProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User, path: '/profile' },
    { id: 'settings' as const, label: 'Settings', icon: Settings, path: '/profile/settings' },
    { id: 'account' as const, label: 'Account', icon: CreditCard, path: '/profile/account' },
  ];

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#24c4b8]" />
        </div>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] text-white">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.firstName || 'User'}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#24c4b8] to-[#1db0a5] flex items-center justify-center ring-4 ring-white/20">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#24c4b8] rounded-full flex items-center justify-center border-2 border-[#000000]">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {user.firstName || user.username || 'User'}
                </h1>
                {user.email && (
                  <p className="text-white/70 flex items-center gap-1.5 text-sm mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-[#24c4b8] text-[#24c4b8]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors shadow-sm border border-slate-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="flex-1 text-left font-semibold text-red-500">Sign Out</span>
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
