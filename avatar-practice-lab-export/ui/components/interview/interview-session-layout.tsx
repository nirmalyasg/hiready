import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SplitPanelLayout } from "./split-panel-layout";
import { CodingPanel, type SupportedLanguage, type CodingProblem } from "./coding-panel";
import { CaseStudyPanel } from "./case-study-panel";
import { CompactPhaseIndicator } from "./phase-indicator";
import {
  getCurrentPhaseMode,
  type InterviewLayoutMode,
  type InterviewPlanData,
} from "@/lib/interview-layout-utils";

interface InterviewSessionLayoutProps {
  plan?: InterviewPlanData | null;
  currentPhaseIndex?: number;
  children: React.ReactNode;
  className?: string;
  problemStatement?: string;
  codingProblem?: CodingProblem;
  caseMaterials?: { id: string; title: string; type: "text" | "table" | "chart" | "data"; content: string }[];
  casePrompt?: string;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onNotesChange?: (notes: string) => void;
  onCalculationChange?: (calculation: string) => void;
  showPhaseIndicator?: boolean;
  onPhaseChange?: (newIndex: number) => void;
}

export interface InterviewWorkspaceRef {
  getCode: () => { code: string; language: SupportedLanguage };
  getNotes: () => { notes: string; calculation: string };
  getLayoutMode: () => InterviewLayoutMode;
}

export function InterviewSessionLayout({
  plan,
  currentPhaseIndex = 0,
  children,
  className,
  problemStatement,
  codingProblem,
  caseMaterials,
  casePrompt,
  onCodeChange,
  onNotesChange,
  onCalculationChange,
  showPhaseIndicator = true,
  onPhaseChange,
}: InterviewSessionLayoutProps) {
  const [code, setCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<SupportedLanguage>("javascript");
  const [notes, setNotes] = useState("");
  const [calculation, setCalculation] = useState("");

  const currentMode = getCurrentPhaseMode(plan, currentPhaseIndex);
  
  const effectiveCodingProblem = codingProblem || (plan?.codingProblem as CodingProblem | undefined);

  const handleCodeChange = useCallback(
    (newCode: string, language: SupportedLanguage) => {
      setCode(newCode);
      setCodeLanguage(language);
      onCodeChange?.(newCode, language);
    },
    [onCodeChange]
  );

  const handleLanguageChange = useCallback(
    (language: SupportedLanguage) => {
      setCodeLanguage(language);
    },
    []
  );

  const handleCodeRun = useCallback(
    (newCode: string, language: SupportedLanguage) => {
      setCode(newCode);
      setCodeLanguage(language);
      onCodeChange?.(newCode, language);
    },
    [onCodeChange]
  );

  const handleNotesChange = useCallback(
    (newNotes: string) => {
      setNotes(newNotes);
      onNotesChange?.(newNotes);
    },
    [onNotesChange]
  );

  const handleCalculationChange = useCallback(
    (newCalc: string) => {
      setCalculation(newCalc);
      onCalculationChange?.(newCalc);
    },
    [onCalculationChange]
  );

  const totalPhases = plan?.phases?.length || 0;
  const canGoPrev = currentPhaseIndex > 0;
  const canGoNext = currentPhaseIndex < totalPhases - 1;

  const handlePrevPhase = useCallback(() => {
    if (canGoPrev && onPhaseChange) {
      onPhaseChange(currentPhaseIndex - 1);
    }
  }, [canGoPrev, currentPhaseIndex, onPhaseChange]);

  const handleNextPhase = useCallback(() => {
    if (canGoNext && onPhaseChange) {
      onPhaseChange(currentPhaseIndex + 1);
    }
  }, [canGoNext, currentPhaseIndex, onPhaseChange]);

  const phaseIndicator = showPhaseIndicator && plan?.phases && plan.phases.length > 0 ? (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {onPhaseChange && (
        <button
          onClick={handlePrevPhase}
          disabled={!canGoPrev}
          className={cn(
            "p-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm transition-all",
            canGoPrev ? "text-white hover:bg-slate-700" : "text-slate-500 cursor-not-allowed"
          )}
          title="Previous phase"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <CompactPhaseIndicator
        phases={plan.phases}
        currentPhaseIndex={currentPhaseIndex}
      />
      {onPhaseChange && (
        <button
          onClick={handleNextPhase}
          disabled={!canGoNext}
          className={cn(
            "p-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm transition-all",
            canGoNext ? "text-white hover:bg-slate-700" : "text-slate-500 cursor-not-allowed"
          )}
          title="Next phase"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  ) : null;

  if (currentMode === "normal") {
    return (
      <div className={cn("h-full relative", className)}>
        {phaseIndicator}
        {children}
      </div>
    );
  }

  if (currentMode === "coding") {
    return (
      <div className={cn("h-full relative", className)}>
        {phaseIndicator}
        <SplitPanelLayout
          className="h-full"
          initialLeftWidth={55}
          minLeftWidth={35}
          maxLeftWidth={70}
          leftPanel={
            <CodingPanel
              initialLanguage={codeLanguage}
              initialCode={code}
              problemStatement={problemStatement}
              problem={effectiveCodingProblem}
              onCodeChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
              onRun={handleCodeRun}
            />
          }
          rightPanel={<div className="h-full">{children}</div>}
        />
      </div>
    );
  }

  if (currentMode === "case_study") {
    return (
      <div className={cn("h-full relative", className)}>
        {phaseIndicator}
        <SplitPanelLayout
          className="h-full"
          initialLeftWidth={45}
          minLeftWidth={30}
          maxLeftWidth={60}
          leftPanel={
            <CaseStudyPanel
              caseMaterials={caseMaterials}
              casePrompt={casePrompt}
              onNotesChange={handleNotesChange}
              onCalculationChange={handleCalculationChange}
            />
          }
          rightPanel={<div className="h-full">{children}</div>}
        />
      </div>
    );
  }

  return (
    <div className={cn("h-full relative", className)}>
      {phaseIndicator}
      {children}
    </div>
  );
}

export function useInterviewWorkspace() {
  const codeRef = useRef({ code: "", language: "javascript" as SupportedLanguage });
  const notesRef = useRef({ notes: "", calculation: "" });
  const modeRef = useRef<InterviewLayoutMode>("normal");

  return {
    setCode: (code: string, language: SupportedLanguage) => {
      codeRef.current = { code, language };
    },
    setNotes: (notes: string, calculation: string) => {
      notesRef.current = { notes, calculation };
    },
    setMode: (mode: InterviewLayoutMode) => {
      modeRef.current = mode;
    },
    getCode: () => codeRef.current,
    getNotes: () => notesRef.current,
    getMode: () => modeRef.current,
  };
}
