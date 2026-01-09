import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserCheck, 
  MessageSquare, 
  Mic, 
  ArrowRight, 
  Target,
  Users,
  Presentation,
  ChevronLeft,
  BookOpen,
  Briefcase
} from "lucide-react";
import SidebarLayout from "@/components/layout/sidebar-layout";

type SelectedPath = "interview" | "communication" | null;

const communicationOptions = [
  {
    id: "workplace",
    title: "Workplace Conversations",
    description: "Practice difficult conversations with managers, peers, and direct reports",
    icon: Users,
    route: "/practice",
    features: ["Feedback delivery", "Conflict resolution", "Negotiation"],
  },
  {
    id: "presentation",
    title: "Presentation Practice",
    description: "Rehearse presentations and get feedback on delivery and content",
    icon: Presentation,
    route: "/practice/presentation",
    features: ["Structure feedback", "Delivery coaching", "Q&A prep"],
  },
  {
    id: "impromptu",
    title: "Impromptu Speaking",
    description: "Build confidence speaking off-the-cuff on various topics",
    icon: Mic,
    route: "/practice/impromptu",
    features: ["Random topics", "Time-boxed responses", "Fluency training"],
  },
];

export default function IntentEntryPage() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState<SelectedPath>(null);

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Practice Lab</h1>
          <p className="text-slate-500">Build your skills with AI-powered practice sessions</p>
        </div>

        {!selectedPath && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedPath("interview")}
              className="group text-left bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-slate-600 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-600 transition-colors">
                Interview Practice
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Prepare for job interviews with AI interviewers. Practice behavioral, technical, and case interviews.
              </p>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => setSelectedPath("communication")}
              className="group text-left bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-purple-400 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                Communication Skills
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Build workplace communication skills with presentations, difficult conversations, and impromptu speaking.
              </p>
              <div className="flex items-center gap-2 text-purple-600 font-medium text-sm">
                <span>Browse options</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {selectedPath === "interview" && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedPath(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to options
              </button>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => navigate("/interview")}
                className="group flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-slate-600 hover:shadow-lg transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-600 transition-colors">Interview Hub</h3>
                  <p className="text-sm text-slate-500 mb-2">Practice for specific jobs or browse 15+ role kits for quick practice</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      15+ role kits
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      Custom interviews
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      8-dimension scoring
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => navigate("/exercise-mode")}
                className="group flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-slate-400 hover:shadow-lg transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-700 transition-colors">Case Study & Coding</h3>
                  <p className="text-sm text-slate-500 mb-2">Standalone exercises for technical and business problem-solving</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      Business cases
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      Coding problems
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      Step-by-step guidance
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </>
        )}

        {selectedPath === "communication" && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedPath(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to options
              </button>
            </div>

            <div className="grid gap-4">
              {communicationOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => navigate(option.route)}
                    className="group flex items-center gap-4 bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-purple-400 hover:shadow-lg transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">{option.title}</h3>
                      <p className="text-sm text-slate-500 mb-2">{option.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-400 mb-2">
            Track your progress and review past sessions
          </p>
          <button
            onClick={() => navigate("/results")}
            className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-600 font-medium text-sm transition-colors"
          >
            View your results
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}
