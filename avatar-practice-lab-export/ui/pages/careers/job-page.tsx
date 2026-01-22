import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Laptop,
  Play,
  ChevronRight,
  ArrowLeft,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PublicJobPage {
  id: string;
  slug: string;
  roleTitle: string;
  companyName: string | null;
  companyLogoUrl: string | null;
  companyIndustry: string | null;
  location: string | null;
  isRemote: boolean;
  jobDescription: string | null;
  experienceRequired: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  requiredSkills: string[] | null;
  practiceCtaText: string | null;
  customTitle: string | null;
  customDescription: string | null;
}

export default function PublicJobPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PublicJobPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/job-screening/public-pages/by-slug/${slug}`);
        const data = await response.json();

        if (data.success) {
          setPage(data.page);
        } else {
          setError(data.error || "Page not found");
        }
      } catch (err) {
        setError("Failed to load page");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const handlePracticeClick = async () => {
    if (!page) return;

    // Record the click
    try {
      await fetch(`/api/job-screening/public-pages/${page.id}/practice-click`, {
        method: "POST",
      });
    } catch (e) {
      // Ignore analytics errors
    }

    // Navigate to interview practice
    navigate(`/interview?job=${encodeURIComponent(page.roleTitle)}&company=${encodeURIComponent(page.companyName || "")}`);
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return null;
    const curr = currency || "USD";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr.includes("/") ? "USD" : curr,
      maximumFractionDigits: 0,
    });

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) return `${formatter.format(min)}+`;
    if (max) return `Up to ${formatter.format(max)}`;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfc] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#fbfbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h1>
          <p className="text-slate-500 mb-6">
            This job posting may have been removed or is no longer available.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfc]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Company Logo */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
              {page.companyLogoUrl ? (
                <img
                  src={page.companyLogoUrl}
                  alt={page.companyName || ""}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {page.customTitle || page.roleTitle}
              </h1>
              {page.companyName && (
                <p className="text-xl text-white/80 mb-4">{page.companyName}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-white/70">
                {page.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {page.location}
                  </span>
                )}
                {page.employmentType && (
                  <span className="flex items-center gap-1.5 capitalize">
                    <Briefcase className="w-4 h-4" />
                    {page.employmentType}
                  </span>
                )}
                {page.isRemote && (
                  <span className="flex items-center gap-1.5 text-[#24c4b8]">
                    <Laptop className="w-4 h-4" />
                    Remote
                  </span>
                )}
                {page.experienceRequired && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {page.experienceRequired}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="flex flex-wrap gap-3">
              {(page.salaryMin || page.salaryMax) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                  <DollarSign className="w-4 h-4" />
                  {formatSalary(page.salaryMin, page.salaryMax, page.salaryCurrency)}
                </div>
              )}
              {page.companyIndustry && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  {page.companyIndustry}
                </div>
              )}
            </div>

            {/* Skills */}
            {page.requiredSkills && page.requiredSkills.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {page.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium capitalize"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {page.jobDescription && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">About This Role</h2>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700">
                    {page.customDescription || page.jobDescription}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Practice CTA */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#cb6ce6] to-[#9b4dca] rounded-2xl p-6 text-white sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold">Prepare for This Interview</h3>
                  <p className="text-white/80 text-sm">Practice with AI</p>
                </div>
              </div>

              <p className="text-white/80 text-sm mb-6">
                Get ready for your interview with personalized AI-powered practice sessions tailored to this role.
              </p>

              <Button
                onClick={handlePracticeClick}
                className="w-full h-12 bg-white text-[#cb6ce6] hover:bg-white/90 rounded-xl font-semibold shadow-lg shadow-black/10"
              >
                {page.practiceCtaText || "Practice for This Interview"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/60 text-xs text-center">
                  Powered by HiReady AI Interview Practice
                </p>
              </div>
            </div>

            {/* About HiReady */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3">About HiReady</h3>
              <p className="text-sm text-slate-600 mb-4">
                HiReady helps you ace your interviews with AI-powered practice sessions that simulate real interview experiences.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-[#24c4b8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Realistic AI interviewers
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-[#24c4b8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Personalized feedback
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-[#24c4b8] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  Role-specific questions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#000000] to-[#1a0a2e] rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">HiReady</p>
                <p className="text-xs text-slate-500">AI Interview Practice</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="rounded-xl"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit HiReady
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
