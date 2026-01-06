import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ChallengeType = 'coding' | 'case_study' | 'none';

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  supportedLanguages?: string[];
  starterCode: string;
  starterCodeByLanguage?: Record<string, string>;
  examples?: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints?: string[];
}

export interface CodeReviewResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions: string[];
  efficiency?: string;
  style?: string;
}

export type CodeSubmissionStatus = 'idle' | 'submitting' | 'submitted' | 'reviewed';

export interface CaseStudyMaterial {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'data';
  content: string;
}

export interface CaseStudyChallenge {
  id: string;
  title: string;
  prompt: string;
  context?: string;
  scenario?: string;
  caseType: string;
  difficulty: string;
  evaluationFocus?: string[];
  expectedDurationMinutes?: number;
  materials?: CaseStudyMaterial[];
  hints?: string[];
  sampleApproach?: string;
}

export interface InterviewEventBusState {
  activeChallenge: ChallengeType;
  codingChallenge: CodingChallenge | null;
  caseStudyChallenge: CaseStudyChallenge | null;
  userCode: string;
  userNotes: string;
  selectedLanguage: string;
  challengeStartTime: number | null;
  isPanelExpanded: boolean;
  codeReview: CodeReviewResult | null;
  isReviewingCode: boolean;
  codeSubmissionStatus: CodeSubmissionStatus;
}

interface InterviewEventBusContextValue extends InterviewEventBusState {
  startCodingChallenge: (challenge: CodingChallenge) => void;
  startCaseStudyChallenge: (challenge: CaseStudyChallenge) => void;
  endChallenge: () => void;
  updateUserCode: (code: string) => void;
  updateUserNotes: (notes: string) => void;
  setSelectedLanguage: (language: string) => void;
  togglePanelExpanded: () => void;
  setPanelExpanded: (expanded: boolean) => void;
  submitCodeForReview: (sessionId: number) => Promise<void>;
  submitCodeForInterviewerReview: (sessionId: number, sendEvent: (event: any) => void) => Promise<void>;
  clearCodeReview: () => void;
}

const InterviewEventBusContext = createContext<InterviewEventBusContextValue | null>(null);

