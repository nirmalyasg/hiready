import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Building2, Briefcase, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useValidateShareToken, useClaimShareToken } from '@/hooks/use-entitlements';
import { useAuth } from '@/hooks/useAuth';
import logoImg from '@/assets/logo.png';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [claimed, setClaimed] = useState(false);
  const { user, isLoading: authLoading } = useAuth();

  const { data: shareData, isLoading, error } = useValidateShareToken(token || null);
  const claimMutation = useClaimShareToken();

  const autoClaim = searchParams.get('autoClaim') === 'true';

  useEffect(() => {
    if (autoClaim && user && token && shareData?.valid && !claimed) {
      handleClaimAccess();
    }
  }, [autoClaim, user, token, shareData?.valid, claimed]);

  const handleClaimAccess = async () => {
    if (!token) return;

    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(`/invite/${token}?autoClaim=true`)}`);
      return;
    }

    try {
      const result = await claimMutation.mutateAsync(token);
      setClaimed(true);
      setTimeout(() => {
        // If a job target was created, redirect to that job page
        if (result?.jobTargetId) {
          navigate(`/jobs/${result.jobTargetId}`);
        } else {
          // Fallback to interview page
          navigate(`/interview`);
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to claim access:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ee7e65] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Validating your invite...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invalid or Expired Link</h1>
          <p className="text-white/60 mb-8">
            This invite link is no longer valid. It may have expired or reached its usage limit.
          </p>
          <Link to="/">
            <Button className="bg-[#ee7e65] hover:bg-[#e06d54] text-white">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#ee7e65]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#ee7e65]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Granted!</h1>
          <p className="text-white/60 mb-4">
            You now have access to the {shareData.interviewSet?.name} interview set.
          </p>
          <p className="text-white/40 text-sm">
            Redirecting to practice...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <img src={logoImg} alt="Hiready" className="h-10 mx-auto mb-8 brightness-0 invert" />
          <div className="inline-flex items-center gap-2 bg-[#ee7e65]/20 text-[#ee7e65] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Company Invite
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            You're Invited!
          </h1>
          <p className="text-white/60 text-lg">
            {shareData.companyName} has invited you to practice for your interview.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-12 h-12 bg-[#ee7e65]/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#ee7e65]" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">{shareData.interviewSet?.name}</h2>
              <p className="text-white/50 text-sm">
                {shareData.interviewSet?.description || 'Complete interview preparation'}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
              What's included:
            </h3>
            {(shareData.interviewSet?.interviewTypes as string[] || ['HR', 'Technical', 'Case Study']).map((type: string, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ee7e65]" />
                <span className="text-white/80">{type} Interview Practice</span>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#ee7e65]" />
              <span className="text-white/80">Detailed feedback & scoring</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#ee7e65]" />
              <span className="text-white/80">Personalized improvement tips</span>
            </div>
          </div>

          <div className="bg-[#ee7e65]/10 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ee7e65]/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <div>
              <p className="text-sm text-white/60">Sponsored by</p>
              <p className="font-semibold text-white">{shareData.companyName}</p>
            </div>
          </div>

          <Button 
            onClick={handleClaimAccess}
            disabled={claimMutation.isPending}
            className="w-full bg-[#ee7e65] hover:bg-[#e06d54] h-14 text-base font-semibold group"
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Claiming Access...
              </>
            ) : user ? (
              <>
                Get Free Access
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Sign In to Get Access
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-center text-white/40 text-sm mt-4">
            {user ? "Click above to unlock your free interview practice." : "You'll need to sign in or create a free account to access this content."}
          </p>
        </div>
      </div>
    </div>
  );
}
