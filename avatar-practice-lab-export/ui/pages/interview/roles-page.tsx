import { useState, useEffect } from "react";
import { Users, ChevronRight, Search, Briefcase, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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

const domainIcons: Record<string, string> = {
  software: "💻",
  data: "📊",
  product: "🎯",
  design: "🎨",
  sales: "💼",
  marketing: "📢",
  customer_success: "🤝",
  operations: "⚙️",
  consulting: "📋",
  finance: "💰",
  hr: "👥",
  recruiting: "🔍",
  engineering_management: "👔",
};

const formatDomain = (domain: string) => {
  return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function InterviewRolesPage() {
  const navigate = useNavigate();
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/interview/role-kits");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRoleKits(data.roleKits);
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const allDomains = [...new Set(roleKits.map(r => r.domain))];

  const filteredRoles = roleKits.filter(role => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = !selectedDomain || role.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const groupedByDomain = filteredRoles.reduce((acc, role) => {
    if (!acc[role.domain]) acc[role.domain] = [];
    acc[role.domain].push(role);
    return acc;
  }, {} as Record<string, RoleKit[]>);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="bg-gradient-to-br from-[#042c4c] via-[#042c4c] to-[#063d5c] text-white py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ee7e65] flex items-center justify-center shadow-lg shadow-[#ee7e65]/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Role Library</h1>
                <p className="text-white/60 text-sm mt-1">
                  {roleKits.length} roles across {allDomains.length} domains
                </p>
              </div>
            </div>

            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Search roles by name, domain, or level..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-[#ee7e65]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedDomain(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedDomain 
                    ? "bg-[#ee7e65] text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                All ({roleKits.length})
              </button>
              {allDomains.map(domain => {
                const count = roleKits.filter(r => r.domain === domain).length;
                return (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedDomain === domain 
                        ? "bg-[#ee7e65] text-white" 
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {formatDomain(domain)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {filteredRoles.length > 0 && (
            <p className="text-sm text-[#6c8194]">
              Showing {filteredRoles.length} of {roleKits.length} roles
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedDomain && ` in ${formatDomain(selectedDomain)}`}
            </p>
          )}

          {Object.entries(groupedByDomain).map(([domain, roles]) => {
            const icon = domainIcons[domain] || "📁";
            return (
              <section key={domain}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#768c9c]/30">
                  <div className="w-10 h-10 bg-[#042c4c] rounded-2xl flex items-center justify-center text-lg">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#042c4c]">
                      {formatDomain(domain)}
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[#042c4c] text-white">
                    {roles.length} {roles.length === 1 ? 'role' : 'roles'}
                  </span>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => navigate(`/interview/role/${role.id}`)}
                      className="w-full bg-white rounded-2xl border border-[#768c9c]/20 p-4 text-left hover:shadow-lg hover:border-[#ee7e65]/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-[#042c4c] group-hover:text-[#ee7e65] transition-colors">
                              {role.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f9fb] text-[#6c8194] font-medium border border-[#768c9c]/20">
                              {formatDomain(role.domain)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f8f9fb] text-[#6c8194] capitalize border border-[#768c9c]/20">
                              {role.level}
                            </span>
                          </div>
                          {role.description && (
                            <p className="text-sm text-[#6c8194] mt-2 line-clamp-2">{role.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#768c9c] group-hover:text-[#ee7e65] transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}

          {filteredRoles.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#768c9c]/20">
              <div className="w-16 h-16 bg-[#f8f9fb] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#768c9c]" />
              </div>
              <h3 className="text-lg font-semibold text-[#042c4c] mb-2">No roles found</h3>
              <p className="text-[#6c8194] max-w-sm mx-auto">
                {searchTerm 
                  ? `No roles match "${searchTerm}". Try searching for "Product", "Data", or "Software".`
                  : "No roles available in this category."}
              </p>
              {(searchTerm || selectedDomain) && (
                <button
                  onClick={() => { setSearchTerm(""); setSelectedDomain(null); }}
                  className="mt-4 px-4 py-2 bg-[#ee7e65] text-white rounded-2xl font-medium hover:bg-[#e06d54] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