export function InterviewEventBusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InterviewEventBusState>({
    activeChallenge: 'none',
    codingChallenge: null,
    caseStudyChallenge: null,
    userCode: '',
    userNotes: '',
    selectedLanguage: '',
    challengeStartTime: null,
    isPanelExpanded: true,
    codeReview: null,
    isReviewingCode: false,
    codeSubmissionStatus: 'idle',
  });

  const startCodingChallenge = useCallback((challenge: CodingChallenge) => {
    console.log('[InterviewEventBus] Starting coding challenge:', challenge.title);
    const defaultLanguage = challenge.language || (challenge.supportedLanguages?.[0]) || 'python';
    setState(prev => ({
      ...prev,
      activeChallenge: 'coding',
      codingChallenge: challenge,
      caseStudyChallenge: null,
      userCode: challenge.starterCodeByLanguage?.[defaultLanguage] || challenge.starterCode || '',
      userNotes: '',
      selectedLanguage: defaultLanguage,
      challengeStartTime: Date.now(),
      isPanelExpanded: true,
      codeReview: null,
      isReviewingCode: false,
      codeSubmissionStatus: 'idle',
    }));
  }, []);

  const startCaseStudyChallenge = useCallback((challenge: CaseStudyChallenge) => {
    console.log('[InterviewEventBus] Starting case study challenge:', challenge.title);
    setState(prev => ({
      ...prev,
      activeChallenge: 'case_study',
      codingChallenge: null,
      caseStudyChallenge: challenge,
      userCode: '',
      userNotes: '',
      challengeStartTime: Date.now(),
      isPanelExpanded: true,
    }));
  }, []);

  const endChallenge = useCallback(() => {
    console.log('[InterviewEventBus] Ending challenge');
    setState(prev => ({
      ...prev,
      activeChallenge: 'none',
      challengeStartTime: null,
      isPanelExpanded: false,
    }));
  }, []);

  const updateUserCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, userCode: code }));
  }, []);

  const updateUserNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, userNotes: notes }));
  }, []);

  const togglePanelExpanded = useCallback(() => {
    setState(prev => ({ ...prev, isPanelExpanded: !prev.isPanelExpanded }));
  }, []);

  const setPanelExpanded = useCallback((expanded: boolean) => {
    setState(prev => ({ ...prev, isPanelExpanded: expanded }));
  }, []);

  const setSelectedLanguage = useCallback((language: string) => {
    setState(prev => {
      const newStarterCode = prev.codingChallenge?.starterCodeByLanguage?.[language] 
        || prev.codingChallenge?.starterCode 
        || '';
      const prevStarterCode = prev.codingChallenge?.starterCodeByLanguage?.[prev.selectedLanguage]
        || prev.codingChallenge?.starterCode
        || '';
      const userHasEdited = prev.userCode.trim() !== '' && prev.userCode !== prevStarterCode;
      
      return { 
        ...prev, 
        selectedLanguage: language,
        userCode: userHasEdited ? prev.userCode : newStarterCode,
        codeReview: null,
      };
    });
  }, []);

  const submitCodeForReview = useCallback(async (sessionId: number) => {
    setState(prev => ({ ...prev, isReviewingCode: true, codeReview: null }));
    
    try {
      const response = await fetch(`/api/interview/session/${sessionId}/code-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: state.userCode,
          language: state.selectedLanguage,
          challengeId: state.codingChallenge?.id,
          challengeTitle: state.codingChallenge?.title,
          challengeDescription: state.codingChallenge?.description,
          examples: state.codingChallenge?.examples,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Code review API error:', response.status, errorData);
        setState(prev => ({ 
          ...prev, 
          isReviewingCode: false,
          codeReview: {
            isCorrect: false,
            score: 0,
            feedback: `Review failed: ${errorData.error || 'Unable to connect to review service'}`,
            suggestions: ['Please try again'],
          }
        }));
        return;
      }

      const data = await response.json();
      if (data.success) {
        setState(prev => ({ ...prev, codeReview: data.review, isReviewingCode: false }));
      } else {
        console.error('Code review failed:', data.error);
        setState(prev => ({ 
          ...prev, 
          isReviewingCode: false,
          codeReview: {
            isCorrect: false,
            score: 0,
            feedback: data.error || 'Review failed. Please try again.',
            suggestions: [],
          }
        }));
      }
    } catch (error) {
      console.error('Error submitting code for review:', error);
      setState(prev => ({ 
        ...prev, 
        isReviewingCode: false,
        codeReview: {
          isCorrect: false,
          score: 0,
          feedback: 'Connection error. Please check your internet and try again.',
          suggestions: [],
        }
      }));
    }
  }, [state.userCode, state.selectedLanguage, state.codingChallenge]);

  const clearCodeReview = useCallback(() => {
    setState(prev => ({ ...prev, codeReview: null }));
  }, []);

  const submitCodeForInterviewerReview = useCallback(async (
    sessionId: number, 
    sendEvent: (event: any) => void
  ) => {
    setState(prev => ({ ...prev, codeSubmissionStatus: 'submitting', isReviewingCode: true }));
    
    try {
      const response = await fetch(`/api/interview/session/${sessionId}/code-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: state.userCode,
          language: state.selectedLanguage,
          challengeId: state.codingChallenge?.id,
          challengeTitle: state.codingChallenge?.title,
          challengeDescription: state.codingChallenge?.description,
          examples: state.codingChallenge?.examples,
        }),
      });

      if (!response.ok) {
        setState(prev => ({ ...prev, codeSubmissionStatus: 'idle', isReviewingCode: false }));
        return;
      }

      const data = await response.json();
      if (data.success && data.review) {
        const review = data.review;
        setState(prev => ({ 
          ...prev, 
          codeSubmissionStatus: 'submitted',
          codeReview: review,
          isReviewingCode: false,
        }));
        
        const userMessage = `I've finished writing my ${state.selectedLanguage} solution for the coding problem.

[For the interviewer - Code Analysis Results:
- The solution is ${review.isCorrect ? 'correct' : 'not fully correct'}
- Quality score: ${review.score}/100
- Key feedback: ${review.feedback}
- Efficiency: ${review.efficiency || 'standard'}
- Areas to improve: ${review.suggestions?.slice(0, 2).join(', ') || 'minor refinements'}

Please provide verbal feedback on my solution, discuss my approach, and ask follow-up questions about complexity or edge cases.]`;
        
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: userMessage
              }
            ]
          }
        });
        
        sendEvent({ type: "response.create" });
        
        setTimeout(() => {
          setState(prev => ({ ...prev, codeSubmissionStatus: 'reviewed' }));
        }, 2000);
      } else {
        setState(prev => ({ ...prev, codeSubmissionStatus: 'idle', isReviewingCode: false }));
      }
    } catch (error) {
      console.error('Error submitting code for interviewer review:', error);
      setState(prev => ({ ...prev, codeSubmissionStatus: 'idle', isReviewingCode: false }));
    }
  }, [state.userCode, state.selectedLanguage, state.codingChallenge]);

  return (
    <InterviewEventBusContext.Provider
      value={{
        ...state,
        startCodingChallenge,
        startCaseStudyChallenge,
        endChallenge,
        updateUserCode,
        updateUserNotes,
        setSelectedLanguage,
        togglePanelExpanded,
        setPanelExpanded,
        submitCodeForReview,
        submitCodeForInterviewerReview,
        clearCodeReview,
      }}
    >
      {children}
    </InterviewEventBusContext.Provider>
  );
}

export function useInterviewEventBus() {
  const context = useContext(InterviewEventBusContext);
  if (!context) {
    throw new Error('useInterviewEventBus must be used within InterviewEventBusProvider');
  }
  return context;
}
