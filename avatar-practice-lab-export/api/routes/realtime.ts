import { Router, Request, Response } from "express";

const realtimeRouter = Router();

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  next();
};

realtimeRouter.post("/token", requireAuth, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("[Realtime] No OPENAI_API_KEY found in environment");
      return res.status(500).json({ 
        success: false, 
        error: "OpenAI API key not configured" 
      });
    }

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "sage",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Realtime] OpenAI API error:", response.status, errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `OpenAI API error: ${response.status}` 
      });
    }

    const data = await response.json();
    
    res.json({ 
      success: true, 
      token: data.client_secret?.value || data.client_secret 
    });
  } catch (error: any) {
    console.error("[Realtime] Error fetching ephemeral token:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export { realtimeRouter };
