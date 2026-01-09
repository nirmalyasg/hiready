import React, { useState, useCallback, useMemo } from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { loadLanguage, type LanguageName } from "@uiw/codemirror-extensions-langs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ChevronDown, ChevronUp, Code2, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";

export type SupportedLanguage = 
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "sql";

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints?: string[];
  starterCode?: Record<SupportedLanguage, string>;
  testCases?: { input: string; expectedOutput: string }[];
}

interface CodingPanelProps {
  className?: string;
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  problemStatement?: string;
  problem?: CodingProblem;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onLanguageChange?: (language: SupportedLanguage) => void;
  onRun?: (code: string, language: SupportedLanguage) => void;
  onSubmit?: (code: string, language: SupportedLanguage) => void;
}

const LANGUAGE_CONFIG: Record<SupportedLanguage, { label: string; langName: LanguageName }> = {
  javascript: { label: "JavaScript", langName: "js" },
  typescript: { label: "TypeScript", langName: "ts" },
  python: { label: "Python", langName: "py" },
  java: { label: "Java", langName: "java" },
  cpp: { label: "C++", langName: "cpp" },
  go: { label: "Go", langName: "go" },
  rust: { label: "Rust", langName: "rs" },
  sql: { label: "SQL", langName: "sql" },
};

const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  javascript: `// Write your solution here
function solution(input) {
  // Your code here
  
  return result;
}
`,
  typescript: `// Write your solution here
function solution(input: any): any {
  // Your code here
  
  return result;
}
`,
  python: `# Write your solution here
def solution(input):
    # Your code here
    
    return result
`,
  java: `// Write your solution here
public class Solution {
    public Object solve(Object input) {
        // Your code here
        
        return result;
    }
}
`,
  cpp: `// Write your solution here
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    void solve() {
        // Your code here
    }
};
`,
  go: `// Write your solution here
package main

func solution(input interface{}) interface{} {
    // Your code here
    
    return nil
}
`,
  rust: `// Write your solution here
fn solution(input: &str) -> String {
    // Your code here
    
    String::new()
}
`,
  sql: `-- Write your query here
SELECT *
FROM table_name
WHERE condition;
`,
};

