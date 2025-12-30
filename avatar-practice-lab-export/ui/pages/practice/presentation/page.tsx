import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, FileText, Loader2, Check, Presentation, Users, Download, AlertCircle, Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceInputField } from "@/components/ui/voice-input";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";

interface SlidePreview {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
}

interface UploadedPresentation {
  id: number;
  fileName: string;
  totalSlides: number;
  slides: SlidePreview[];
  topic: string;
  fileUrl?: string;
}

export default function PresentationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<UploadedPresentation | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf')) {
        setUploadError("Please upload a PDF file");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !topic.trim()) {
      setUploadError("Please provide both a topic and a presentation file");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("topic", topic.trim());
      if (context.trim()) {
        formData.append("context", context.trim());
      }

      const response = await fetch("/api/avatar/presentation/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload presentation");
      }

      const data = await response.json();
      setPresentation({
        id: data.presentation.id,
        fileName: data.presentation.fileName,
        totalSlides: data.presentation.totalSlides,
        slides: data.presentation.slides,
        topic: topic.trim(),
      });
      
      // Use proxy URL for PDF preview (avoids CORS issues with S3)
      setSignedPdfUrl(`/api/avatar/presentation/view/${data.presentation.id}`);
      
      setStep("preview");
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Failed to upload presentation");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartPractice = () => {
    if (presentation) {
      navigate(`/avatar/practice/presentation/avatar-select?presentationId=${presentation.id}`);
    }
  };

  return (
    <ModernDashboardLayout>
      <div className="min-h-screen pb-32 sm:pb-8">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-3xl">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <button
              onClick={() => step === "upload" ? navigate("/avatar/start") : setStep("upload")}
              className="flex items-center gap-1.5 sm:gap-2 text-brand-dark/60 hover:text-brand-dark text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {["upload", "preview"].map((s, i) => (
                <div key={s} className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step === s ? "bg-brand-accent text-white" :
                    ["upload", "preview"].indexOf(step) > i ? "bg-brand-primary text-white" :
                    "bg-brand-light/30 text-brand-dark/60"
                  }`}>
                    {["upload", "preview"].indexOf(step) > i ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : i + 1}
                  </div>
                  {i < 1 && <div className="w-6 sm:w-12 h-0.5 bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>

          {step === "upload" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-accent/10 text-brand-accent px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                  <Presentation className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Presentation Practice
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-1.5 sm:mb-2">
                  Practice your presentation
                </h1>
                <p className="text-sm sm:text-base text-brand-dark/60">
                  Upload your PDF slides and practice presenting to a virtual audience.
                </p>
              </div>

              <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <VoiceInputField
                    label="Presentation Topic"
                    value={topic}
                    onChange={setTopic}
                    placeholder="e.g., Q4 Sales Strategy, Product Launch... (or tap mic to speak)"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-brand-dark mb-1.5 sm:mb-2">
                    Context <span className="text-brand-dark/40 font-normal">(optional)</span>
                  </label>
                  <VoiceInputField
                    value={context}
                    onChange={setContext}
                    placeholder="e.g., First presentation to a new client... (or tap mic to speak)"
                    multiline
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1.5 sm:mb-2">
                    Upload Slides
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-all ${
                      selectedFile 
                        ? "border-brand-accent/50 bg-brand-accent/10" 
                        : "border-brand-light/30 hover:border-brand-accent hover:bg-brand-accent/5"
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-brand-accent" />
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-medium text-brand-dark text-sm sm:text-base truncate">{selectedFile.name}</p>
                          <p className="text-xs sm:text-sm text-brand-dark/50">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-brand-light mx-auto mb-2 sm:mb-3" />
                        <p className="text-brand-dark font-medium text-sm sm:text-base">
                          Tap to upload PDF
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">
                    {uploadError}
                  </div>
                )}
              </Card>

              <div className="hidden sm:block bg-slate-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-slate-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900">Virtual Audience Experience</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      You'll present to AI avatars who ask questions and react naturally.
                    </p>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-14 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 sm:bottom-0 sm:relative sm:p-0 sm:bg-transparent sm:border-0">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !topic.trim() || isUploading}
                  className="w-full sm:w-auto sm:float-right bg-orange-600 hover:bg-orange-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upload & Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "preview" && presentation && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                  Ready to practice
                </h1>
                <p className="text-sm sm:text-base text-slate-600">
                  Your presentation is ready. Choose your audience to begin.
                </p>
              </div>

              <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4 border-2 border-orange-100">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{presentation.topic}</h2>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">{presentation.fileName}</p>
                  </div>
                  <div className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    {presentation.totalSlides} slides
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 sm:mb-3">
                    PDF Preview
                  </h3>
                  {signedPdfUrl && !pdfLoadError ? (
                    <div className="w-full h-48 sm:h-96 bg-slate-100 rounded-lg overflow-hidden">
                      <iframe
                        src={signedPdfUrl}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                        onError={() => setPdfLoadError(true)}
                      />
                    </div>
                  ) : pdfLoadError || !signedPdfUrl ? (
                    <div className="w-full bg-slate-50 rounded-lg p-4 sm:p-6 text-center border border-slate-200">
                      <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm mb-3">PDF preview not available</p>
                      <a
                        href={signedPdfUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  )}
                </div>
              </Card>

              <div className="fixed bottom-14 left-0 right-0 p-4 bg-white border-t border-slate-200 flex gap-3 z-50 sm:bottom-0 sm:relative sm:p-0 sm:bg-transparent sm:border-0 sm:justify-between">
                <Button variant="outline" onClick={() => setStep("upload")} className="flex-1 sm:flex-none">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Upload Different File</span>
                  <span className="sm:hidden">Change</span>
                </Button>
                <Button
                  onClick={handleStartPractice}
                  className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                >
                  <span className="hidden sm:inline">Choose Audience</span>
                  <span className="sm:hidden">Audience</span>
                  <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <MobileBottomNav />
      </div>
    </ModernDashboardLayout>
  );
}
