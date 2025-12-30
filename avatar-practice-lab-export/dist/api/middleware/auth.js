export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
}
export function requireCoach(req, res, next) {
    if (!req.user || req.user.role !== "coach") {
        return res.status(403).json({ error: "Coach access required" });
    }
    next();
}
export function requireCoachOrLearner(req, res, next) {
    if (!req.user || (req.user.role !== "coach" && req.user.role !== "learner")) {
        return res.status(403).json({ error: "Coach or learner access required" });
    }
    next();
}
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
}
export function requireCurrentUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
}
export const fileUploadMiddleware = null;
