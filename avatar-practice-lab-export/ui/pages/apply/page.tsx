import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Play,
  FileText,
  Users,
  Code,
  Brain,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface JobData {
  id: string;
  title: string;
  jdText: string | null;
  assessmentConfig: {
    interviewTypes: string[];
    totalDuration?: number;
    dimensions?: string[];
  };
  company: {
    name: string;
    logoUrl: string | null;
    domain: string | null;
  };
  roleKit: {
    id: number;
    name: string;
    domain: string;
  } | null;
}

const getInterviewTypeIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('coding') || t.includes('technical')) return Code;
  if (t.includes('behavioral') || t.includes('hr')) return Users;
  if (t.includes('case')) return Brain;
  return MessageSquare;
};

const formatInterviewType = (type: string) => {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function ApplyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

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

  useEffect(() => {
    const fetchJob = async () => {
      if (!slug) {
        setError("Invalid job link");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/employer/apply/${slug}`);
        const data = await response.json();
        
        if (data.success) {
          setJobData(data.job);
        } else {
          setError(data.error || "Job not found");
        }
      } catch (err) {
        setError("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [slug]);

  const handleStartAssessment = async () => {
    if (!isLoggedIn) {
      sessionStorage.setItem("returnTo", `/apply/${slug}`);
      navigate("/register");
      return;
    }

    setIsStarting(true);
    try {
      const response = await fetch(`/api/employer/apply/${slug}/start`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
        navigate(`/interview/config?employerJobId=${jobData?.id}&roleKitId=${jobData?.roleKit?.id || ""}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to start assessment");
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error === "This job is no longer accepting applications" 
                ? "Applications Closed" 
                : "Job Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">{error || "This job listing doesn't exist or has been removed."}</p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const interviewTypes = jobData.assessmentConfig?.interviewTypes || ["hr", "technical"];
  const totalDuration = jobData.assessmentConfig?.totalDuration || 45;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          {jobData.company.logoUrl ? (
            <img 
              src={jobData.company.logoUrl} 
              alt={jobData.company.name}
              className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain bg-white p-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl mx-auto mb-4 bg-white/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{jobData.title}</h1>
          <p className="text-white/70 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" />
            {jobData.company.name}
          </p>
        </div>

        <Card className="shadow-2xl mb-6">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-600" />
              Assessment Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-slate-900" />
                <span className="text-gray-700">Estimated Duration</span>
              </div>
              <span className="font-semibold text-slate-900">{totalDuration} minutes</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Assessment Structure</h3>
              <div className="space-y-3">
                {interviewTypes.map((type, idx) => {
                  const Icon = getInterviewTypeIcon(type);
                  return (
                    <div 
                      key={type}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/10 text-slate-600 font-semibold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="w-5 h-5 text-slate-900" />
                        <span className="font-medium text-gray-900">
                          {formatInterviewType(type)} Interview
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        ~{Math.round(totalDuration / interviewTypes.length)} min
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {jobData.jdText && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  About the Role
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 max-h-48 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{jobData.jdText}</p>
                </div>
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                What to Expect
              </h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>AI-powered interview with realistic scenarios</li>
                <li>Instant feedback and scoring on your responses</li>
                <li>Your Hiready Index score will be shared with {jobData.company.name}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleStartAssessment}
            disabled={isStarting}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            {isStarting ? (
              <>
                <LoadingSpinner className="w-5 h-5 mr-2" />
                Starting...
              </>
            ) : isLoggedIn ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Assessment
              </>
            ) : (
              <>
                Sign Up to Start
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          {!isLoggedIn && (
            <p className="text-white/60 text-sm mt-4">
              Already have an account?{" "}
              <Link 
                to={`/login?returnTo=/apply/${slug}`}
                className="text-slate-600 hover:underline"
              >
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
