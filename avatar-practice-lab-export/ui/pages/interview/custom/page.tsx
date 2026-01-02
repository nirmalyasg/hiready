import { useState, useRef, useEffect } from "react";
import { ChevronRight, Upload, FileText, X, Check, AlertCircle, Loader2, Briefcase, Settings, Link2, ClipboardPaste, Plus, Building2, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

interface UploadedDoc {
  id: number;
  fileName: string;
  docType: string;
  textLength: number;
  parsed?: boolean;
}

interface JobTarget {
  id: string;
  roleTitle: string;
  companyName: string | null;
  location: string | null;
  status: string;
  jdText: string | null;
  jdParsed: any;
  lastResumeDocId: number | null;
}

type AddJobMode = "url" | "manual" | null;

export default function InterviewCustomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedJobId = searchParams.get("jobTargetId");

  const [step, setStep] = useState<1 | 2>(preSelectedJobId ? 2 : 1);
  const [selectedJobTargetId, setSelectedJobTargetId] = useState<string | null>(preSelectedJobId);
  const [selectedJob, setSelectedJob] = useState<JobTarget | null>(null);
  const [savedJobs, setSavedJobs] = useState<JobTarget[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [addJobMode, setAddJobMode] = useState<AddJobMode>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [jdPasteText, setJdPasteText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [addingJob, setAddingJob] = useState(false);
  const [addJobError, setAddJobError] = useState<string | null>(null);

  const [resumeDoc, setResumeDoc] = useState<UploadedDoc | null>(null);
  const [savedResume, setSavedResume] = useState<UploadedDoc | null>(null);
  const [resumeChoice, setResumeChoice] = useState<"saved" | "new" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [interviewType, setInterviewType] = useState<string>("hr");
  const [style, setStyle] = useState<string>("neutral");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSavedJobs();
    fetchSavedResume();
  }, []);

  const fetchSavedResume = async () => {
    try {
      const response = await fetch("/api/interview/documents?docType=resume");
      const data = await response.json();
      if (data.success && data.documents?.length > 0) {
        const latest = data.documents[0];
        setSavedResume({
          id: latest.id,
          fileName: latest.fileName,
          docType: latest.docType,
          textLength: 0,
          parsed: true,
        });
        setResumeDoc({
          id: latest.id,
          fileName: latest.fileName,
          docType: latest.docType,
          textLength: 0,
          parsed: true,
        });
        setResumeChoice("saved");
      }
    } catch (e) {
      console.error("Failed to fetch saved resume:", e);
    }
  };

  useEffect(() => {
    if (preSelectedJobId && savedJobs.length > 0) {
      const job = savedJobs.find(j => j.id === preSelectedJobId);
      if (job) {
        setSelectedJob(job);
        setSelectedJobTargetId(job.id);
      }
    }
  }, [preSelectedJobId, savedJobs]);

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      if (data.success) {
        setSavedJobs(data.jobs.filter((j: JobTarget) => j.status !== "archived"));
      }
    } catch (e) {
      console.error("Failed to fetch jobs:", e);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSelectJob = (job: JobTarget) => {
    setSelectedJob(job);
    setSelectedJobTargetId(job.id);
    setAddJobMode(null);
  };

  const handleAddJobViaUrl = async () => {
    if (!linkedinUrl.trim()) {
      setAddJobError("Please enter a job URL");
      return;
    }

    setAddingJob(true);
    setAddJobError(null);

    try {
      const response = await fetch("/api/jobs/job-targets/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setSavedJobs(prev => [data.job, ...prev]);
      handleSelectJob(data.job);
      setLinkedinUrl("");
    } catch (e: any) {
      setAddJobError(e.message || "Failed to import job from URL");
    } finally {
      setAddingJob(false);
    }
  };

  const handleAddJobViaPaste = async () => {
    if (!jdPasteText.trim()) {
      setAddJobError("Please paste the job description");
      return;
    }

    setAddingJob(true);
    setAddJobError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: "Job from Paste",
          jdText: jdPasteText,
          source: "manual",
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setSavedJobs(prev => [data.job, ...prev]);
      handleSelectJob(data.job);
      setJdPasteText("");
    } catch (e: any) {
      setAddJobError(e.message || "Failed to create job");
    } finally {
      setAddingJob(false);
    }
  };

  const handleAddJobManual = async () => {
    if (!manualTitle.trim()) {
      setAddJobError("Please enter a job title");
      return;
    }

    setAddingJob(true);
    setAddJobError(null);

    try {
      const response = await fetch("/api/jobs/job-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: manualTitle,
          companyName: manualCompany || null,
          location: manualLocation || null,
          jdText: jdPasteText.trim() || null,
          source: "manual",
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setSavedJobs(prev => [data.job, ...prev]);
      handleSelectJob(data.job);
      setManualTitle("");
      setManualCompany("");
      setManualLocation("");
      setJdPasteText("");
    } catch (e: any) {
      setAddJobError(e.message || "Failed to create job");
    } finally {
      setAddingJob(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", "resume");

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

      setResumeDoc(doc);

      setParsing(true);
      const parseResponse = await fetch(`/api/interview/documents/${doc.id}/parse`, {
        method: "POST",
      });
      const parseData = await parseResponse.json();

      if (parseData.success) {
        setResumeDoc(prev => prev ? { ...prev, parsed: true } : null);
      }
    } catch (error: any) {
      setError(error.message || "Upload failed");
    } finally {
      setUploading(false);
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
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
          roleKitId: null,
          resumeDocId: resumeDoc.id,
          jdDocId: null,
          interviewType,
          style,
          seniority: "entry",
          mode: "custom",
          jobTargetId: selectedJobTargetId,
        }),
      });

      const configData = await configResponse.json();
      if (!configData.success) throw new Error(configData.error);

      if (selectedJobTargetId) {
        await fetch(`/api/jobs/job-targets/${selectedJobTargetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastResumeDocId: resumeDoc.id }),
        });
      }

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

  const goToStep2 = () => {
    if (!selectedJobTargetId) {
      setAddJobError("Please select or add a job target first");
      return;
    }
    setStep(2);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white pb-24 sm:pb-8">
        <div className="bg-gradient-to-br from-indigo-500/5 via-white to-purple-50/30 border-b border-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
            <Link
              to="/interview"
              className="inline-flex items-center text-slate-500 hover:text-emerald-600 mb-4 text-sm font-medium transition-colors group"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1 group-hover:-translate-x-0.5 transition-transform" />
              Back to Interview Lab
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Custom Interview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {step === 1 ? "Select Your Target Job" : "Configure Your Interview"}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {step === 1
                ? "Choose a job you're preparing for, or add a new one."
                : "Upload your resume and customize interview settings."}
            </p>

            <div className="flex items-center gap-2 mt-6">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
                Select Job
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === 2 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
                Configure
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
          {step === 1 ? (
            <>
              {addJobError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{addJobError}</p>
                </div>
              )}

              {loadingJobs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {savedJobs.length > 0 && (
                    <Card className="border-slate-200 rounded-2xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                          Your Saved Jobs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {savedJobs.map((job) => (
                            <button
                              key={job.id}
                              onClick={() => handleSelectJob(job)}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                selectedJobTargetId === job.id
                                  ? "border-emerald-500 bg-emerald-50"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{job.roleTitle}</p>
                                  {job.companyName && (
                                    <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                      <Building2 className="w-3.5 h-3.5" />
                                      {job.companyName}
                                    </p>
                                  )}
                                  {job.location && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" />
                                      {job.location}
                                    </p>
                                  )}
                                </div>
                                {selectedJobTargetId === job.id && (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-slate-200 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Plus className="w-5 h-5 text-emerald-600" />
                        Add New Job Target
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        <button
                          onClick={() => setAddJobMode("url")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            addJobMode === "url"
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <Link2 className={`w-5 h-5 mb-2 ${addJobMode === "url" ? "text-emerald-600" : "text-slate-400"}`} />
                          <p className="font-medium text-sm text-slate-900">Import from URL</p>
                          <p className="text-xs text-slate-500 mt-1">LinkedIn, Indeed, Glassdoor, Naukri, etc.</p>
                        </button>

                        <button
                          onClick={() => setAddJobMode("manual")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            addJobMode === "manual"
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <FileText className={`w-5 h-5 mb-2 ${addJobMode === "manual" ? "text-emerald-600" : "text-slate-400"}`} />
                          <p className="font-medium text-sm text-slate-900">Enter Manually</p>
                          <p className="text-xs text-slate-500 mt-1">Type title, company, location & JD</p>
                        </button>
                      </div>

                      {addJobMode === "url" && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Job URL</Label>
                            <Input
                              placeholder="https://linkedin.com/jobs/... or https://indeed.com/..."
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              className="rounded-xl"
                            />
                            <p className="text-xs text-slate-500 mt-2">We'll extract the job title, company, and description automatically</p>
                          </div>
                          <Button
                            onClick={handleAddJobViaUrl}
                            disabled={addingJob}
                            className="rounded-xl"
                          >
                            {addingJob ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Link2 className="w-4 h-4 mr-2" />
                                Import Job
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {addJobMode === "manual" && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Job Title *</Label>
                            <Input
                              placeholder="e.g., Senior Product Manager"
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Company</Label>
                              <Input
                                placeholder="e.g., Google"
                                value={manualCompany}
                                onChange={(e) => setManualCompany(e.target.value)}
                                className="rounded-xl"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Location</Label>
                              <Input
                                placeholder="e.g., Remote, NYC"
                                value={manualLocation}
                                onChange={(e) => setManualLocation(e.target.value)}
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Job Description</Label>
                            <Textarea
                              placeholder="Paste the full job description here (optional, helps with practice focus)..."
                              value={jdPasteText}
                              onChange={(e) => setJdPasteText(e.target.value)}
                              className="rounded-xl min-h-[120px]"
                            />
                          </div>
                          <Button
                            onClick={handleAddJobManual}
                            disabled={addingJob}
                            className="rounded-xl"
                          >
                            {addingJob ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Job
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={goToStep2}
                      disabled={!selectedJobTargetId}
                      className="rounded-xl px-8"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <div className="grid gap-6">
                {selectedJob && (
                  <Card className="border-emerald-200 bg-emerald-50/50 rounded-2xl overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{selectedJob.roleTitle}</p>
                            {selectedJob.companyName && (
                              <p className="text-sm text-slate-600">{selectedJob.companyName}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStep(1)}
                          className="rounded-lg"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Resume <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {savedResume && !resumeDoc && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{savedResume.fileName}</p>
                            <p className="text-xs text-blue-600">Saved in your profile</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setResumeDoc(savedResume);
                              setResumeChoice("saved");
                            }}
                            className="flex-1 rounded-lg"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Use This Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResumeChoice("new");
                              resumeInputRef.current?.click();
                            }}
                            className="flex-1 rounded-lg"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload New
                          </Button>
                        </div>
                      </div>
                    )}

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
                                  <Check className="w-3 h-3" /> {resumeChoice === "saved" ? "Using saved resume" : "Parsed successfully"}
                                </span>
                              ) : parsing ? (
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
                          onClick={() => {
                            setResumeDoc(null);
                            setResumeChoice(null);
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : !savedResume && (
                      <div
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => resumeInputRef.current?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                        ) : (
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        )}
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          {uploading ? "Uploading..." : "Drop your resume here"}
                        </p>
                        <p className="text-xs text-slate-500">PDF, DOCX, or TXT (max 10MB)</p>
                      </div>
                    )}

                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setResumeChoice("new");
                          handleFileUpload(file);
                        }
                      }}
                    />
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

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleProceed}
                  disabled={!resumeDoc || creating || parsing}
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
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
