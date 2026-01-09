import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  Sparkles,
  CheckCircle,
  Loader2,
  FileText,
  Link as LinkIcon,
  Clock,
  Target,
  BarChart3,
  Zap
} from "lucide-react";

export default function ReadycheckPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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

  const isLinkedInUrl = (text: string) => {
    return text.includes("linkedin.com/jobs") || text.includes("linkedin.com/job");
  };

  const inputType = isLinkedInUrl(inputValue) ? "linkedin" : "jd";

  const handleStart = async () => {
    setError("");
    
    if (!inputValue.trim()) {
      setError("Please paste a job description or LinkedIn URL");
      return;
    }

    if (inputValue.trim().length < 50 && !isLinkedInUrl(inputValue)) {
      setError("Please paste a complete job description (at least 50 characters)");
      return;
    }

    setIsProcessing(true);

    if (inputType === "linkedin") {
      sessionStorage.setItem("readycheck_linkedin", inputValue);
      sessionStorage.setItem("readycheck_type", "linkedin");
    } else {
      sessionStorage.setItem("readycheck_jd", inputValue);
      sessionStorage.setItem("readycheck_type", "jd");
    }

    if (!isLoggedIn) {
      sessionStorage.setItem("returnTo", "/readycheck/launch");
      navigate("/register");
      return;
    }

    navigate("/readycheck/launch");
  };

  const benefits = [
    { icon: Clock, text: "10-minute practice session" },
    { icon: Target, text: "Questions tailored to your role" },
    { icon: BarChart3, text: "Instant feedback & score" },
  ];

  return (
    <div className="min-h-screen bg-[#042c4c] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-[#ee7e65]/15 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#768c9c]/10 rounded-full blur-3xl" />
      
      <header className="p-4 sm:p-6 relative">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-[#ee7e65] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">Hiready</span>
          </Link>
          {isLoggedIn && (
            <Link to="/avatar/dashboard">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 relative">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium mb-5 border border-white/20">
              <Zap className="w-4 h-4 text-[#ee7e65]" />
              Free AI Interview Practice
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
              Start your interview prep
            </h1>
            <p className="text-white/60 text-lg">
              Paste a job description or LinkedIn job URL below
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                placeholder="Paste job description or LinkedIn job URL here..."
                className="w-full h-40 sm:h-48 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#042c4c]/10 focus:border-[#042c4c] text-[#042c4c] placeholder:text-[#768c9c] text-sm transition-all bg-[#fbfbfc]"
              />
              
              {inputValue && (
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    inputType === "linkedin" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-[#ee7e65]/10 text-[#ee7e65]"
                  }`}>
                    {inputType === "linkedin" ? <LinkIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {inputType === "linkedin" ? "LinkedIn URL" : "Job Description"}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {error}
              </p>
            )}

            <Button 
              onClick={handleStart}
              disabled={isProcessing}
              className="w-full mt-5 h-14 bg-[#ee7e65] hover:bg-[#e06a50] text-white text-base font-semibold shadow-lg shadow-[#ee7e65]/25 group"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Free Practice
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#6c8194]">
                    <div className="w-6 h-6 rounded-lg bg-[#042c4c] flex items-center justify-center">
                      <b.icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    {b.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-white/50 text-sm mt-6 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            No credit card required
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-white/30 text-sm relative">
        © {new Date().getFullYear()} Hiready
      </footer>
    </div>
  );
}
