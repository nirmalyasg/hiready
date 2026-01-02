import { useNavigate } from "react-router-dom";
import { UserCheck, FileText, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import SidebarLayout from "@/components/layout/sidebar-layout";

const practiceOptions = [
  {
    id: "interview",
    icon: UserCheck,
    title: "Interview Practice",
    description: "Practice job interviews with AI interviewers. Choose from 15+ role kits including Software Engineer, Product Manager, Data Analyst, and more.",
    features: ["Role-specific questions", "Real-time feedback", "Performance scoring"],
    route: "/interview",
    gradient: "from-indigo-600 to-purple-700",
    iconBg: "bg-indigo-500",
  },
  {
    id: "interview-custom",
    icon: FileText,
    title: "Create Your Own Interview",
    description: "Upload your resume and job description for a personalized interview experience tailored to your target role.",
    features: ["Custom question generation", "Resume-based prep", "JD alignment analysis"],
    route: "/interview/custom",
    gradient: "from-emerald-600 to-teal-700",
    iconBg: "bg-emerald-500",
  },
  {
    id: "exercise",
    icon: BookOpen,
    title: "Case Study & Coding",
    description: "Sharpen your problem-solving skills with technical exercises. Practice case studies and coding challenges with guided AI feedback.",
    features: ["Business case studies", "Coding problems", "Step-by-step guidance"],
    route: "/exercise-mode",
    gradient: "from-slate-700 to-slate-900",
    iconBg: "bg-slate-600",
  },
];

export default function IntentEntryPage() {
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/10 text-brand-accent rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Practice
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-brand-dark mb-3">
              What would you like to practice?
            </h1>
            <p className="text-brand-muted text-sm sm:text-base max-w-xl mx-auto">
              Choose a practice mode below to start building your skills with personalized AI coaching
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6">
            {practiceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => navigate(option.route)}
                  className="group relative bg-white rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative p-5 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className={`${option.iconBg} w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-brand-dark group-hover:text-white transition-colors mb-1.5">
                            {option.title}
                          </h3>
                          <p className="text-sm text-brand-muted group-hover:text-white/80 transition-colors mb-3 sm:mb-4">
                            {option.description}
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-white/20 transition-colors flex-shrink-0">
                          <ArrowRight className="w-5 h-5 text-brand-muted group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-brand-dark/70 group-hover:bg-white/20 group-hover:text-white transition-colors"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 sm:mt-14 text-center">
            <p className="text-sm text-brand-muted mb-3">
              Track your progress and review past sessions
            </p>
            <button
              onClick={() => navigate("/avatar/results")}
              className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-dark font-medium transition-colors"
            >
              View your results
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
