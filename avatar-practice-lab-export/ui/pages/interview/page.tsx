import { useState, useEffect } from "react";
import { Search, ChevronRight, Briefcase, GraduationCap, Code, LineChart, Users, Megaphone, Clock, ArrowRight, Building2, Upload, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: "entry" | "mid" | "senior";
  domain: string;
  description: string | null;
  defaultInterviewTypes: string[] | null;
  skillsFocus: string[] | null;
  estimatedDuration: number | null;
  trackTags: string[] | null;
}

const domainIcons: Record<string, any> = {
  software: Code,
  data: LineChart,
  product: Briefcase,
  design: GraduationCap,
  sales: Users,
  marketing: Megaphone,
  customer_success: Users,
  operations: Building2,
  consulting: Briefcase,
  finance: LineChart,
  hr: Users,
  recruiting: Users,
  engineering_management: Code,
};

const domainColors: Record<string, { bg: string; color: string; ring: string }> = {
  software: { bg: "bg-gradient-to-br from-blue-50 to-blue-100", color: "text-blue-600", ring: "ring-blue-200" },
  data: { bg: "bg-gradient-to-br from-purple-50 to-purple-100", color: "text-purple-600", ring: "ring-purple-200" },
  product: { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100", color: "text-emerald-600", ring: "ring-emerald-200" },
  design: { bg: "bg-gradient-to-br from-pink-50 to-pink-100", color: "text-pink-600", ring: "ring-pink-200" },
  sales: { bg: "bg-gradient-to-br from-amber-50 to-amber-100", color: "text-amber-600", ring: "ring-amber-200" },
  marketing: { bg: "bg-gradient-to-br from-rose-50 to-rose-100", color: "text-rose-600", ring: "ring-rose-200" },
  customer_success: { bg: "bg-gradient-to-br from-teal-50 to-teal-100", color: "text-teal-600", ring: "ring-teal-200" },
  operations: { bg: "bg-gradient-to-br from-slate-50 to-slate-100", color: "text-slate-600", ring: "ring-slate-200" },
  consulting: { bg: "bg-gradient-to-br from-indigo-50 to-indigo-100", color: "text-indigo-600", ring: "ring-indigo-200" },
  finance: { bg: "bg-gradient-to-br from-green-50 to-green-100", color: "text-green-600", ring: "ring-green-200" },
  hr: { bg: "bg-gradient-to-br from-orange-50 to-orange-100", color: "text-orange-600", ring: "ring-orange-200" },
  recruiting: { bg: "bg-gradient-to-br from-cyan-50 to-cyan-100", color: "text-cyan-600", ring: "ring-cyan-200" },
  engineering_management: { bg: "bg-gradient-to-br from-violet-50 to-violet-100", color: "text-violet-600", ring: "ring-violet-200" },
};

const getLevelConfig = (level: string) => {
  switch (level) {
    case "entry":
      return { label: "Entry Level", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "mid":
      return { label: "Mid Level", color: "bg-amber-50 text-amber-700 border-amber-200" };
    case "senior":
      return { label: "Senior", color: "bg-rose-50 text-rose-700 border-rose-200" };
    default:
      return { label: level, color: "bg-slate-50 text-slate-600 border-slate-200" };
  }
};

export default function InterviewPracticePage() {
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [filteredKits, setFilteredKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoleKits = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/interview/role-kits");
        const data = await response.json();
        if (data.success) {
          setRoleKits(data.roleKits);
          setFilteredKits(data.roleKits);
        }
      } catch (error) {
        console.error("Error fetching role kits:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoleKits();
  }, []);

  useEffect(() => {
    let filtered = roleKits;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (kit) =>
          kit.name.toLowerCase().includes(query) ||
          kit.description?.toLowerCase().includes(query) ||
          kit.domain.toLowerCase().includes(query)
      );
    }
    
    if (selectedDomain) {
      filtered = filtered.filter((kit) => kit.domain === selectedDomain);
    }
    
    if (selectedLevel) {
      filtered = filtered.filter((kit) => kit.level === selectedLevel);
    }
    
    setFilteredKits(filtered);
  }, [searchQuery, selectedDomain, selectedLevel, roleKits]);

  const domains = [...new Set(roleKits.map((kit) => kit.domain))];

  const handleSelectRole = (kit: RoleKit) => {
    navigate(`/interview/config?roleKitId=${kit.id}`);
  };

  return (
    <ModernDashboardLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
          <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
              <Link
                to="/avatar/start"
                className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-medium transition-colors group"
              >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                Back to Dashboard
              </Link>
              
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 sm:gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Interview Practice</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Choose Your Target Role
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Select a role to practice standard interview questions. Pick a role and start practicing right away!
                  </p>
                </div>

                <div className="w-full lg:w-80">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500/20 text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
            <Link
              to="/interview/custom"
              className="block mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Have a specific job in mind?
                    </h3>
                    <p className="text-sm text-slate-600">
                      Upload your resume and job description for a personalized interview experience
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-emerald-600 font-medium">
                  <Upload className="w-4 h-4" />
                  <span>Custom Interview</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <div className="mb-5 flex flex-wrap gap-2">
              <Button
                variant={selectedDomain === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDomain(null)}
                className="rounded-full"
              >
                All Domains
              </Button>
              {domains.map((domain) => (
                <Button
                  key={domain}
                  variant={selectedDomain === domain ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDomain(domain)}
                  className="rounded-full capitalize"
                >
                  {domain.replace(/_/g, " ")}
                </Button>
              ))}
            </div>

            <div className="mb-5 flex gap-2">
              <Button
                variant={selectedLevel === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedLevel(null)}
              >
                All Levels
              </Button>
              {["entry", "mid", "senior"].map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLevel(level)}
                  className="capitalize"
                >
                  {level === "entry" ? "Entry Level" : level === "mid" ? "Mid Level" : "Senior"}
                </Button>
              ))}
            </div>

            <p className="text-sm text-slate-500 mb-4">
              <span className="font-semibold text-slate-700">{filteredKits.length}</span> role{filteredKits.length !== 1 ? "s" : ""} available
            </p>

            {filteredKits.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No roles found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
                  Try adjusting your search or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDomain(null);
                    setSelectedLevel(null);
                    setSearchQuery("");
                  }}
                  className="rounded-xl"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredKits.map((kit) => {
                  const IconComponent = domainIcons[kit.domain] || Briefcase;
                  const colors = domainColors[kit.domain] || domainColors.consulting;
                  const levelConfig = getLevelConfig(kit.level);

                  return (
                    <Card
                      key={kit.id}
                      className="h-full bg-white border border-slate-200 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden rounded-2xl cursor-pointer group"
                      onClick={() => handleSelectRole(kit)}
                    >
                      <CardContent className="p-0 h-full flex flex-col">
                        <div className={`${colors.bg} p-4 sm:p-5 relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                          
                          <div className="relative flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm ring-1 ${colors.ring}`}>
                              <IconComponent className={`w-6 h-6 ${colors.color}`} />
                            </div>
                            <Badge variant="outline" className={`${levelConfig.color} border text-xs font-medium px-2.5 py-0.5`}>
                              {levelConfig.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 flex-1 flex flex-col">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {kit.name}
                          </h3>

                          <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">
                            {kit.description || "Practice interview for this role"}
                          </p>

                          {kit.skillsFocus && kit.skillsFocus.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {kit.skillsFocus.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {kit.skillsFocus.length > 3 && (
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                  +{kit.skillsFocus.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{Math.round((kit.estimatedDuration || 360) / 60)} min</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 transition-all">
                              Start Practice
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
