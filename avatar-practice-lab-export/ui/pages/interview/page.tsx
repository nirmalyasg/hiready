import { useState, useEffect } from "react";
import { Search, ChevronRight, Briefcase, GraduationCap, Code, LineChart, Users, Megaphone, Clock, ArrowRight, Building2, Filter, Check, ChevronDown, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";
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

const domainColors: Record<string, string> = {
  software: "bg-blue-500",
  data: "bg-purple-500",
  product: "bg-emerald-500",
  design: "bg-pink-500",
  sales: "bg-amber-500",
  marketing: "bg-rose-500",
  customer_success: "bg-teal-500",
  operations: "bg-slate-500",
  consulting: "bg-indigo-500",
  finance: "bg-green-500",
  hr: "bg-orange-500",
  recruiting: "bg-cyan-500",
  engineering_management: "bg-violet-500",
};

const getLevelConfig = (level: string) => {
  switch (level) {
    case "entry":
      return { label: "Entry", color: "bg-green-100 text-green-700" };
    case "mid":
      return { label: "Mid-Level", color: "bg-amber-100 text-amber-700" };
    case "senior":
      return { label: "Senior", color: "bg-red-100 text-red-700" };
    default:
      return { label: level, color: "bg-gray-100 text-gray-600" };
  }
};

export default function InterviewPracticePage() {
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [filteredKits, setFilteredKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
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

    setFilteredKits(filtered);
  }, [searchQuery, selectedDomain, roleKits]);

  const domains = [...new Set(roleKits.map((kit) => kit.domain))];

  const handleSelectRole = (kit: RoleKit) => {
    navigate(`/interview/role/${kit.id}`);
  };

  const formatDomain = (domain: string) => {
    return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <SidebarLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-3">
                <Briefcase className="w-4 h-4" />
                Interview Prep
              </div>
              <h1 className="text-3xl font-bold text-brand-dark">
                Practice Interviews
              </h1>
              <p className="text-brand-muted mt-2 max-w-xl">
                Choose your role and get ready for your next interview with AI-powered practice sessions.
              </p>
            </div>

            {/* Search */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl text-sm font-medium shadow-sm transition-all ${
                  selectedDomain 
                    ? "border-purple-400 text-purple-700" 
                    : "border-gray-200 text-brand-dark hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="max-w-[150px] truncate">
                  {selectedDomain ? formatDomain(selectedDomain) : "All Domains"}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>

              {filterOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedDomain(null); setFilterOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 ${
                      !selectedDomain ? "bg-purple-50 text-purple-700 font-medium" : "text-brand-dark"
                    }`}
                  >
                    All Domains
                    {!selectedDomain && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                  {domains.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => { setSelectedDomain(domain); setFilterOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 border-t border-gray-100 ${
                        selectedDomain === domain ? "bg-purple-50 text-purple-700 font-medium" : "text-brand-dark"
                      }`}
                    >
                      <span className="truncate pr-2">{formatDomain(domain)}</span>
                      {selectedDomain === domain && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDomain && (
              <button
                onClick={() => setSelectedDomain(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-full hover:bg-purple-200 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}

            <span className="text-sm text-brand-muted ml-auto">
              <span className="font-semibold text-brand-dark">{filteredKits.length}</span> roles
            </span>
          </div>

          {/* Role Kits Grid */}
          {filteredKits.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-brand-muted" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">No roles found</h3>
              <p className="text-brand-muted mb-6 max-w-md mx-auto">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" onClick={() => { setSelectedDomain(null); setSearchQuery(""); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredKits.map((kit) => {
                const IconComponent = domainIcons[kit.domain] || Briefcase;
                const bgColor = domainColors[kit.domain] || "bg-gray-500";
                const levelConfig = getLevelConfig(kit.level);

                return (
                  <button
                    key={kit.id}
                    onClick={() => handleSelectRole(kit)}
                    className="group text-left"
                  >
                    <div className="h-full bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${levelConfig.color}`}>
                          {levelConfig.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-brand-dark mb-1 group-hover:text-purple-700 transition-colors">
                        {kit.name}
                      </h3>
                      <p className="text-sm text-brand-muted mb-4">
                        {formatDomain(kit.domain)}
                      </p>

                      {kit.description && (
                        <p className="text-sm text-brand-muted line-clamp-2 mb-5">
                          {kit.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{kit.estimatedDuration || 30} min</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:gap-2 transition-all">
                          Start
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
