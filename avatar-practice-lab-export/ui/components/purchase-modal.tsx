import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Zap, Loader2 } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTargetId?: string;
  roleKitId?: number;
  roleName?: string;
  onSuccess?: () => void;
}

type PlanType = "role_pack" | "pro_monthly" | "pro_yearly";

const PLANS = {
  role_pack: {
    name: "Role Pack",
    price: 199,
    period: "one-time",
    description: "Unlimited interviews for this role",
    icon: Zap,
    features: [
      "Unlimited mock interviews",
      "All interview types (Technical, HR, Behavioral)",
      "Detailed feedback & scoring",
      "Hiready Index Score",
      "Shareable scorecard",
    ],
    popular: false,
  },
  pro_monthly: {
    name: "Pro Monthly",
    price: 499,
    period: "/month",
    description: "Unlimited access to everything",
    icon: Sparkles,
    features: [
      "Everything in Role Pack",
      "Unlimited role switching",
      "System Design interviews",
      "Panel interviews",
      "Priority support",
    ],
    popular: true,
  },
  pro_yearly: {
    name: "Pro Yearly",
    price: 3999,
    period: "/year",
    description: "Best value - save 33%",
    icon: Crown,
    features: [
      "Everything in Pro Monthly",
      "33% savings (₹1,989 saved)",
      "Early access to new features",
      "Premium support",
    ],
    popular: false,
  },
};

export function PurchaseModal({
  isOpen,
  onClose,
  jobTargetId,
  roleKitId,
  roleName,
  onSuccess,
}: PurchaseModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("role_pack");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planType: selectedPlan,
          jobTargetId,
          roleKitId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      if (data.testMode) {
        const verifyResponse = await fetch("/api/payments/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            testMode: true,
            localPaymentId: data.paymentId,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          onSuccess?.();
          onClose();
        } else {
          throw new Error(verifyData.error || "Payment verification failed");
        }
        return;
      }

      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Hiready",
        description: PLANS[selectedPlan].description,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onSuccess?.();
              onClose();
            } else {
              setError(verifyData.error || "Payment verification failed");
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
          }
        },
        prefill: {},
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Unlock More Practice
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {roleName
              ? `Continue practicing for ${roleName}`
              : "Choose a plan to continue your interview preparation"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
            const plan = PLANS[planKey];
            const Icon = plan.icon;
            const isSelected = selectedPlan === planKey;

            return (
              <button
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                className={`relative p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 right-4 bg-slate-900 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? "bg-slate-200" : "bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected ? "text-slate-700" : "text-slate-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-medium text-slate-900">
                        {plan.name}
                      </h3>
                      <span className="text-xl font-semibold text-slate-900">
                        ₹{plan.price}
                      </span>
                      <span className="text-sm text-slate-500">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {plan.description}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-slate-500 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Maybe Later
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Unlock for ₹{PLANS[selectedPlan].price}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-slate-400 mt-2">
          Secure payment powered by Razorpay. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
