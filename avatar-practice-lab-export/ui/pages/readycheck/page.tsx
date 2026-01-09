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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-lg">Hiready</span>
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

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              Free AI Interview Practice
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Start your interview prep
            </h1>
            <p className="text-white/60 text-lg">
              Paste a job description or LinkedIn job URL below
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 sm:p-8 border border-slate-200">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                placeholder="Paste job description or LinkedIn job URL here..."
                className="w-full h-40 sm:h-48 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-slate-800 placeholder:text-slate-400 text-sm"
              />
              
              {inputValue.trim() && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {inputType === "linkedin" ? (
                    <>
                      <LinkIcon className="w-3 h-3 text-slate-700" />
                      <span className="text-slate-700">LinkedIn URL detected</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      Job description
                    </>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3">{error}</p>
            )}

            <Button
              onClick={handleStart}
              disabled={isProcessing}
              className="w-full mt-4 h-12 bg-slate-900 hover:bg-slate-800 text-white text-base font-medium"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Start Free Interview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              <CheckCircle className="w-4 h-4 inline mr-1 text-emerald-500" />
              Free • No credit card required
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <b.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/#how-it-works" 
              className="text-white/50 hover:text-white/80 text-sm underline underline-offset-4 transition-colors"
            >
              How does this work?
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} Hiready
      </footer>
    </div>
  );
}
