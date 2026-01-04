import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit3, Save, FileText, Calculator, Clock } from "lucide-react";

interface CaseStudyPanelProps {
  className?: string;
  caseMaterials?: CaseMaterial[];
  casePrompt?: string;
  timeLimit?: number;
  onNotesChange?: (notes: string) => void;
  onCalculationChange?: (calculation: string) => void;
}

interface CaseMaterial {
  id: string;
  title: string;
  type: "text" | "table" | "chart" | "data";
  content: string;
}

export function CaseStudyPanel({
  className,
  caseMaterials = [],
  casePrompt,
  timeLimit,
  onNotesChange,
  onCalculationChange,
}: CaseStudyPanelProps) {
  const [notes, setNotes] = useState("");
  const [calculation, setCalculation] = useState("");
  const [activeTab, setActiveTab] = useState<"materials" | "notes" | "calculation">("materials");
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  const toggleMaterial = useCallback((id: string) => {
    setExpandedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotes(value);
      onNotesChange?.(value);
    },
    [onNotesChange]
  );

  const handleCalculationChange = useCallback(
    (value: string) => {
      setCalculation(value);
      onCalculationChange?.(value);
    },
    [onCalculationChange]
  );

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-[#042c4c] text-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Case Study Materials</span>
        </div>
        {timeLimit && (
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{timeLimit} min</span>
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("materials")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "materials"
              ? "text-[#ee7e65] border-b-2 border-[#ee7e65]"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FileText className="w-4 h-4 inline-block mr-1" />
          Materials
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "notes"
              ? "text-[#ee7e65] border-b-2 border-[#ee7e65]"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Edit3 className="w-4 h-4 inline-block mr-1" />
          Notes
        </button>
        <button
          onClick={() => setActiveTab("calculation")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "calculation"
              ? "text-[#ee7e65] border-b-2 border-[#ee7e65]"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Calculator className="w-4 h-4 inline-block mr-1" />
          Scratch
        </button>
      </div>

      {casePrompt && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <h3 className="text-sm font-semibold text-[#042c4c] mb-1">Case Prompt</h3>
          <p className="text-sm text-gray-700">{casePrompt}</p>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {activeTab === "materials" && (
          <div className="p-4 space-y-3">
            {caseMaterials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Case materials will appear here when the interviewer shares them.</p>
              </div>
            ) : (
              caseMaterials.map((material) => (
                <div
                  key={material.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleMaterial(material.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          material.type === "table" && "bg-blue-500",
                          material.type === "data" && "bg-green-500",
                          material.type === "chart" && "bg-purple-500",
                          material.type === "text" && "bg-gray-400"
                        )}
                      />
                      <span className="text-sm font-medium text-gray-900">{material.title}</span>
                      <span className="text-xs text-gray-400 uppercase">{material.type}</span>
                    </div>
                    {expandedMaterials.has(material.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {expandedMaterials.has(material.id) && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {material.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="p-4 h-full">
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Take notes here during the case discussion...

• Key facts and data points
• Framework/approach
• Assumptions
• Questions to ask"
              className="w-full h-full min-h-[300px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65]"
            />
          </div>
        )}

        {activeTab === "calculation" && (
          <div className="p-4 h-full">
            <textarea
              value={calculation}
              onChange={(e) => handleCalculationChange(e.target.value)}
              placeholder="Scratch pad for calculations...

Example:
Market Size = Population × Adoption Rate × ARPU
           = 100M × 10% × $50
           = $500M"
              className="w-full h-full min-h-[300px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ee7e65]/20 focus:border-[#ee7e65] font-mono"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-white border-t border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {activeTab === "notes" && `${notes.length} characters`}
          {activeTab === "calculation" && `${calculation.length} characters`}
        </span>
        {(activeTab === "notes" || activeTab === "calculation") && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[#ee7e65] hover:text-[#dd6d54] hover:bg-[#ee7e65]/10"
          >
            <Save className="w-4 h-4 mr-1" />
            Auto-saved
          </Button>
        )}
      </div>
    </div>
  );
}

export function getCaseNotesFromPanel(): { notes: string; calculation: string } {
  return { notes: "", calculation: "" };
}
