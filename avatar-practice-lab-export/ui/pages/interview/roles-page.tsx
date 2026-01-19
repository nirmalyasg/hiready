import { useState, useEffect } from "react";
import { Users, ChevronRight, Search } from "lucide-react";
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

export default function InterviewRolesPage() {
  const navigate = useNavigate();
  const [roleKits, setRoleKits] = useState<RoleKit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredRoles = roleKits.filter(role => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(term) ||
      role.domain.toLowerCase().includes(term) ||
      role.level.toLowerCase().includes(term) ||
      (role.description && role.description.toLowerCase().includes(term))
    );
  });

  const groupedByDomain = filteredRoles.reduce((acc, role) => {
    if (!acc[role.domain]) acc[role.domain] = [];
    acc[role.domain].push(role);
    return acc;
  }, {} as Record<string, RoleKit[]>);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          
          <section className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#24c4b8] flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Role Library
            </h1>
            <p className="text-slate-500 text-sm sm:text-base mb-6">
              Practice interviews for any role with our curated templates
            </p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200 focus:border-[#24c4b8] focus:ring-[#24c4b8]/20"
              />
            </div>
          </section>

          {Object.entries(groupedByDomain).map(([domain, roles]) => (
            <section key={domain}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${domainColors[domain] || 'bg-slate-400'}`} />
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  {formatDomain(domain)}
                </h2>
                <span className="text-xs text-slate-400">({roles.length})</span>
              </div>
              
              <div className="grid gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => navigate(`/interview/role/${role.id}`)}
                    className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-[#24c4b8] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate">{role.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize flex-shrink-0">
                            {role.level}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-sm text-slate-500 line-clamp-1">{role.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#24c4b8] transition-colors flex-shrink-0 ml-3" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No roles found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
