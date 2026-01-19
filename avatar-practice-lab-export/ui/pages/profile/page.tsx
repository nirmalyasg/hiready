import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, ChevronRight, Settings, HelpCircle, Shield, FileText, Upload, Trash2, Check, Loader2, Sparkles, Briefcase, Code, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SidebarLayout from '@/components/layout/sidebar-layout';

interface UserDocument {
  id: number;
  fileName: string;
  docType: string;
  mimeType: string;
  createdAt: string;
}

interface WorkHistoryItem {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
  impact: string;
}

interface RiskFlag {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface ExtractedProfile {
  headline: string | null;
  workHistory: WorkHistoryItem[] | null;
  projects: ProjectItem[] | null;
  skills: string[] | null;
  riskFlags: RiskFlag[] | null;
  updatedAt: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ['/api/interview/documents', 'resume'],
    queryFn: async () => {
      const res = await fetch('/api/interview/documents?docType=resume');
      const data = await res.json();
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/interview/user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/interview/user-profile');
      const data = await res.json();
      return data;
    },
    enabled: isAuthenticated,
  });

  const latestResume = documentsData?.documents?.[0] as UserDocument | undefined;
  const extractedProfile = profileData?.profile as ExtractedProfile | null;

  const deleteMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await fetch(`/api/interview/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview/documents'] });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', 'resume');

      const uploadRes = await fetch('/api/interview/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.document?.id) {
        await fetch(`/api/interview/documents/${uploadData.document.id}/parse`, {
          method: 'POST',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/interview/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/interview/user-profile'] });
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#24c4b8] border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: Settings, label: 'Settings', description: 'Preferences and account settings' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get help with your account' },
    { icon: Shield, label: 'Privacy', description: 'Manage your privacy settings' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="bg-gradient-to-br from-[#000000] via-[#1a0a2e] to-[#000000] text-white">
          <div className="max-w-lg mx-auto px-4 py-10 text-center">
            <div className="relative inline-block mb-4">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || 'User'}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#24c4b8] to-[#1db0a5] flex items-center justify-center ring-4 ring-white/20">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#24c4b8] rounded-full flex items-center justify-center border-2 border-[#000000]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">
              {user.firstName || user.username || 'User'}
            </h1>
            {user.email && (
              <p className="text-white/70 flex items-center justify-center gap-2 mt-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-6 pb-8 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#000000] flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#24c4b8] to-[#1db0a5] rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                My Resume
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#cb6ce6]" />
              </div>
            ) : latestResume ? (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#000000] truncate">{latestResume.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Uploaded {formatDate(latestResume.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#000000] bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Replace
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(latestResume.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-[#cb6ce6]" />
                </div>
                <p className="text-gray-500 mb-4">
                  No resume uploaded yet
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#24c4b8] rounded-xl hover:bg-[#1db0a5] transition-colors shadow-lg shadow-[#24c4b8]/25 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Resume
                </button>
                <p className="text-xs text-[#cb6ce6] mt-3">
                  PDF, DOC, DOCX, or TXT
                </p>
              </div>
            )}
          </div>

          {/* Extracted Profile Section */}
          {extractedProfile && (
            <div className="bg-white rounded-2xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-[#000000]">AI-Extracted Profile</h3>
              </div>

              {/* Headline */}
              {extractedProfile.headline && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Professional Summary</p>
                  <p className="text-[#000000] font-medium">{extractedProfile.headline}</p>
                </div>
              )}

              {/* Skills */}
              {extractedProfile.skills && extractedProfile.skills.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-[#24c4b8]" />
                    <p className="text-sm font-semibold text-slate-700">Skills</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {extractedProfile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-[#24c4b8]/10 text-[#24c4b8] rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work History */}
              {extractedProfile.workHistory && extractedProfile.workHistory.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-[#cb6ce6]" />
                    <p className="text-sm font-semibold text-slate-700">Work Experience</p>
                  </div>
                  <div className="space-y-3">
                    {extractedProfile.workHistory.map((job, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-[#000000]">{job.role}</p>
                            <p className="text-sm text-slate-600">{job.company}</p>
                          </div>
                          <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                            {job.duration}
                          </span>
                        </div>
                        {job.highlights && job.highlights.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {job.highlights.slice(0, 3).map((highlight, hIdx) => (
                              <li key={hIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-[#24c4b8] mt-1">•</span>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {extractedProfile.projects && extractedProfile.projects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-slate-700">Key Projects</p>
                  </div>
                  <div className="space-y-3">
                    {extractedProfile.projects.map((project, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="font-semibold text-[#000000] mb-1">{project.name}</p>
                        <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {project.technologies.map((tech, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 bg-white text-slate-600 rounded text-xs border border-slate-200"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {project.impact && (
                          <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {project.impact}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Flags (if any) */}
              {extractedProfile.riskFlags && extractedProfile.riskFlags.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">Areas to Address</p>
                  </div>
                  <ul className="space-y-1">
                    {extractedProfile.riskFlags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-amber-700">
                        • {flag.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {profileLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#cb6ce6]" />
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group ${
                    index !== menuItems.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-[#000000]/10 group-hover:to-[#000000]/5 transition-colors">
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-[#000000] transition-colors" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-[#000000] block">{item.label}</span>
                    <span className="text-sm text-gray-500">{item.description}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#cb6ce6] group-hover:text-[#24c4b8] group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors shadow-xl shadow-slate-200/50 border border-slate-100 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="flex-1 text-left font-semibold text-red-500">Sign Out</span>
            <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
