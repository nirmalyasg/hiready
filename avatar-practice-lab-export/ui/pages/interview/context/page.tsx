import { useState, useEffect, useRef } from "react";
import { ChevronRight, Upload, FileText, X, Check, AlertCircle, Loader2, Briefcase, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RoleKit {
  id: number;
  name: string;
  level: string;
  domain: string;
  description: string | null;
  skillsFocus: string[] | null;
}

interface UploadedDoc {
  id: number;
  fileName: string;
  docType: string;
  textLength: number;
  parsed?: boolean;
}

export default function InterviewContextPage() {
  const [searchParams] = useSearchParams();
  const roleKitId = searchParams.get("roleKitId");
  const navigate = useNavigate();

  const [roleKit, setRoleKit] = useState<RoleKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeDoc, setResumeDoc] = useState<UploadedDoc | null>(null);
  const [jdDoc, setJdDoc] = useState<UploadedDoc | null>(null);
  const [uploading, setUploading] = useState<{ resume: boolean; jd: boolean }>({ resume: false, jd: false });
  const [parsing, setParsing] = useState<{ resume: boolean; jd: boolean }>({ resume: false, jd: false });
  const [interviewType, setInterviewType] = useState<string>("hr");
  const [style, setStyle] = useState<string>("neutral");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRoleKit = async () => {
      if (!roleKitId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/interview/role-kits/${roleKitId}`);
        const data = await response.json();
        if (data.success) {
          setRoleKit(data.roleKit);
        }
      } catch (error) {
        console.error("Error fetching role kit:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoleKit();
  }, [roleKitId]);

  const handleFileUpload = async (file: File, docType: "resume" | "job_description") => {
    const uploadKey = docType === "resume" ? "resume" : "jd";
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const response = await fetch("/api/interview/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const doc: UploadedDoc = {
        id: data.document.id,
        fileName: data.document.fileName,
        docType: data.document.docType,
        textLength: data.document.textLength,
        parsed: false,
      };

      if (docType === "resume") {
        setResumeDoc(doc);
      } else {
        setJdDoc(doc);
      }

      setParsing((prev) => ({ ...prev, [uploadKey]: true }));
      const parseResponse = await fetch(`/api/interview/documents/${doc.id}/parse`, {
        method: "POST",
      });
      const parseData = await parseResponse.json();
      
      if (parseData.success) {
        if (docType === "resume") {
          setResumeDoc((prev) => prev ? { ...prev, parsed: true } : null);
        } else {
          setJdDoc((prev) => prev ? { ...prev, parsed: true } : null);
        }
      }
    } catch (error: any) {
      setError(error.message || "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [uploadKey]: false }));
      setParsing((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, docType: "resume" | "job_description") => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, docType);
  };

  const handleProceed = async () => {
    if (!resumeDoc) {
      setError("Please upload your resume first");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const configResponse = await fetch("/api/interview/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleKitId: roleKitId ? parseInt(roleKitId) : null,
          resumeDocId: resumeDoc.id,
          jdDocId: jdDoc?.id || null,
          interviewType,
          style,
          seniority: roleKit?.level || "entry",
        }),
      });

      const configData = await configResponse.json();
      if (!configData.success) throw new Error(configData.error);

      const planResponse = await fetch(`/api/interview/config/${configData.config.id}/plan`, {
        method: "POST",
      });

      const planData = await planResponse.json();
      if (!planData.success) throw new Error(planData.error);

      navigate(`/interview/pre-session?configId=${configData.config.id}&planId=${planData.plan.id}`);
    } catch (error: any) {
      setError(error.message || "Failed to create interview plan");
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
        <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
            <Link
              to="/interview"
              className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Role Selection
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Step 2 of 4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Upload Your Context
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {roleKit ? (
                <>Preparing for <span className="font-medium text-indigo-600">{roleKit.name}</span>. Upload your resume and optionally the job description for a personalized interview.</>
              ) : (
                <>Upload your resume and optionally the job description for a personalized interview experience.</>
              )}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Resume <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {resumeDoc ? (
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{resumeDoc.fileName}</p>
                        <p className="text-xs text-slate-500">
                          {resumeDoc.parsed ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="w-3 h-3" /> Parsed successfully
                            </span>
                          ) : parsing.resume ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                            </span>
                          ) : (
                            `${resumeDoc.textLength} characters extracted`
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeDoc(null)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "resume")}
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "resume");
                      }}
                    />
                    {uploading.resume ? (
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    )}
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {uploading.resume ? "Uploading..." : "Drop your resume here"}
                    </p>
                    <p className="text-xs text-slate-500">PDF, DOCX, or TXT (max 10MB)</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Job Description <span className="text-slate-400 text-sm font-normal">(Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {jdDoc ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{jdDoc.fileName}</p>
                        <p className="text-xs text-slate-500">
                          {jdDoc.parsed ? (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Check className="w-3 h-3" /> Parsed successfully
                            </span>
                          ) : parsing.jd ? (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                            </span>
                          ) : (
                            `${jdDoc.textLength} characters extracted`
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJdDoc(null)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, "job_description")}
                    onClick={() => jdInputRef.current?.click()}
                  >
                    <input
                      ref={jdInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "job_description");
                      }}
                    />
                    {uploading.jd ? (
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    )}
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {uploading.jd ? "Uploading..." : "Drop job description here"}
                    </p>
                    <p className="text-xs text-slate-500">Helps personalize questions to the specific role</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Interview Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Interview Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "hr", label: "HR / Recruiter" },
                      { value: "hiring_manager", label: "Hiring Manager" },
                      { value: "technical", label: "Technical" },
                      { value: "panel", label: "Panel" },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        variant={interviewType === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setInterviewType(type.value)}
                        className="rounded-full"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Interviewer Style</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "friendly", label: "Friendly", desc: "Warm & supportive" },
                      { value: "neutral", label: "Neutral", desc: "Professional" },
                      { value: "stress", label: "Challenging", desc: "Tough questions" },
                    ].map((s) => (
                      <Button
                        key={s.value}
                        variant={style === s.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStyle(s.value)}
                        className="rounded-full"
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleProceed}
              disabled={!resumeDoc || creating || parsing.resume || parsing.jd}
              className="rounded-xl px-8"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Interview Plan...
                </>
              ) : (
                "Continue to Preview"
              )}
            </Button>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </ModernDashboardLayout>
  );
}
