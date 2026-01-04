import React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle, Code, MessageSquare, Briefcase, Users } from "lucide-react";
import type { InterviewPhase, PhaseType } from "@/lib/interview-layout-utils";

interface PhaseIndicatorProps {
  phases: InterviewPhase[];
  currentPhaseIndex: number;
  onPhaseClick?: (index: number) => void;
  className?: string;
}

function getPhaseIcon(phase: InterviewPhase) {
  const phaseName = phase.name.toLowerCase();
  const phaseType = phase.phaseType;
  
  if (phaseType === "coding" || phaseName.includes("coding") || phaseName.includes("technical")) {
    return Code;
  }
  if (phaseType === "case_study" || phaseName.includes("case")) {
    return Briefcase;
  }
  if (phaseType === "behavioral" || phaseName.includes("behavioral")) {
    return Users;
  }
  return MessageSquare;
}

function getPhaseTypeLabel(phase: InterviewPhase): string {
  const phaseName = phase.name.toLowerCase();
  
  if (phase.phaseType === "coding" || phaseName.includes("coding") || phaseName.includes("technical problem")) {
    return "Coding";
  }
  if (phase.phaseType === "case_study" || phaseName.includes("case")) {
    return "Case Study";
  }
  if (phase.phaseType === "warmup" || phaseName.includes("warmup") || phaseName.includes("introduction")) {
    return "Warmup";
  }
  if (phase.phaseType === "behavioral" || phaseName.includes("behavioral")) {
    return "Behavioral";
  }
  if (phase.phaseType === "wrap_up" || phaseName.includes("wrap") || phaseName.includes("closing")) {
    return "Wrap Up";
  }
  return "Interview";
}

export function PhaseIndicator({
  phases,
  currentPhaseIndex,
  onPhaseClick,
  className,
}: PhaseIndicatorProps) {
  if (!phases || phases.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg", className)}>
      {phases.map((phase, index) => {
        const Icon = getPhaseIcon(phase);
        const isCompleted = index < currentPhaseIndex;
        const isCurrent = index === currentPhaseIndex;
        const isPending = index > currentPhaseIndex;
        const typeLabel = getPhaseTypeLabel(phase);

        return (
          <React.Fragment key={index}>
            <button
              onClick={() => onPhaseClick?.(index)}
              disabled={!onPhaseClick}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                isCompleted && "bg-green-500/20 text-green-400",
                isCurrent && "bg-brand-accent/20 text-brand-accent ring-2 ring-brand-accent/40",
                isPending && "bg-slate-700/50 text-slate-400",
                onPhaseClick && "hover:bg-slate-700 cursor-pointer"
              )}
              title={phase.name}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{typeLabel}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
            {index < phases.length - 1 && (
              <div 
                className={cn(
                  "w-8 h-0.5 rounded",
                  isCompleted ? "bg-green-500/50" : "bg-slate-600"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function CompactPhaseIndicator({
  phases,
  currentPhaseIndex,
  className,
}: Omit<PhaseIndicatorProps, "onPhaseClick">) {
  if (!phases || phases.length === 0) {
    return null;
  }

  const currentPhase = phases[currentPhaseIndex];
  const typeLabel = currentPhase ? getPhaseTypeLabel(currentPhase) : "Interview";
  const Icon = currentPhase ? getPhaseIcon(currentPhase) : MessageSquare;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-full", className)}>
      <Icon className="w-4 h-4 text-brand-accent" />
      <span className="text-sm font-medium text-white">{typeLabel}</span>
      <span className="text-xs text-slate-400">
        {currentPhaseIndex + 1}/{phases.length}
      </span>
    </div>
  );
}
