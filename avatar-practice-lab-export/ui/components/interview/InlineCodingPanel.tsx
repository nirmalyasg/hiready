import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, RotateCcw, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterviewEventBus } from '@/contexts/InterviewEventBusContext';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'scala', label: 'Scala' },
];

interface InlineCodingPanelProps {
  sessionId?: number;
  sendEvent?: (event: any) => void;
}

export function InlineCodingPanel({ sessionId, sendEvent }: InlineCodingPanelProps) {
  const { 
    codingChallenge, 
    userCode, 
    updateUserCode, 
    isPanelExpanded, 
    togglePanelExpanded,
    challengeStartTime,
    selectedLanguage,
    setSelectedLanguage,
    codeSubmissionStatus,
    isReviewingCode,
    submitCodeForInterviewerReview,
    clearCodeReview,
  } = useInterviewEventBus();
  
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);

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
    updateUserCode(codingChallenge.starterCodeByLanguage?.[selectedLanguage] || codingChallenge.starterCode || '');
    clearCodeReview();
  };

  const handleSubmitSolution = async () => {
    if (sessionId && sendEvent) {
      await submitCodeForInterviewerReview(sessionId, sendEvent);
    }
  };

  const difficultyColors: Record<string, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const availableLanguages = codingChallenge.supportedLanguages?.length 
    ? LANGUAGE_OPTIONS.filter(lang => codingChallenge.supportedLanguages?.includes(lang.value))
    : LANGUAGE_OPTIONS;

  const isSubmitted = codeSubmissionStatus === 'submitted' || codeSubmissionStatus === 'reviewed';

  return (
    <div 
      className="h-full bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300 w-full"
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
                <span className="text-xs text-slate-500">• {elapsedMinutes} min</span>
                {isSubmitted && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Submitted
                  </span>
                )}
              </div>
            </div>
          </div>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={isSubmitted}
                  className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCode}
                  disabled={isSubmitted}
                  className="h-6 px-2 text-xs text-slate-400 hover:text-white disabled:opacity-50"
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
            
            <div className="flex-1 overflow-auto p-3">
              <textarea
                value={userCode}
                onChange={(e) => updateUserCode(e.target.value)}
                placeholder="Write your solution here..."
                disabled={isSubmitted}
                className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono disabled:opacity-70"
                spellCheck={false}
              />
            </div>

            <div className="flex-shrink-0 border-t border-slate-700 p-3">
              {isSubmitted ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Solution Submitted</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    The interviewer will review your code and provide feedback.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleSubmitSolution}
                  disabled={isReviewingCode || !userCode.trim() || !sessionId || !sendEvent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isReviewingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Solution
                    </>
                  )}
                </Button>
              )}
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
