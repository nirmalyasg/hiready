import { useState } from 'react';
import { Briefcase, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, Target, Clock, FileText, Table, BarChart3, Database, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterviewEventBus } from '@/contexts/InterviewEventBusContext';
import { cn } from '@/lib/utils';

export function InlineCaseStudyPanel() {
  const { 
    caseStudyChallenge, 
    userNotes, 
    updateUserNotes, 
    isPanelExpanded, 
    togglePanelExpanded,
    challengeStartTime 
  } = useInterviewEventBus();
  
  const [copied, setCopied] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [showScenario, setShowScenario] = useState(true);
  const [showMaterials, setShowMaterials] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());

  if (!caseStudyChallenge) return null;

  const elapsedMinutes = challengeStartTime 
    ? Math.floor((Date.now() - challengeStartTime) / 60000) 
    : 0;

  const toggleMaterial = (id: string) => {
    setExpandedMaterials(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'table': return <Table className="w-3 h-3" />;
      case 'chart': return <BarChart3 className="w-3 h-3" />;
      case 'data': return <Database className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const copyNotes = async () => {
    await navigator.clipboard.writeText(userNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const caseTypeColors: Record<string, string> = {
    strategy: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    operations: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    market_entry: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pricing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    growth: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  const difficultyColors: Record<string, string> = {
    Easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <div 
      className="h-full bg-slate-900 border-l border-slate-700 flex flex-col transition-all duration-300 w-full"
    >
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{caseStudyChallenge.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border capitalize",
                  caseTypeColors[caseStudyChallenge.caseType] || caseTypeColors.strategy
                )}>
                  {caseStudyChallenge.caseType.replace('_', ' ')}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border",
                  difficultyColors[caseStudyChallenge.difficulty] || difficultyColors.Medium
                )}>
                  {caseStudyChallenge.difficulty}
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
          <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 p-4">
            <div className="flex items-start gap-2 mb-3">
              <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">The Challenge</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{caseStudyChallenge.prompt}</p>
              </div>
            </div>
            
            {caseStudyChallenge.scenario && (
              <div className="mt-3">
                <button
                  onClick={() => setShowScenario(!showScenario)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 mb-2"
                >
                  {showScenario ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Scenario Background
                </button>
                {showScenario && (
                  <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    {caseStudyChallenge.scenario}
                  </div>
                )}
              </div>
            )}

            {caseStudyChallenge.context && !caseStudyChallenge.scenario && (
              <div className="mt-3">
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 mb-2"
                >
                  {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Background Context
                </button>
                {showContext && (
                  <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
                    {caseStudyChallenge.context}
                  </div>
                )}
              </div>
            )}

            {caseStudyChallenge.materials && caseStudyChallenge.materials.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowMaterials(!showMaterials)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 mb-2"
                >
                  {showMaterials ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Case Materials ({caseStudyChallenge.materials.length})
                </button>
                {showMaterials && (
                  <div className="space-y-2">
                    {caseStudyChallenge.materials.map((material) => (
                      <div key={material.id} className="bg-slate-900/50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleMaterial(material.id)}
                          className="w-full flex items-center justify-between p-2 text-xs hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2 text-slate-300">
                            {getMaterialIcon(material.type)}
                            <span className="font-medium">{material.title}</span>
                            <span className="text-slate-500 capitalize">({material.type})</span>
                          </div>
                          {expandedMaterials.has(material.id) ? (
                            <ChevronUp className="w-3 h-3 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          )}
                        </button>
                        {expandedMaterials.has(material.id) && (
                          <div className="p-3 border-t border-slate-700/50 text-xs text-slate-400 whitespace-pre-wrap font-mono">
                            {material.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {caseStudyChallenge.hints && caseStudyChallenge.hints.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mb-2"
                >
                  <Lightbulb className="w-3 h-3" />
                  {showHints ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Hints ({caseStudyChallenge.hints.length})
                </button>
                {showHints && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <ul className="text-xs text-amber-300/80 space-y-1">
                      {caseStudyChallenge.hints.map((hint, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {caseStudyChallenge.evaluationFocus && caseStudyChallenge.evaluationFocus.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {caseStudyChallenge.evaluationFocus.map((focus, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                    {focus}
                  </span>
                ))}
              </div>
            )}

            {caseStudyChallenge.expectedDurationMinutes && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Expected: ~{caseStudyChallenge.expectedDurationMinutes} minutes</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/30 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-medium">Your Notes & Framework</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyNotes}
                className="h-6 px-2 text-xs text-slate-400 hover:text-white"
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            
            <div className="flex-1 p-3">
              <textarea
                value={userNotes}
                onChange={(e) => updateUserNotes(e.target.value)}
                placeholder="Use this space to structure your approach...

• Clarifying questions to ask
• Framework to apply
• Key assumptions
• Analysis structure
• Recommendation outline"
                className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
