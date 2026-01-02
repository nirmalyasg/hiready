import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Code, Briefcase, ChevronRight, Target, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/sidebar-layout";

interface TrackCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  route: string;
  color: string;
}

function TrackCard({ title, description, icon, features, route, color }: TrackCardProps) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`${color} p-6`}>
        <div className="flex items-center gap-3 text-white">
          {icon}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        <p className="text-slate-600 mb-4">{description}</p>
        <div className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {feature}
            </div>
          ))}
        </div>
        <Button 
          onClick={() => navigate(route)}
          className="w-full"
        >
          Start Practicing
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function ExerciseModePage() {
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Interview Exercise Mode</h1>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Practice structured interview exercises with AI-powered feedback. Choose your track 
              and build skills through realistic interview simulations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <TrackCard
              title="Case Study Mode"
              description="Practice structured case interviews used in consulting, PM, and strategy roles."
              icon={<Briefcase className="w-6 h-6" />}
              features={[
                "Business Diagnosis - Root cause analysis",
                "Execution Planning - Strategy implementation",
                "Stakeholder Cases - Influence and alignment",
                "Thinking time + AI interviewer probing",
                "6-dimension scorecard with evidence"
              ]}
              route="/exercise-mode/case-study"
              color="bg-gradient-to-r from-emerald-500 to-teal-600"
            />
            
            <TrackCard
              title="Coding Lab Mode"
              description="Practice code-focused interview activities with realistic interviewer behaviors."
              icon={<Code className="w-6 h-6" />}
              features={[
                "Explain Code - Walk through existing code",
                "Debug Code - Find and fix bugs",
                "Modify Code - Add features or improvements",
                "Real-time probing on complexity and edge cases",
                "Signal tracking and improvement suggestions"
              ]}
              route="/exercise-mode/coding-lab"
              color="bg-gradient-to-r from-blue-500 to-indigo-600"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">How It Works</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Select Exercise</h4>
                <p className="text-sm text-slate-600">Choose a case template or coding exercise matched to your target role</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Practice with AI</h4>
                <p className="text-sm text-slate-600">Engage in voice conversation with an AI interviewer who probes your responses</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-slate-900 mb-1">Get Feedback</h4>
                <p className="text-sm text-slate-600">Receive detailed scorecard with evidence snippets and personalized practice plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
