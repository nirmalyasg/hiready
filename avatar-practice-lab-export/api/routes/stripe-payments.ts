import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { 
  interviewSets,
  interviewSetPurchases,
  paymentSubscriptions,
  userEntitlements
} from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import {
  recordPurchase,
  createSubscription,
  cancelSubscription,
  getOrCreateEntitlement
} from "../lib/entitlement-service.js";

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const PRICES = {
  interviewSet: 19900,
  subscription: 49900
};

async function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }
  const Stripe = (await import("stripe")).default;
  return new Stripe(STRIPE_SECRET_KEY);
}

router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { priceType, interviewSetId } = req.body;

    if (!STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Payment system not configured" });
    }

    const stripe = await getStripe();

    let sessionConfig: any = {
      payment_method_types: ["card"],
      success_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/pricing`,
      metadata: {
        userId: userId.toString(),
        priceType
      }
    };

    if (priceType === "subscription") {
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Hiready Unlimited",
            description: "Unlimited interview practice - all roles, all companies"
          },
          unit_amount: PRICES.subscription,
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      }];
    } else if (priceType === "interview_set") {
      if (!interviewSetId) {
        return res.status(400).json({ error: "Interview set ID required" });
      }

      const interviewSet = await db.query.interviewSets.findFirst({
        where: eq(interviewSets.id, interviewSetId)
      });

      if (!interviewSet) {
        return res.status(404).json({ error: "Interview set not found" });
      }

      sessionConfig.mode = "payment";
      sessionConfig.metadata.interviewSetId = interviewSetId.toString();
      sessionConfig.line_items = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: interviewSet.name,
            description: interviewSet.description || "Interview preparation set"
          },
          unit_amount: interviewSet.priceCents || PRICES.interviewSet
        },
        quantity: 1
      }];
    } else {
      return res.status(400).json({ error: "Invalid price type" });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: "Stripe not configured" });
    }

    const stripe = await getStripe();
    const sig = req.headers["stripe-signature"] as string;

    let event;
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = parseInt(session.metadata?.userId);
        const priceType = session.metadata?.priceType;

        if (!userId || isNaN(userId)) {
          console.error("Invalid userId in session metadata:", session.metadata);
          break;
        }

        if (priceType === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          if (!subscriptionId || !customerId) {
            console.error("Missing subscription or customer ID");
            break;
          }

          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodStart = (stripeSubscription as any).current_period_start;
          const periodEnd = (stripeSubscription as any).current_period_end;
          
          await createSubscription(
            userId,
            subscriptionId,
            customerId,
            new Date(periodStart * 1000),
            new Date(periodEnd * 1000)
          );
          
          console.log(`Subscription created for user ${userId}: ${subscriptionId}`);
        } else if (priceType === "interview_set") {
          const interviewSetId = parseInt(session.metadata?.interviewSetId);
          const paymentIntentId = session.payment_intent as string;

          if (!interviewSetId || isNaN(interviewSetId)) {
            console.error("Invalid interviewSetId in session metadata");
            break;
          }

          await recordPurchase(userId, interviewSetId, paymentIntentId, session.amount_total || 19900);
          console.log(`Interview set ${interviewSetId} purchased by user ${userId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        
        await db.update(paymentSubscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            updatedAt: new Date()
          })
          .where(eq(paymentSubscriptions.stripeSubscriptionId, subscription.id));
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        
        const [existingSub] = await db
          .select()
          .from(paymentSubscriptions)
          .where(eq(paymentSubscriptions.stripeSubscriptionId, subscription.id))
          .limit(1);

        if (existingSub) {
          await cancelSubscription(existingSub.userId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        await db.update(paymentSubscriptions)
          .set({
            status: "past_due",
            updatedAt: new Date()
          })
          .where(eq(paymentSubscriptions.stripeSubscriptionId, subscriptionId));
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Payment system not configured" });
    }

    const stripe = await getStripe();

    const subscription = await db.query.paymentSubscriptions.findFirst({
      where: and(
        eq(paymentSubscriptions.userId, userId),
        eq(paymentSubscriptions.status, "active")
      )
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    await cancelSubscription(userId);

    res.json({ success: true, message: "Subscription cancelled" });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ error: error.message || "Failed to cancel subscription" });
  }
});

router.get("/portal-session", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: "Payment system not configured" });
    }

    const stripe = await getStripe();

    const subscription = await db.query.paymentSubscriptions.findFirst({
      where: eq(paymentSubscriptions.userId, userId)
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return res.status(404).json({ error: "No subscription found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/account`
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
});

export default router;
