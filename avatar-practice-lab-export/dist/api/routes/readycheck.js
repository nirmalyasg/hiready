import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
export const readycheckRouter = Router();
readycheckRouter.use((req, res, next) => {
    const sessionUser = req.session?.user;
    if (sessionUser) {
        req.user = sessionUser;
    }
    next();
});
readycheckRouter.post("/parse-linkedin", requireAuth, async (req, res) => {
    try {
        const { linkedinUrl } = req.body;
        if (!linkedinUrl) {
            return res.status(400).json({ success: false, error: "LinkedIn URL is required" });
        }
        if (!linkedinUrl.includes("linkedin.com")) {
            return res.status(400).json({ success: false, error: "Invalid LinkedIn URL" });
        }
        try {
            const response = await fetch(linkedinUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                },
            });
            if (!response.ok) {
                return res.json({
                    success: false,
                    error: "Could not fetch the LinkedIn page. Please paste the job description directly instead."
                });
            }
            const html = await response.text();
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
            let extractedText = "";
            if (titleMatch) {
                extractedText += titleMatch[1].trim() + "\n\n";
            }
            if (descriptionMatch) {
                extractedText += descriptionMatch[1].trim() + "\n\n";
            }
            const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/i);
            if (jsonLdMatch) {
                try {
                    const jsonData = JSON.parse(jsonLdMatch[1]);
                    if (jsonData.description) {
                        extractedText += jsonData.description + "\n\n";
                    }
                    if (jsonData.title) {
                        extractedText += "Title: " + jsonData.title + "\n";
                    }
                    if (jsonData.hiringOrganization?.name) {
                        extractedText += "Company: " + jsonData.hiringOrganization.name + "\n";
                    }
                    if (jsonData.jobLocation?.address?.addressLocality) {
                        extractedText += "Location: " + jsonData.jobLocation.address.addressLocality + "\n";
                    }
                }
                catch (e) {
                }
            }
            if (extractedText.trim().length > 50) {
                return res.json({
                    success: true,
                    jdText: extractedText.trim(),
                    message: "Successfully extracted job details"
                });
            }
            return res.json({
                success: false,
                error: "LinkedIn requires login to view job details. Please copy and paste the job description directly."
            });
        }
        catch (fetchError) {
            console.error("Error fetching LinkedIn URL:", fetchError);
            return res.json({
                success: false,
                error: "Could not access the LinkedIn page. Please paste the job description directly instead."
            });
        }
    }
    catch (error) {
        console.error("Error in parse-linkedin:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
