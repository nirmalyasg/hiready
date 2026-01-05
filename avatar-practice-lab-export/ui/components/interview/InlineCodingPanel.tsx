import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, Play, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterviewEventBus } from '@/contexts/InterviewEventBusContext';
import { cn } from '@/lib/utils';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

const languageExtensions: Record<string, any> = {
  javascript: javascript({ jsx: true, typescript: true }),
  typescript: javascript({ jsx: true, typescript: true }),
  python: python(),
};

export function InlineCodingPanel() {
  const { 
    codingChallenge, 
    userCode, 
    updateUserCode, 
    isPanelExpanded, 
    togglePanelExpanded,
    endChallenge,
    challengeStartTime 
  } = useInterviewEventBus();
  
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  if (!codingChallenge) return null;

  const elapsedMinutes = challengeStartTime 
    ? Math.floor((Date.now() - challengeStartTime) / 60000) 
    : 0;

  const copyCode = async () => {
    await navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCode = () => {
    updateUserCode(codingChallenge.starterCode || '');
  };

  const difficultyColors: Record<string, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div 
      className={cn(
        "h-full bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300",
        isFullWidth ? "w-full" : "w-full"
      )}
    >
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Code className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{codingChallenge.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  difficultyColors[codingChallenge.difficulty] || difficultyColors.Medium
                )}>
                  {codingChallenge.difficulty}
                </span>
                <span className="text-xs text-slate-400">{codingChallenge.language}</span>
                <span className="text-xs text-slate-500">• {elapsedMinutes} min</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="h-7 w-7 p-0 text-slate-400 hover:text-white"
            >
              {isFullWidth ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePanelExpanded}
              className="h-7 w-7 p-0 text-slate-400 hover:text-white"
            >
              {isPanelExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {isPanelExpanded && (
        <>
          <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 p-3 max-h-32 overflow-y-auto">
            <p className="text-sm text-slate-300 leading-relaxed">{codingChallenge.description}</p>
            
            {codingChallenge.examples && codingChallenge.examples.length > 0 && (
              <div className="mt-3 space-y-2">
                {codingChallenge.examples.map((ex, i) => (
                  <div key={i} className="bg-slate-900/50 rounded p-2 text-xs font-mono">
                    <div className="text-slate-400">Input: <span className="text-slate-200">{ex.input}</span></div>
                    <div className="text-slate-400">Output: <span className="text-emerald-400">{ex.output}</span></div>
                    {ex.explanation && (
                      <div className="text-slate-500 mt-1">{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/30 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">Your Solution</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCode}
                  className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              <CodeMirror
                value={userCode}
                height="100%"
                theme="dark"
                extensions={[languageExtensions[codingChallenge.language] || javascript()]}
                onChange={(value) => updateUserCode(value)}
                className="h-full text-sm"
              />
            </div>
          </div>

          {codingChallenge.hints && codingChallenge.hints.length > 0 && (
            <div className="flex-shrink-0 border-t border-slate-700">
              <button
                onClick={() => setShowHints(!showHints)}
                className="w-full px-3 py-2 text-xs text-slate-400 hover:text-slate-300 flex items-center justify-between"
              >
                <span>Hints ({codingChallenge.hints.length})</span>
                {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showHints && (
                <div className="px-3 pb-3 space-y-2">
                  {codingChallenge.hints.map((hint, i) => (
                    <div key={i} className="text-xs text-slate-400 bg-slate-800/50 rounded p-2">
                      <span className="text-amber-400 font-medium">Hint {i + 1}:</span> {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
