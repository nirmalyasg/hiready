import React, { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { SplitPanelLayout } from "./split-panel-layout";
import { CodingPanel, type SupportedLanguage } from "./coding-panel";
import { CaseStudyPanel } from "./case-study-panel";
import {
  detectInterviewLayoutMode,
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
  caseMaterials?: { id: string; title: string; type: "text" | "table" | "chart" | "data"; content: string }[];
  casePrompt?: string;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onNotesChange?: (notes: string) => void;
  onCalculationChange?: (calculation: string) => void;
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
  caseMaterials,
  casePrompt,
  onCodeChange,
  onNotesChange,
  onCalculationChange,
}: InterviewSessionLayoutProps) {
  const [code, setCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<SupportedLanguage>("javascript");
  const [notes, setNotes] = useState("");
  const [calculation, setCalculation] = useState("");

  const overallMode = detectInterviewLayoutMode(plan);
  const currentMode = getCurrentPhaseMode(plan, currentPhaseIndex);
  const effectiveMode = currentMode !== "normal" ? currentMode : overallMode;

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

  if (effectiveMode === "normal") {
    return <div className={cn("h-full", className)}>{children}</div>;
  }

  if (effectiveMode === "coding") {
    return (
      <SplitPanelLayout
        className={className}
        initialLeftWidth={55}
        minLeftWidth={35}
        maxLeftWidth={70}
        leftPanel={
          <CodingPanel
            initialLanguage={codeLanguage}
            initialCode={code}
            problemStatement={problemStatement}
            onCodeChange={handleCodeChange}
            onLanguageChange={handleLanguageChange}
            onRun={handleCodeRun}
          />
        }
        rightPanel={<div className="h-full">{children}</div>}
      />
    );
  }

  if (effectiveMode === "case_study") {
    return (
      <SplitPanelLayout
        className={className}
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
    );
  }

  return <div className={cn("h-full", className)}>{children}</div>;
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
