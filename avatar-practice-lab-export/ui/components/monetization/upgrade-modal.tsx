import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Zap, Package, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  interviewSetId?: number;
  interviewSetName?: string;
}

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  title = "Unlock More Interviews",
  description = "You've used your free interview. Upgrade to continue practicing.",
  interviewSetId,
  interviewSetName
}: UpgradeModalProps) {
  const navigate = useNavigate();

  const handlePurchaseSet = async () => {
    if (!interviewSetId) {
      navigate('/pricing');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType: 'interview_set',
          interviewSetId
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceType: 'subscription'
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#cb6ce6] to-[#24c4b8] rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-[#000000]">{title}</DialogTitle>
          <DialogDescription className="text-gray-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          <div className="border-2 border-[#24c4b8] rounded-2xl p-6 bg-[#24c4b8]/5 relative">
            <div className="absolute -top-3 left-4 bg-[#24c4b8] text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST FOR THIS ROLE
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-[#24c4b8]" />
                  <h3 className="font-bold text-lg text-[#000000]">Interview Set</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {interviewSetName || 'Complete interview preparation package'}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#24c4b8]" />
                    <span>All interview rounds (HR, Technical, Case)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#24c4b8]" />
                    <span>Detailed feedback & scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#24c4b8]" />
                    <span>Lifetime access to this set</span>
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#000000]">₹199</div>
                <div className="text-sm text-gray-500">one-time</div>
              </div>
            </div>
            <Button 
              onClick={handlePurchaseSet}
              className="w-full mt-4 bg-[#24c4b8] hover:bg-[#1db0a5] h-12 font-semibold group"
            >
              Buy This Set
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="border-2 border-[#cb6ce6]/30 rounded-2xl p-6 hover:border-[#cb6ce6] transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-[#cb6ce6]" />
                  <h3 className="font-bold text-lg text-[#000000]">Unlimited</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Unlimited access to everything
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#cb6ce6]" />
                    <span>Unlimited interviews for all roles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#cb6ce6]" />
                    <span>All companies & interview types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#cb6ce6]" />
                    <span>Advanced analytics & progress tracking</span>
                  </li>
                </ul>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#000000]">₹499</div>
                <div className="text-sm text-gray-500">/month</div>
              </div>
            </div>
            <Button 
              onClick={handleSubscribe}
              variant="outline"
              className="w-full mt-4 border-2 border-[#cb6ce6] text-[#cb6ce6] hover:bg-[#cb6ce6] hover:text-white h-12 font-semibold group"
            >
              Subscribe Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-4">
          Secure payment powered by Stripe
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeModal;
