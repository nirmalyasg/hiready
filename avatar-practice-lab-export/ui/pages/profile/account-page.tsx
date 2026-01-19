import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Crown, Zap, Briefcase, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import ProfileLayout from './profile-layout';

interface SubscriptionStatus {
  hasPro: boolean;
  hasRolePack: boolean;
  activePlans: Array<{
    planType: string;
    roleKitId?: number | null;
    roleKitName?: string | null;
    expiresAt: string;
  }>;
  freeTrialUsed: boolean;
  sessionsCompleted: number;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);

  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/payments/subscription-status'],
    queryFn: async () => {
      const res = await fetch('/api/payments/subscription-status');
      const data = await res.json();
      return data;
    },
    enabled: isAuthenticated,
  });

  const subscriptionStatus = subscriptionData as SubscriptionStatus | null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleManageSubscription = async () => {
    setIsCreatingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal-session');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error('Portal session error:', data.error);
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    } finally {
      setIsCreatingPortal(false);
    }
  };

  const getCurrentPlanInfo = () => {
    if (!subscriptionStatus) return { name: 'Free', color: 'slate', icon: Zap };
    if (subscriptionStatus.hasPro) return { name: 'Pro', color: 'purple', icon: Crown };
    if (subscriptionStatus.hasRolePack) return { name: 'Role Pack', color: 'teal', icon: Briefcase };
    return { name: 'Free', color: 'slate', icon: Zap };
  };

  const planInfo = getCurrentPlanInfo();

  return (
    <ProfileLayout activeTab="account">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#000000] mb-1">Account & Billing</h2>
          <p className="text-gray-500">Manage your subscription and payment settings</p>
        </div>

        {subscriptionLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#24c4b8]" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-[#24c4b8]" />
                <h3 className="font-semibold text-[#000000]">Current Plan</h3>
              </div>

              <div className={`rounded-xl p-5 border ${
                planInfo.name === 'Pro' ? 'bg-purple-50 border-purple-200' :
                planInfo.name === 'Role Pack' ? 'bg-[#24c4b8]/10 border-[#24c4b8]/30' :
                'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      planInfo.name === 'Pro' ? 'bg-purple-100' :
                      planInfo.name === 'Role Pack' ? 'bg-[#24c4b8]/20' :
                      'bg-slate-100'
                    }`}>
                      <planInfo.icon className={`w-6 h-6 ${
                        planInfo.name === 'Pro' ? 'text-purple-600' :
                        planInfo.name === 'Role Pack' ? 'text-[#24c4b8]' :
                        'text-slate-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-[#000000]">{planInfo.name} Plan</p>
                      <p className="text-sm text-slate-500">
                        {planInfo.name === 'Pro' ? 'Unlimited access to all features' :
                         planInfo.name === 'Role Pack' ? 'Access to purchased role interviews' :
                         'Free tier with limited sessions'}
                      </p>
                    </div>
                  </div>
                  {planInfo.name !== 'Free' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {planInfo.name === 'Free' ? (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#24c4b8] to-[#1db0a5] rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#24c4b8]/25"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Pro
                  </button>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    disabled={isCreatingPortal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#000000] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {isCreatingPortal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Manage Billing
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-[#000000] mb-4">Usage</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-slate-600">Sessions completed</span>
                  <span className="font-bold text-[#000000] text-lg">{subscriptionStatus?.sessionsCompleted || 0}</span>
                </div>
                {!subscriptionStatus?.hasPro && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-slate-600">Free trial</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      subscriptionStatus?.freeTrialUsed 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {subscriptionStatus?.freeTrialUsed ? 'Used' : 'Available'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Subscriptions */}
            {subscriptionStatus?.activePlans && subscriptionStatus.activePlans.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#000000] mb-4">Active Subscriptions</h3>
                <div className="space-y-3">
                  {subscriptionStatus.activePlans.map((plan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div>
                        <span className="font-medium text-emerald-800">
                          {plan.planType === 'pro' ? 'Pro Plan' : plan.roleKitName || 'Role Pack'}
                        </span>
                      </div>
                      <span className="text-sm text-emerald-600">
                        Expires {formatDate(plan.expiresAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
