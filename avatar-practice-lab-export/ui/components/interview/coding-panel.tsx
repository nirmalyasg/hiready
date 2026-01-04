import React, { useState, useCallback, useMemo } from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { loadLanguage, type LanguageName } from "@uiw/codemirror-extensions-langs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ChevronDown } from "lucide-react";

export type SupportedLanguage = 
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "sql";

interface CodingPanelProps {
  className?: string;
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  problemStatement?: string;
  onCodeChange?: (code: string) => void;
  onRun?: (code: string, language: SupportedLanguage) => void;
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
  onCodeChange,
  onRun,
}: CodingPanelProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState(initialCode || DEFAULT_CODE[initialLanguage]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [output, setOutput] = useState<string>("");

  const languageExtension = useMemo(() => {
    const ext = loadLanguage(LANGUAGE_CONFIG[language].langName);
    return ext ? [ext] : [];
  }, [language]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      onCodeChange?.(value);
    },
    [onCodeChange]
  );

  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setShowLanguageDropdown(false);
  }, []);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE[language]);
    setOutput("");
    onCodeChange?.(DEFAULT_CODE[language]);
  }, [language, onCodeChange]);

  const handleRun = useCallback(() => {
    onRun?.(code, language);
    setOutput("Code submitted for review. The interviewer will discuss your approach.");
  }, [code, language, onRun]);

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-[#042c4c] text-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Code Editor</span>
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
            className="bg-[#ee7e65] hover:bg-[#dd6d54] text-white"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        </div>
      </div>

      {problemStatement && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h3 className="text-sm font-semibold text-[#042c4c] mb-1">Problem</h3>
          <p className="text-sm text-gray-600">{problemStatement}</p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
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

      {output && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          <h4 className="text-xs font-medium text-gray-400 mb-1">Output</h4>
          <pre className="text-sm text-green-400 font-mono">{output}</pre>
        </div>
      )}
    </div>
  );
}

export function getCodeFromPanel(): string {
  return "";
}