export function CodingPanel({
  className,
  initialCode,
  initialLanguage = "javascript",
  problemStatement,
  problem,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
}: CodingPanelProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const getInitialCode = () => {
    if (initialCode) return initialCode;
    if (problem?.starterCode?.[initialLanguage]) return problem.starterCode[initialLanguage];
    return DEFAULT_CODE[initialLanguage];
  };
  const [code, setCode] = useState(getInitialCode());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; input: string; expected: string; actual: string }[]>([]);
  const [showProblem, setShowProblem] = useState(true);
  const [activeTab, setActiveTab] = useState<"problem" | "output">("problem");

  const languageExtension = useMemo(() => {
    const ext = loadLanguage(LANGUAGE_CONFIG[language].langName);
    return ext ? [ext] : [];
  }, [language]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      onCodeChange?.(value, language);
    },
    [onCodeChange, language]
  );

  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const newCode = problem?.starterCode?.[newLang] || DEFAULT_CODE[newLang];
    setCode(newCode);
    setShowLanguageDropdown(false);
    onLanguageChange?.(newLang);
    onCodeChange?.(newCode, newLang);
  }, [onLanguageChange, onCodeChange, problem]);

  const handleReset = useCallback(() => {
    const resetCode = problem?.starterCode?.[language] || DEFAULT_CODE[language];
    setCode(resetCode);
    setOutput("");
    setTestResults([]);
    onCodeChange?.(resetCode, language);
  }, [language, onCodeChange, problem]);

  const executeJavaScript = (userCode: string): { output: string; error?: string } => {
    try {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(a => JSON.stringify(a)).join(" ")),
        error: (...args: unknown[]) => logs.push(`Error: ${args.map(a => String(a)).join(" ")}`),
        warn: (...args: unknown[]) => logs.push(`Warning: ${args.map(a => String(a)).join(" ")}`),
      };
      
      const wrappedCode = `
        (function(console) {
          ${userCode}
          if (typeof solution === 'function') {
            return { hasSolution: true };
          }
          return { hasSolution: false };
        })
      `;
      
      const fn = eval(wrappedCode);
      const result = fn(mockConsole);
      
      if (logs.length > 0) {
        return { output: logs.join("\n") };
      }
      
      if (result.hasSolution) {
        return { output: "Code compiled successfully. Define test inputs to see output." };
      }
      
      return { output: "Code executed. No output produced." };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return { output: "", error: errMsg };
    }
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setActiveTab("output");
    setTestResults([]);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (language === "javascript" || language === "typescript") {
      const result = executeJavaScript(code);
      if (result.error) {
        setOutput(`Error: ${result.error}`);
      } else {
        setOutput(result.output || "Code executed successfully.");
      }
    } else {
      setOutput(`Running ${LANGUAGE_CONFIG[language].label} code...\n\nCode analysis complete. The interviewer will discuss your approach and solution.`);
    }
    
    onRun?.(code, language);
    setIsRunning(false);
  }, [code, language, onRun]);

  const handleSubmit = useCallback(() => {
    setActiveTab("output");
    setOutput("Code submitted for review. The interviewer will now discuss your approach, time complexity, and potential optimizations.");
    onSubmit?.(code, language);
  }, [code, language, onSubmit]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-600 bg-green-50";
      case "Medium": return "text-yellow-600 bg-yellow-50";
      case "Hard": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const renderProblemPanel = () => {
    if (!problem && !problemStatement) return null;
    
    if (problem) {
      return (
        <div className={cn(
          "overflow-y-auto transition-all duration-300",
          showProblem ? "max-h-[40%] min-h-[120px]" : "max-h-0"
        )}>
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{problem.title}</h3>
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded",
                  getDifficultyColor(problem.difficulty)
                )}>
                  {problem.difficulty}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{problem.description}</p>
            
            {problem.examples.length > 0 && (
              <div className="space-y-2 mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Examples</h4>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm font-mono">
                    <div className="text-gray-600">
                      <span className="text-gray-500">Input: </span>
                      <span className="text-slate-900">{ex.input}</span>
                    </div>
                    <div className="text-gray-600">
                      <span className="text-gray-500">Output: </span>
                      <span className="text-green-600">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-gray-500 text-xs mt-1 font-sans">
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Constraints</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx} className="font-mono">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (problemStatement) {
      return (
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          showProblem ? "max-h-24" : "max-h-0"
        )}>
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Problem</h3>
            <p className="text-sm text-gray-600">{problemStatement}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4" />
          <span className="text-sm font-medium">Code Editor</span>
          {(problem || problemStatement) && (
            <button
              onClick={() => setShowProblem(!showProblem)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors ml-2"
            >
              <FileText className="w-3 h-3" />
              {showProblem ? "Hide Problem" : "Show Problem"}
              {showProblem ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
            >
              {LANGUAGE_CONFIG[language].label}
              <ChevronDown className="w-4 h-4" />
            </button>

            {showLanguageDropdown && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {Object.entries(LANGUAGE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleLanguageChange(key as SupportedLanguage)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors",
                      key === language && "bg-gray-100 font-medium"
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="bg-slate-600 hover:bg-slate-700 text-white"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            Run
          </Button>
        </div>
      </div>

      {renderProblemPanel()}

      <div className="flex-1 overflow-hidden min-h-[200px]">
        <ReactCodeMirror
          value={code}
          onChange={handleCodeChange}
          extensions={languageExtension}
          theme="light"
          height="100%"
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            autocompletion: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
          }}
        />
      </div>

      <div className="border-t border-gray-200">
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100">
          <button
            onClick={() => setActiveTab("output")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded transition-colors",
              activeTab === "output" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            Output
          </button>
        </div>
        
        <div className="px-4 py-3 bg-gray-800 min-h-[80px] max-h-[120px] overflow-y-auto">
          {isRunning ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Running code...</span>
            </div>
          ) : output ? (
            <pre className={cn(
              "text-sm font-mono whitespace-pre-wrap",
              output.startsWith("Error") ? "text-red-400" : "text-green-400"
            )}>{output}</pre>
          ) : (
            <p className="text-sm text-gray-500">Click "Run" to execute your code</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function getCodeFromPanel(): string {
  return "";
}
