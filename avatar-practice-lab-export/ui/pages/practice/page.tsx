import { useState, useEffect } from "react";
import { 
  Search, MessageSquare, Clock, ArrowRight, Briefcase, Building2, 
  Target, Sparkles, Mic, MapPin, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
  description: string | null;
}

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
}

const domainColors: Record<string, string> = {
  software: "bg-slate-900",
  data: "bg-[#cb6ce6]",
  product: "bg-[#24c4b8]",
  design: "bg-gray-500",
  sales: "bg-[#24c4b8]",
  marketing: "bg-slate-900",
  customer_success: "bg-[#cb6ce6]",
  operations: "bg-gray-500",
  consulting: "bg-slate-900",
  finance: "bg-[#cb6ce6]",
  hr: "bg-[#24c4b8]",
  recruiting: "bg-gray-500",
  engineering_management: "bg-slate-900",
};

const formatDomain = (domain: string) => {
  return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function PracticePage() {
  const navigate = useNavigate();
  const [customInput, setCustomInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [jobsRes, rolesRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/interview/role-kits")
        ]);

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.success) {
            setSavedJobs(jobsData.jobs.filter((j: JobTarget) => j.status !== "archived").slice(0, 4));
          }
        }

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          if (rolesData.success) {
            setRoleKits(rolesData.roleKits.slice(0, 6));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartCustom = async () => {
    if (customInput.trim().length < 20) return;
    
    setIsGenerating(true);
    try {
      sessionStorage.setItem("customPracticeIntent", customInput);
      navigate("/avatar/practice/intent-entry?custom=true");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectJob = (job: JobTarget) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleSelectRole = (kit: RoleKit) => {
    navigate(`/interview/role/${kit.id}`);
  };

  const minChars = 20;
  const trimmedInput = customInput.trim();
  const currentChars = trimmedInput.length;
  const needsMore = minChars - currentChars;

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          
          {/* Section 1: Custom Conversation Input */}
          <section className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              What conversation are you preparing for?
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mb-6">
              Describe your situation and we'll create a practice session
            </p>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="relative">
                <Textarea
                  placeholder="I need to tell my manager I can't meet the deadline..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="min-h-[120px] resize-none border-0 focus:ring-0 text-base sm:text-lg text-slate-700 placeholder:text-slate-400 p-0"
                />
                <div className="absolute right-2 top-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">EN</span>
                  <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                    <Mic className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleStartCustom}
                  disabled={currentChars < minChars || isGenerating}
                  className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${
                    currentChars >= minChars
                      ? "bg-[#24c4b8] hover:bg-[#1db0a5] text-white"
                      : "bg-pink-200 text-pink-700 cursor-not-allowed"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Creating session...
                    </>
                  ) : currentChars < minChars ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Add {needsMore} more character{needsMore !== 1 ? "s" : ""}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Practice Session
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or choose below</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Section 2: Target Jobs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#24c4b8] flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Target Jobs</h2>
                  <p className="text-xs text-slate-500">Practice for specific positions</p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/interview")}
                className="text-sm text-[#24c4b8] font-medium hover:underline"
              >
                View all →
              </button>
            </div>

            {savedJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="group text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-[#24c4b8] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#24c4b8]/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#24c4b8]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate group-hover:text-[#24c4b8] text-sm">
                          {job.roleTitle}
                        </h3>
                        {job.companyName && (
                          <p className="text-xs text-slate-500 truncate">{job.companyName}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#24c4b8] flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => navigate("/interview")}
                className="w-full text-left bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-[#24c4b8] hover:bg-[#24c4b8]/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#24c4b8]/10">
                    <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-[#24c4b8]" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 group-hover:text-[#24c4b8] text-sm">Add a target job</p>
                    <p className="text-xs text-slate-500">Import from URL or paste description</p>
                  </div>
                </div>
              </button>
            )}
          </section>

          {/* Section 3: Role Library */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Role Library</h2>
                  <p className="text-xs text-slate-500">General interview practice by role</p>
                </div>
              </div>
              <button 
                onClick={() => navigate("/interview")}
                className="text-sm text-slate-600 font-medium hover:underline"
              >
                Browse all →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roleKits.map((kit) => {
                const bgColor = domainColors[kit.domain] || "bg-slate-500";
                return (
                  <button
                    key={kit.id}
                    onClick={() => handleSelectRole(kit)}
                    className="group text-left bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-400 hover:shadow-md transition-all"
                  >
                    <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center mb-2`}>
                      <Briefcase className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-slate-700">
                      {kit.name}
                    </h3>
                    <p className="text-xs text-slate-400">{formatDomain(kit.domain)}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
