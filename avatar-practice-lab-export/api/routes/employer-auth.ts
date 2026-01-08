import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { eq } from "drizzle-orm";
import { employerUsers, employerCompanies } from "../../shared/schema.js";
import bcrypt from "bcrypt";

const employerAuthRouter = Router();

employerAuthRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Username and password required" });
    }

    const [user] = await db
      .select()
      .from(employerUsers)
      .where(eq(employerUsers.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    let company: { id: string; name: string; domain: string | null; logoUrl: string | null } | null = null;
    if (user.companyId) {
      const [companyData] = await db
        .select({
          id: employerCompanies.id,
          name: employerCompanies.name,
          domain: employerCompanies.domain,
          logoUrl: employerCompanies.logoUrl,
        })
        .from(employerCompanies)
        .where(eq(employerCompanies.id, user.companyId))
        .limit(1);
      company = companyData || null;
    }

    (req.session as any).employerUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      role: user.role,
      company,
    };

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        role: user.role,
        company,
      },
    });
  } catch (error: any) {
    console.error("Employer login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

employerAuthRouter.post("/logout", (req: Request, res: Response) => {
  (req.session as any).employerUser = null;
  res.json({ success: true });
});

employerAuthRouter.get("/session", (req: Request, res: Response) => {
  const employerUser = (req.session as any)?.employerUser;
  if (employerUser) {
    res.json({ success: true, user: employerUser });
  } else {
    res.status(401).json({ success: false, error: "Not authenticated" });
  }
});

export function requireEmployerAuth(req: Request, res: Response, next: Function) {
  const employerUser = (req.session as any)?.employerUser;
  if (!employerUser) {
    return res.status(401).json({ success: false, error: "Employer authentication required" });
  }
  (req as any).employerUser = employerUser;
  next();
}

export default employerAuthRouter;
