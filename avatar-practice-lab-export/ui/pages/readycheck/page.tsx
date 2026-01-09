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
  Zap,
  Rocket
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
    { icon: Clock, text: "10-minute practice session", color: "from-blue-500 to-cyan-500" },
    { icon: Target, text: "Questions tailored to your role", color: "from-violet-500 to-purple-500" },
    { icon: BarChart3, text: "Instant feedback & score", color: "from-orange-500 to-pink-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-indigo-900 to-purple-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      
      <header className="p-4 sm:p-6 relative">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30">
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
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-white/20">
              <Zap className="w-4 h-4 text-amber-400" />
              Free AI Interview Practice
              <Rocket className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Start your interview prep
            </h1>
            <p className="text-white/70 text-lg">
              Paste a job description or LinkedIn job URL below
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/50">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                placeholder="Paste job description or LinkedIn job URL here..."
                className="w-full h-40 sm:h-48 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-gray-800 placeholder:text-gray-400 text-sm transition-all"
              />
              
              {inputValue && (
                <div className="absolute top-3 right-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    inputType === "linkedin" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-violet-100 text-violet-700"
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
              className="w-full mt-5 h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-base font-semibold shadow-lg shadow-violet-200 group"
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
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${b.color} flex items-center justify-center`}>
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

      <footer className="py-6 text-center text-white/40 text-sm relative">
        © {new Date().getFullYear()} Hiready
      </footer>
    </div>
  );
}
