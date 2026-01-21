import { useState } from "react";
import { 
  ArrowLeft, Code, Briefcase, MessageSquare, Users, ArrowRight, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/layout/sidebar-layout";

const interviewModeOptions = [
  { 
    id: "coding_technical", 
    label: "Coding & Technical Tasks", 
    description: "Solve, explain, debug, or modify technical problems",
    icon: Code,
    color: "bg-[#000000]",
    interviewMode: "coding_technical",
    duration: "15 min",
    includes: ["Coding", "Debugging", "Code Review", "SQL", "ML Basics"],
    roleCategories: ["tech", "data"],
  },
  { 
    id: "case_problem_solving", 
    label: "Case & Problem Solving", 
    description: "Structured thinking for ambiguous problems",
    icon: Briefcase,
    color: "bg-[#ee7e65]",
    interviewMode: "case_problem_solving",
    duration: "15 min",
    includes: ["Business Cases", "Product Cases", "Analytics Cases", "Strategy"],
    roleCategories: ["product", "business", "data"],
  },
  { 
    id: "behavioral", 
    label: "Behavioral and Leadership", 
    description: "Past behavior, judgment, ownership and leadership",
    icon: MessageSquare,
    color: "bg-[#ee7e65]",
    interviewMode: "behavioral",
    duration: "15 min",
    includes: ["STAR Stories", "Conflict Handling", "Leadership", "Failure Stories"],
    roleCategories: ["all"],
  },
  { 
    id: "hiring_manager", 
    label: "HR Interview", 
    description: "Role fit, motivation, culture and career alignment",
    icon: Users,
    color: "bg-gray-500",
    interviewMode: "hiring_manager",
    duration: "15 min",
    includes: ["Why This Role", "Culture Fit", "Career Goals", "Role Expectations"],
    roleCategories: ["all"],
  },
];

export default function PracticeByTypePage() {
  const navigate = useNavigate();

  const handleInterviewMode = (mode: typeof interviewModeOptions[0]) => {
    sessionStorage.setItem("interviewModeContext", JSON.stringify({
      interviewMode: mode.interviewMode,
      taxonomy: {
        label: mode.label,
        description: mode.description,
        typicalDuration: mode.duration,
        includes: mode.includes,
      },
      roleCategories: mode.roleCategories,
    }));
    navigate(`/interview/mode-setup?mode=${mode.interviewMode}`);
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-[#fbfbfc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={() => navigate("/interview")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Practice
          </button>

          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Practice by Interview Type</h1>
            <p className="text-slate-500 text-sm sm:text-base">
              Focus on specific interview formats to sharpen your skills in targeted areas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {interviewModeOptions.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleInterviewMode(mode)}
                  className="group text-left bg-white border-2 border-slate-200 rounded-2xl p-5 hover:border-[#ee7e65] hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${mode.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-[#ee7e65] transition-colors">
                        {mode.label}
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">{mode.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {mode.includes.slice(0, 4).map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mode.duration}
                        </span>
                        <span className="text-sm font-medium text-[#ee7e65] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Start Practice
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-slate-100 rounded-xl">
            <p className="text-sm text-slate-600 text-center">
              Not sure which type to practice? 
              <button 
                onClick={() => navigate("/interview")}
                className="ml-1 text-[#ee7e65] font-medium hover:underline"
              >
                Browse role-specific practice plans
              </button>
            </p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
