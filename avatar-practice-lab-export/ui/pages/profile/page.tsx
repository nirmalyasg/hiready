import { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Check, Loader2, Sparkles, Briefcase, Code, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileLayout from './profile-layout';

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
  const { isAuthenticated } = useAuth();
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

      if (uploadData.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/interview/documents'] });
        queryClient.invalidateQueries({ queryKey: ['/api/interview/user-profile'] });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ProfileLayout activeTab="profile">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#000000] mb-1">My Profile</h2>
          <p className="text-gray-500">Manage your resume and professional information</p>
        </div>

        {/* Resume Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
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
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
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
                      <p className="font-semibold text-[#000000]">{project.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {project.technologies.map((tech, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
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
      </div>
    </ProfileLayout>
  );
}
