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

const domainColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  software: { bg: "bg-slate-900", text: "text-slate-900", border: "border-slate-900", light: "bg-slate-50" },
  data: { bg: "bg-[#cb6ce6]", text: "text-[#cb6ce6]", border: "border-[#cb6ce6]", light: "bg-purple-50" },
  product: { bg: "bg-[#24c4b8]", text: "text-[#24c4b8]", border: "border-[#24c4b8]", light: "bg-teal-50" },
  design: { bg: "bg-amber-500", text: "text-amber-600", border: "border-amber-500", light: "bg-amber-50" },
  sales: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-500", light: "bg-emerald-50" },
  marketing: { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-500", light: "bg-rose-50" },
  customer_success: { bg: "bg-sky-500", text: "text-sky-600", border: "border-sky-500", light: "bg-sky-50" },
  operations: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-500", light: "bg-orange-50" },
  consulting: { bg: "bg-indigo-500", text: "text-indigo-600", border: "border-indigo-500", light: "bg-indigo-50" },
  finance: { bg: "bg-green-600", text: "text-green-600", border: "border-green-600", light: "bg-green-50" },
  hr: { bg: "bg-pink-500", text: "text-pink-600", border: "border-pink-500", light: "bg-pink-50" },
  recruiting: { bg: "bg-violet-500", text: "text-violet-600", border: "border-violet-500", light: "bg-violet-50" },
  engineering_management: { bg: "bg-slate-700", text: "text-slate-700", border: "border-slate-700", light: "bg-slate-50" },
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

  const getColors = (domain: string) => domainColors[domain] || { bg: "bg-slate-500", text: "text-slate-600", border: "border-slate-500", light: "bg-slate-50" };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#fbfbfc]">
          <LoadingSpinner />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="bg-gradient-to-br from-[#000000] via-[#000000] to-[#1a1a2e] text-white py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#24c4b8] flex items-center justify-center shadow-lg shadow-[#24c4b8]/30">
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
                className="pl-12 h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-[#24c4b8]"
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
                    ? "bg-[#24c4b8] text-white" 
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                All ({roleKits.length})
              </button>
              {allDomains.map(domain => {
                const count = roleKits.filter(r => r.domain === domain).length;
                const colors = getColors(domain);
                return (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedDomain === domain 
                        ? `${colors.bg} text-white` 
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
            <p className="text-sm text-slate-500">
              Showing {filteredRoles.length} of {roleKits.length} roles
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedDomain && ` in ${formatDomain(selectedDomain)}`}
            </p>
          )}

          {Object.entries(groupedByDomain).map(([domain, roles]) => {
            const colors = getColors(domain);
            return (
              <section key={domain}>
                <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${colors.border}`}>
                  <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-lg font-bold ${colors.text}`}>
                      {formatDomain(domain)}
                    </h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} text-white`}>
                    {roles.length} {roles.length === 1 ? 'role' : 'roles'}
                  </span>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => navigate(`/interview/role/${role.id}`)}
                      className={`w-full bg-white rounded-xl border-l-4 ${colors.border} border border-l-4 border-slate-200 p-4 text-left hover:shadow-lg hover:border-slate-300 transition-all group`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 group-hover:text-[#24c4b8] transition-colors">
                              {role.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.light} ${colors.text} font-medium`}>
                              {formatDomain(role.domain)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">
                              {role.level}
                            </span>
                          </div>
                          {role.description && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{role.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#24c4b8] transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}

          {filteredRoles.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No roles found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {searchTerm 
                  ? `No roles match "${searchTerm}". Try searching for "Product", "Data", or "Software".`
                  : "No roles available in this category."}
              </p>
              {(searchTerm || selectedDomain) && (
                <button
                  onClick={() => { setSearchTerm(""); setSelectedDomain(null); }}
                  className="mt-4 px-4 py-2 bg-[#24c4b8] text-white rounded-lg font-medium hover:bg-[#1db0a5] transition-colors"
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
