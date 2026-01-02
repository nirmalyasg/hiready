import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, ChevronRight, Settings, HelpCircle, Shield, FileText, Upload, Trash2, Check, Loader2 } from 'lucide-react';
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

  const latestResume = documentsData?.documents?.[0] as UserDocument | undefined;

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
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const menuItems = [
    { icon: Settings, label: 'Settings', onClick: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
    { icon: Shield, label: 'Privacy', onClick: () => {} },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SidebarLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-brand-dark mb-6 lg:mb-8">Profile</h1>
        
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-4">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.firstName || 'User'}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center">
                <User className="w-8 h-8 text-brand-accent" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-brand-dark truncate">
                {user.firstName || user.username || 'User'}
              </h2>
              {user.email && (
                <p className="text-sm text-brand-muted flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-dark flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-accent" />
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
              <Loader2 className="w-5 h-5 animate-spin text-brand-muted" />
            </div>
          ) : latestResume ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-brand-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-dark truncate">{latestResume.fileName}</p>
                  <p className="text-sm text-brand-muted">
                    Uploaded {formatDate(latestResume.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand-dark bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
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
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-brand-muted mb-4">
                No resume uploaded yet
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-accent rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Resume
              </button>
              <p className="text-xs text-brand-muted mt-2">
                PDF, DOC, DOCX, or TXT
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-muted" />
                </div>
                <span className="flex-1 text-left font-medium text-brand-dark">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-red-50 transition-colors shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="flex-1 text-left font-medium text-red-500">Sign Out</span>
        </button>
      </div>
    </SidebarLayout>
  );
}
