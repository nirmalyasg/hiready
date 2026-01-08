import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Target, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReadycheckLaunchPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Preparing your interview...");
  const [error, setError] = useState("");

  useEffect(() => {
    const processAndLaunch = async () => {
      try {
        const type = sessionStorage.getItem("readycheck_type");
        
        if (!type) {
          navigate("/readycheck");
          return;
        }

        if (type === "jd") {
          const jdText = sessionStorage.getItem("readycheck_jd");
          if (!jdText) {
            navigate("/readycheck");
            return;
          }

          setStatus("Analyzing job description...");

          const response = await fetch("/api/interview/parse-jd", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ jdText }),
          });

          const data = await response.json();

          if (data.success && data.jobTarget) {
            sessionStorage.removeItem("readycheck_jd");
            sessionStorage.removeItem("readycheck_type");
            sessionStorage.removeItem("returnTo");
            
            setStatus("Setting up your practice session...");
            navigate(`/jobs/${data.jobTarget.id}`);
          } else {
            setError("Could not analyze the job description. Please try again.");
          }
        } else if (type === "linkedin") {
          const linkedinUrl = sessionStorage.getItem("readycheck_linkedin");
          if (!linkedinUrl) {
            navigate("/readycheck");
            return;
          }

          setStatus("Fetching job details from LinkedIn...");

          const response = await fetch("/api/readycheck/parse-linkedin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ linkedinUrl }),
          });

          const data = await response.json();

          if (data.success && data.jobTarget) {
            sessionStorage.removeItem("readycheck_linkedin");
            sessionStorage.removeItem("readycheck_type");
            sessionStorage.removeItem("returnTo");
            
            setStatus("Setting up your practice session...");
            navigate(`/jobs/${data.jobTarget.id}`);
          } else if (data.success && data.jdText) {
            sessionStorage.setItem("readycheck_jd", data.jdText);
            sessionStorage.setItem("readycheck_type", "jd");
            sessionStorage.removeItem("readycheck_linkedin");
            
            setStatus("Analyzing extracted job description...");
            await processAndLaunch();
            return;
          } else {
            setError(data.error || "Could not fetch job details from LinkedIn. Please paste the job description instead.");
          }
        }
      } catch (err) {
        console.error("Error processing readycheck:", err);
        setError("Something went wrong. Please try again.");
      }
    };

    processAndLaunch();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => navigate("/readycheck")}
            className="bg-[#ee7e65] hover:bg-[#d96a52]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
          <Target className="w-5 h-5 text-[#ee7e65]" />
          <span className="text-white font-semibold">Hiready</span>
        </div>
        
        <div className="mb-8">
          <LoadingSpinner className="w-12 h-12 text-[#ee7e65] mx-auto" />
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-2">{status}</h2>
        <p className="text-white/60">This will only take a moment</p>
      </div>
    </div>
  );
}
