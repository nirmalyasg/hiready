import bcrypt from "bcrypt";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { getUserByUsername, getUserByEmail, createUser, getUserById } from "./storage.js";
import { db } from "./db.js";
import { userLoginEvents } from "../shared/schema.js";
import { getUserRole } from "./middleware/auth.js";

async function trackLoginEvent(
  authUserId: string,
  eventType: "login" | "logout" | "session_start" | "session_end",
  req: Request
): Promise<void> {
  try {
    await db.insert(userLoginEvents).values({
      authUserId,
      eventType,
      sessionId: req.sessionID,
      ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString(),
      userAgent: req.headers["user-agent"],
      occurredAt: new Date(),
      metadata: {
        source: "web",
        deviceType: detectDeviceType(req.headers["user-agent"] || "")
      }
    });
  } catch (error) {
    console.error("Error tracking login event:", error);
  }
}

function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet/i.test(userAgent)) return "tablet";
  return "desktop";
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    }
  }
}

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession() as any);

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existingUsername = await getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await createUser({
        username,
        email: email || undefined,
        passwordHash,
      });

      const sessionUser: Express.User = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      (req.session as any).user = sessionUser;

      trackLoginEvent(user.id, "login", req);

      return res.status(201).json({
        message: "Registration successful",
        user: sessionUser,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const sessionUser: Express.User = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      (req.session as any).user = sessionUser;

      trackLoginEvent(user.id, "login", req);

      const role = await getUserRole(user.id);

      return res.json({
        message: "Login successful",
        user: sessionUser,
        role,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const userId = (req.session as any)?.user?.id;
    
    if (userId) {
      trackLoginEvent(userId, "logout", req);
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    const user = (req.session as any).user;
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(user);
  });
}

export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const user = (req.session as any).user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = user;
  return next();
};
