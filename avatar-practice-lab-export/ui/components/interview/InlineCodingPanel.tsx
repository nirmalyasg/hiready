import { useState } from 'react';
import { Code, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, RotateCcw, Play, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
}

export function InlineCodingPanel({ sessionId }: InlineCodingPanelProps) {
  const { 
    codingChallenge, 
    userCode, 
    updateUserCode, 
    isPanelExpanded, 
    togglePanelExpanded,
    endChallenge,
    challengeStartTime,
    selectedLanguage,
    setSelectedLanguage,
    codeReview,
    isReviewingCode,
    submitCodeForReview,
    clearCodeReview,
  } = useInterviewEventBus();
  
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showReview, setShowReview] = useState(false);

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

  const handleSubmitForReview = async () => {
    if (sessionId) {
      await submitCodeForReview(sessionId);
      setShowReview(true);
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
                  className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            
            <div className="flex-1 overflow-auto p-3">
              <textarea
                value={userCode}
                onChange={(e) => {
                  updateUserCode(e.target.value);
                  if (codeReview) clearCodeReview();
                }}
                placeholder="Write your solution here..."
                className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                spellCheck={false}
              />
            </div>

            <div className="flex-shrink-0 border-t border-slate-700 p-3">
              <Button
                onClick={handleSubmitForReview}
                disabled={isReviewingCode || !userCode.trim() || !sessionId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isReviewingCode ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reviewing Code...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Check My Solution
                  </>
                )}
              </Button>
            </div>

            {codeReview && (
              <div className="flex-shrink-0 border-t border-slate-700 p-3 bg-slate-800/50 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {codeReview.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className={cn(
                      "font-semibold text-sm",
                      codeReview.isCorrect ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {codeReview.isCorrect ? 'Correct!' : 'Needs Work'}
                    </span>
                    <span className="text-xs text-slate-400">Score: {codeReview.score}/100</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReview(!showReview)}
                    className="h-6 w-6 p-0 text-slate-400"
                  >
                    {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                
                {showReview && (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300">{codeReview.feedback}</p>
                    
                    {codeReview.suggestions && codeReview.suggestions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-slate-400 font-medium">Suggestions:</span>
                        <ul className="mt-1 space-y-1">
                          {codeReview.suggestions.map((suggestion, i) => (
                            <li key={i} className="flex items-start gap-1 text-slate-300">
                              <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-4 mt-2 pt-2 border-t border-slate-700">
                      {codeReview.efficiency && (
                        <div>
                          <span className="text-slate-500">Efficiency:</span>
                          <span className="text-slate-300 ml-1">{codeReview.efficiency}</span>
                        </div>
                      )}
                      {codeReview.style && (
                        <div>
                          <span className="text-slate-500">Style:</span>
                          <span className="text-slate-300 ml-1">{codeReview.style}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
