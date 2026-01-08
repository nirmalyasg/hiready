import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  FileText,
  Linkedin,
  ArrowRight,
  Target,
  Sparkles,
  CheckCircle,
  Zap,
  Shield
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function ReadycheckPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [jdText, setJdText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("jd");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        const data = await res.json();
        setIsLoggedIn(data.success && data.user);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleContinue = async () => {
    setError("");
    
    if (activeTab === "jd" && !jdText.trim()) {
      setError("Please paste a job description to continue.");
      return;
    }
    
    if (activeTab === "linkedin" && !linkedinUrl.trim()) {
      setError("Please enter a LinkedIn URL to continue.");
      return;
    }

    if (activeTab === "linkedin" && !linkedinUrl.includes("linkedin.com")) {
      setError("Please enter a valid LinkedIn URL.");
      return;
    }

    setIsProcessing(true);

    if (activeTab === "jd") {
      sessionStorage.setItem("readycheck_jd", jdText);
      sessionStorage.setItem("readycheck_type", "jd");
    } else {
      sessionStorage.setItem("readycheck_linkedin", linkedinUrl);
      sessionStorage.setItem("readycheck_type", "linkedin");
    }

    if (!isLoggedIn) {
      sessionStorage.setItem("returnTo", "/readycheck/launch");
      navigate("/register");
      return;
    }

    navigate("/readycheck/launch");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c]">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Target className="w-5 h-5 text-[#ee7e65]" />
            <span className="text-white font-semibold">Hiready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Get Your{" "}
            <span className="text-[#ee7e65]">Hiready Index</span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Practice a real interview and get your readiness score in minutes.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger 
                value="jd" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                Paste JD
              </TabsTrigger>
              <TabsTrigger 
                value="linkedin" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jd" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste the Job Description
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => {
                    setJdText(e.target.value);
                    setError("");
                  }}
                  placeholder="Paste the full job description here...

We'll analyze the role requirements and create a personalized interview practice session tailored to this specific job."
                  className="w-full h-56 p-4 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#ee7e65] focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {jdText.length > 0 && `${jdText.length} characters`}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="linkedin" className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Job URL
                </label>
                <Input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => {
                    setLinkedinUrl(e.target.value);
                    setError("");
                  }}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste the LinkedIn job posting URL and we'll extract the details.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={handleContinue}
            disabled={isProcessing}
            className="w-full mt-6 bg-[#ee7e65] hover:bg-[#d96a52] h-14 text-lg font-semibold rounded-xl"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2" />
                Processing...
              </>
            ) : (
              <>
                Start Free Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-[#ee7e65] font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white text-sm mb-1">AI-Powered</h3>
            <p className="text-xs text-white/60">Realistic interview</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white text-sm mb-1">Hiready Index</h3>
            <p className="text-xs text-white/60">Readiness score</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white text-sm mb-1">1 Free</h3>
            <p className="text-xs text-white/60">Per role</p>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-white/50 text-sm">
            <Shield className="w-4 h-4" />
            Your data is secure and never shared
          </div>
        </div>
      </div>
    </div>
  );
}
