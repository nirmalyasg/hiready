import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Briefcase,
  Upload,
  ArrowRight,
  Star,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Target,
  Users,
  Code,
  LineChart,
  Zap,
  FileText,
  Building2
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  domain: string;
  description: string | null;
  popularity?: number;
}

const domainIcons: Record<string, any> = {
  technology: Code,
  finance: LineChart,
  consulting: TrendingUp,
  sales: Users,
  marketing: Sparkles,
  operations: Briefcase,
  default: Briefcase,
};

const formatDomain = (domain: string) => {
  return domain.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export default function ReadycheckPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [jdText, setJdText] = useState("");
  const [isParsingJd, setIsParsingJd] = useState(false);

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
    const fetchRoleKits = async () => {
      try {
        const response = await fetch("/api/interview/role-kits");
        const data = await response.json();
        if (data.success) {
          setRoleKits(data.roleKits || []);
          setFilteredRoles(data.roleKits || []);
        }
      } catch (err) {
        console.error("Error fetching role kits:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoleKits();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRoles(roleKits);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredRoles(
      roleKits.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.domain.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, roleKits]);

  const handleRoleSelect = (roleKit: RoleKit) => {
    if (!isLoggedIn) {
      sessionStorage.setItem("returnTo", `/interview/config?roleKitId=${roleKit.id}`);
      navigate("/register");
      return;
    }
    navigate(`/interview/config?roleKitId=${roleKit.id}`);
  };

  const handleJdUpload = async () => {
    if (!jdText.trim()) return;
    
    setIsParsingJd(true);
    try {
      if (!isLoggedIn) {
        sessionStorage.setItem("returnTo", "/interview/custom");
        sessionStorage.setItem("pendingJd", jdText);
        navigate("/register");
        return;
      }

      const response = await fetch("/api/interview/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jdText }),
      });
      const data = await response.json();
      
      if (data.success && data.jobTarget) {
        navigate(`/interview/config?jobTargetId=${data.jobTarget.id}`);
      } else {
        navigate("/interview/custom", { state: { jdText } });
      }
    } catch (err) {
      console.error("Error parsing JD:", err);
    } finally {
      setIsParsingJd(false);
    }
  };

  const popularRoles = roleKits.slice(0, 6);
  const domains = [...new Set(roleKits.map(r => r.domain))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042c4c] via-[#0a3d66] to-[#042c4c]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Target className="w-5 h-5 text-[#ee7e65]" />
            <span className="text-white font-semibold">Hiready</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Get Interview Ready
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Practice with AI-powered mock interviews. Get your Hiready Index score and know exactly how prepared you are.
          </p>
        </div>

        <Card className="shadow-2xl mb-8">
          <CardContent className="p-6">
            <Tabs defaultValue="roles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="roles" className="data-[state=active]:bg-white">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Roles
                </TabsTrigger>
                <TabsTrigger value="jd" className="data-[state=active]:bg-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Paste Job Description
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search roles (e.g., Product Manager, Software Engineer...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : searchQuery ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRoles.map((role) => {
                      const DomainIcon = domainIcons[role.domain] || domainIcons.default;
                      return (
                        <button
                          key={role.id}
                          onClick={() => handleRoleSelect(role)}
                          className="text-left p-4 rounded-xl border border-gray-200 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-[#042c4c]/5 rounded-lg group-hover:bg-[#ee7e65]/10">
                              <DomainIcon className="w-5 h-5 text-[#042c4c] group-hover:text-[#ee7e65]" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{role.name}</h3>
                              <p className="text-sm text-gray-500">{formatDomain(role.domain)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {filteredRoles.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No roles found. Try a different search term.
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        Popular Roles
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {popularRoles.map((role) => {
                          const DomainIcon = domainIcons[role.domain] || domainIcons.default;
                          return (
                            <button
                              key={role.id}
                              onClick={() => handleRoleSelect(role)}
                              className="text-left p-4 rounded-xl border border-gray-200 hover:border-[#ee7e65] hover:bg-[#ee7e65]/5 transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-[#042c4c]/5 rounded-lg group-hover:bg-[#ee7e65]/10">
                                  <DomainIcon className="w-5 h-5 text-[#042c4c] group-hover:text-[#ee7e65]" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">{role.name}</h3>
                                  <p className="text-sm text-gray-500">{formatDomain(role.domain)}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Browse by Domain</h3>
                      <div className="flex flex-wrap gap-2">
                        {domains.slice(0, 8).map((domain) => (
                          <Badge
                            key={domain}
                            variant="outline"
                            className="cursor-pointer hover:bg-[#042c4c] hover:text-white hover:border-[#042c4c] transition-colors py-1.5 px-3"
                            onClick={() => setSearchQuery(domain)}
                          >
                            {formatDomain(domain)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="jd" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste the Job Description
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the full job description here. We'll analyze it and create a personalized practice plan..."
                    className="w-full h-48 p-4 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#ee7e65] focus:border-transparent"
                  />
                </div>
                
                <Button 
                  onClick={handleJdUpload}
                  disabled={!jdText.trim() || isParsingJd}
                  className="w-full bg-[#ee7e65] hover:bg-[#d96a52] h-12"
                >
                  {isParsingJd ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze & Start Practice
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <Target className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white mb-1">Hiready Index</h3>
            <p className="text-sm text-white/60">Get a consolidated readiness score</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white mb-1">AI Feedback</h3>
            <p className="text-sm text-white/60">Detailed improvement suggestions</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ee7e65]/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-[#ee7e65]" />
            </div>
            <h3 className="font-medium text-white mb-1">1 Free Interview</h3>
            <p className="text-sm text-white/60">Try before you buy</p>
          </div>
        </div>

        <div className="text-center text-white/60 text-sm">
          <p>
            Already practicing?{" "}
            <Link to="/login" className="text-[#ee7e65] hover:underline">
              Log in
            </Link>
            {" "}to continue your progress.
          </p>
        </div>
      </div>
    </div>
  );
}
