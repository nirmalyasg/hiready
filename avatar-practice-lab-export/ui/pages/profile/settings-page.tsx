import { useState } from 'react';
import { Bell, Globe, Moon, Volume2, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileLayout from './profile-layout';

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Receive practice reminders and updates',
          type: 'toggle' as const,
          value: notifications,
          onChange: setNotifications,
        },
        {
          icon: Volume2,
          label: 'Sound Effects',
          description: 'Play sounds during practice sessions',
          type: 'toggle' as const,
          value: soundEffects,
          onChange: setSoundEffects,
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Use dark theme throughout the app',
          type: 'toggle' as const,
          value: darkMode,
          onChange: setDarkMode,
        },
      ],
    },
    {
      title: 'Language & Region',
      items: [
        {
          icon: Globe,
          label: 'Language',
          description: 'English (US)',
          type: 'link' as const,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: Shield,
          label: 'Privacy Settings',
          description: 'Manage your data and privacy preferences',
          type: 'link' as const,
        },
      ],
    },
  ];

  return (
    <ProfileLayout activeTab="settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#000000] mb-1">Settings</h2>
          <p className="text-gray-500">Customize your experience</p>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-600 uppercase tracking-wide">{section.title}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#000000]">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      {item.type === 'toggle' && (
                        <button
                          onClick={() => item.onChange(!item.value)}
                          className={`relative w-12 h-7 rounded-full transition-colors ${
                            item.value ? 'bg-[#ee7e65]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              item.value ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      )}
                      {item.type === 'link' && (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-[#000000] mb-3">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-gray-500">Username</span>
              <span className="font-medium text-[#000000]">{user?.username || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#000000]">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Account ID</span>
              <span className="font-medium text-[#000000]">
                {user?.id ? `#${user.id}` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
