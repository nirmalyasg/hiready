import { Router } from "express";
import { db } from "../db.js";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { subscriptions, payments, interviewSessions, interviewConfigs, } from "../../shared/schema.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";
const paymentsRouter = Router();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const PRICING = {
    role_pack: 19900,
    pro_monthly: 49900,
    pro_yearly: 399900,
};
async function createRazorpayOrder(amount, currency = "INR", receipt) {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
        },
        body: JSON.stringify({
            amount,
            currency,
            receipt,
            notes: {},
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Razorpay order creation failed: ${error}`);
    }
    return response.json();
}
function verifyRazorpaySignature(orderId, paymentId, signature) {
    const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return expectedSignature === signature;
}
paymentsRouter.get("/subscription", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { roleKitId, jobTargetId } = req.query;
        const [activeSubscription] = await db
            .select()
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"), roleKitId ? eq(subscriptions.roleKitId, parseInt(roleKitId)) : undefined, jobTargetId ? eq(subscriptions.jobTargetId, jobTargetId) : undefined))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);
        if (activeSubscription) {
            const isProUser = activeSubscription.planType === "pro" || activeSubscription.planType?.startsWith("pro");
            return res.json({
                success: true,
                subscription: activeSubscription,
                hasAccess: true,
                isPro: isProUser,
                unlockedInterviewTypes: isProUser
                    ? ["technical", "coding", "hr", "behavioral", "case_study", "system_design", "panel"]
                    : activeSubscription.unlockedInterviewTypes || [],
            });
        }
        res.json({
            success: true,
            subscription: null,
            hasAccess: false,
            isPro: false,
            unlockedInterviewTypes: [],
        });
    }
    catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
paymentsRouter.get("/free-trial-status", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { roleKitId, jobTargetId } = req.query;
        const completedSessions = await db
            .select({ count: sql `count(*)` })
            .from(interviewSessions)
            .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
            .where(and(eq(interviewConfigs.userId, userId), eq(interviewSessions.status, "analyzed"), roleKitId ? eq(interviewConfigs.roleKitId, parseInt(roleKitId)) : undefined, jobTargetId ? eq(interviewConfigs.jobTargetId, jobTargetId) : undefined));
        const sessionCount = Number(completedSessions[0]?.count || 0);
        const freeTrialUsed = sessionCount >= 1;
        res.json({
            success: true,
            freeTrialUsed,
            sessionsCompleted: sessionCount,
            freeTrialLimit: 1,
        });
    }
    catch (error) {
        console.error("Error checking free trial status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
paymentsRouter.get("/subscription-status", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const userSubscriptions = await db
            .select()
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
            .orderBy(desc(subscriptions.createdAt));
        const proSubscription = userSubscriptions.find((s) => s.planType === "pro");
        const rolePacks = userSubscriptions.filter((s) => s.planType === "role_pack" && s.roleKitId);
        res.json({
            success: true,
            hasPro: !!proSubscription,
            planType: proSubscription?.planType || null,
            proExpiresAt: proSubscription?.currentPeriodEnd || null,
            rolePacks: rolePacks.map((rp) => ({
                roleKitId: rp.roleKitId,
                jobTargetId: rp.jobTargetId,
                createdAt: rp.createdAt,
            })),
        });
    }
    catch (error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
paymentsRouter.post("/create-order", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { planType, roleKitId, jobTargetId } = req.body;
        if (!planType || !["role_pack", "pro_monthly", "pro_yearly"].includes(planType)) {
            return res.status(400).json({ success: false, error: "Invalid plan type" });
        }
        const amount = PRICING[planType];
        const receipt = `rcpt_${userId.slice(0, 8)}_${Date.now()}`;
        if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
            const [payment] = await db.insert(payments).values({
                userId,
                amount,
                currency: "INR",
                provider: "razorpay",
                status: "created",
                meta: { planType, roleKitId, jobTargetId },
            }).returning();
            return res.json({
                success: true,
                testMode: true,
                paymentId: payment.id,
                amount,
                currency: "INR",
                planType,
            });
        }
        const order = await createRazorpayOrder(amount, "INR", receipt);
        const [payment] = await db.insert(payments).values({
            userId,
            amount,
            currency: "INR",
            provider: "razorpay",
            providerRef: order.id,
            status: "created",
            meta: { planType, roleKitId, jobTargetId, orderId: order.id },
        }).returning();
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: RAZORPAY_KEY_ID,
            paymentId: payment.id,
        });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
paymentsRouter.post("/verify-payment", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { orderId, paymentId, signature, localPaymentId, testMode } = req.body;
        if (testMode && localPaymentId) {
            const [payment] = await db
                .select()
                .from(payments)
                .where(eq(payments.id, localPaymentId))
                .limit(1);
            if (!payment || payment.userId !== userId) {
                return res.status(404).json({ success: false, error: "Payment not found" });
            }
            const meta = payment.meta;
            const planType = meta?.planType || "role_pack";
            const roleKitId = meta?.roleKitId;
            const jobTargetId = meta?.jobTargetId;
            await db
                .update(payments)
                .set({
                status: "captured",
                updatedAt: new Date(),
            })
                .where(eq(payments.id, localPaymentId));
            const expiresAt = planType === "pro_yearly"
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                : planType === "pro_monthly"
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            const unlockedTypes = planType.startsWith("pro")
                ? ["technical", "coding", "hr", "behavioral", "case_study", "system_design", "panel"]
                : ["technical", "coding", "hr", "behavioral"];
            const [subscription] = await db.insert(subscriptions).values({
                userId,
                planType: planType.startsWith("pro") ? "pro" : "role_pack",
                status: "active",
                roleKitId: roleKitId || null,
                jobTargetId: jobTargetId || null,
                roleContext: roleKitId ? { roleKitId } : jobTargetId ? { jobTargetId } : undefined,
                unlockedInterviewTypes: unlockedTypes,
                expiresAt,
            }).returning();
            await db
                .update(payments)
                .set({ subscriptionId: subscription.id })
                .where(eq(payments.id, localPaymentId));
            return res.json({
                success: true,
                subscription,
                message: "Test payment verified successfully",
            });
        }
        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({ success: false, error: "Missing payment details" });
        }
        const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
        if (!isValid) {
            return res.status(400).json({ success: false, error: "Invalid payment signature" });
        }
        const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.providerRef, orderId))
            .limit(1);
        if (!payment || payment.userId !== userId) {
            return res.status(404).json({ success: false, error: "Payment not found" });
        }
        await db
            .update(payments)
            .set({
            status: "captured",
            meta: { ...payment.meta, paymentId },
            updatedAt: new Date(),
        })
            .where(eq(payments.id, payment.id));
        const meta = payment.meta;
        const planType = meta?.planType || "role_pack";
        const roleKitId = meta?.roleKitId;
        const jobTargetId = meta?.jobTargetId;
        const expiresAt = planType === "pro_yearly"
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : planType === "pro_monthly"
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const unlockedTypes = planType.startsWith("pro")
            ? ["technical", "coding", "hr", "behavioral", "case_study", "system_design", "panel"]
            : ["technical", "coding", "hr", "behavioral"];
        const [subscription] = await db.insert(subscriptions).values({
            userId,
            planType: planType.startsWith("pro") ? "pro" : "role_pack",
            status: "active",
            roleKitId: roleKitId || null,
            jobTargetId: jobTargetId || null,
            roleContext: roleKitId ? { roleKitId } : jobTargetId ? { jobTargetId } : undefined,
            unlockedInterviewTypes: unlockedTypes,
            expiresAt,
        }).returning();
        await db
            .update(payments)
            .set({ subscriptionId: subscription.id })
            .where(eq(payments.id, payment.id));
        res.json({
            success: true,
            subscription,
            message: "Payment verified successfully",
        });
    }
    catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Comprehensive entitlements check - consolidates all access logic
paymentsRouter.get("/entitlements", requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        const { jobTargetId, roleKitId, employerJobId } = req.query;
        // 1. Check for employer assessment flow - always free for candidates
        if (employerJobId) {
            return res.json({
                success: true,
                hasAccess: true,
                accessType: "employer_assessment",
                reason: "Employer-sponsored assessment - no payment required",
                canStartSession: true,
                freeTrialUsed: false,
                subscription: null,
                pricing: null,
            });
        }
        // 2. Check for active Pro subscription (unlimited access)
        const [proSubscription] = await db
            .select()
            .from(subscriptions)
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.planType, "pro"), eq(subscriptions.status, "active"), gte(subscriptions.expiresAt, new Date())))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);
        if (proSubscription) {
            return res.json({
                success: true,
                hasAccess: true,
                accessType: "pro_subscription",
                reason: "Active Pro subscription",
                canStartSession: true,
                freeTrialUsed: true,
                subscription: proSubscription,
                pricing: null,
            });
        }
        // 3. Check for role-specific subscription (role pack)
        const rolePackConditions = [
            eq(subscriptions.userId, userId),
            eq(subscriptions.planType, "role_pack"),
            eq(subscriptions.status, "active"),
        ];
        if (jobTargetId) {
            rolePackConditions.push(eq(subscriptions.jobTargetId, jobTargetId));
        }
        if (roleKitId) {
            rolePackConditions.push(eq(subscriptions.roleKitId, parseInt(roleKitId)));
        }
        const [rolePackSubscription] = await db
            .select()
            .from(subscriptions)
            .where(and(...rolePackConditions))
            .orderBy(desc(subscriptions.createdAt))
            .limit(1);
        if (rolePackSubscription) {
            return res.json({
                success: true,
                hasAccess: true,
                accessType: "role_pack",
                reason: "Active role pack for this job/role",
                canStartSession: true,
                freeTrialUsed: true,
                subscription: rolePackSubscription,
                pricing: null,
            });
        }
        // 4. Check free trial status (1 free interview per job/role)
        const sessionConditions = [
            eq(interviewConfigs.userId, userId),
        ];
        if (jobTargetId) {
            sessionConditions.push(eq(interviewConfigs.jobTargetId, jobTargetId));
        }
        if (roleKitId) {
            sessionConditions.push(eq(interviewConfigs.roleKitId, parseInt(roleKitId)));
        }
        const completedSessions = await db
            .select({ count: sql `count(*)` })
            .from(interviewSessions)
            .innerJoin(interviewConfigs, eq(interviewSessions.interviewConfigId, interviewConfigs.id))
            .where(and(...sessionConditions, eq(interviewSessions.status, "analyzed")));
        const sessionCount = Number(completedSessions[0]?.count || 0);
        const freeTrialUsed = sessionCount >= 1;
        if (!freeTrialUsed) {
            return res.json({
                success: true,
                hasAccess: true,
                accessType: "free_trial",
                reason: "Free trial - first interview is free",
                canStartSession: true,
                freeTrialUsed: false,
                sessionsCompleted: sessionCount,
                subscription: null,
                pricing: null,
            });
        }
        // 5. No access - show pricing
        return res.json({
            success: true,
            hasAccess: false,
            accessType: "none",
            reason: "Free trial used - purchase required",
            canStartSession: false,
            freeTrialUsed: true,
            sessionsCompleted: sessionCount,
            subscription: null,
            pricing: {
                role_pack: {
                    price: 199,
                    currency: "INR",
                    name: "Role Pack",
                    description: "Unlimited interviews for this role",
                },
                pro_monthly: {
                    price: 499,
                    currency: "INR",
                    name: "Pro Monthly",
                    description: "Unlimited access to all roles",
                },
                pro_yearly: {
                    price: 3999,
                    currency: "INR",
                    name: "Pro Yearly",
                    description: "Best value - save 33%",
                },
            },
        });
    }
    catch (error) {
        console.error("Error checking entitlements:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
paymentsRouter.get("/pricing", async (req, res) => {
    res.json({
        success: true,
        pricing: {
            role_pack: {
                price: 199,
                currency: "INR",
                name: "Role Pack",
                description: "Unlock all interview types for one role",
                features: [
                    "Technical Interview",
                    "Coding Interview",
                    "HR/Behavioral Interview",
                    "Case Study Interview",
                    "Hiready Index Score",
                    "Shareable Scorecard",
                ],
            },
            pro_monthly: {
                price: 499,
                currency: "INR",
                name: "Pro Monthly",
                description: "Unlimited access to all roles and features",
                features: [
                    "Everything in Role Pack",
                    "Unlimited role switching",
                    "System Design Interview",
                    "Panel Interview",
                    "Priority support",
                ],
            },
            pro_yearly: {
                price: 3999,
                currency: "INR",
                name: "Pro Yearly",
                description: "Best value - save 33%",
                features: [
                    "Everything in Pro Monthly",
                    "33% savings",
                    "Early access to new features",
                ],
            },
        },
    });
});
export default paymentsRouter;
