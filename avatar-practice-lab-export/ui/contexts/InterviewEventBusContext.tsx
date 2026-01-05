import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ChallengeType = 'coding' | 'case_study' | 'none';

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  starterCode: string;
  examples?: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints?: string[];
}

export interface CaseStudyChallenge {
  id: string;
  title: string;
  prompt: string;
  context?: string;
  caseType: string;
  difficulty: string;
  evaluationFocus?: string[];
  expectedDurationMinutes?: number;
}

export interface InterviewEventBusState {
  activeChallenge: ChallengeType;
  codingChallenge: CodingChallenge | null;
  caseStudyChallenge: CaseStudyChallenge | null;
  userCode: string;
  userNotes: string;
  challengeStartTime: number | null;
  isPanelExpanded: boolean;
}

interface InterviewEventBusContextValue extends InterviewEventBusState {
  startCodingChallenge: (challenge: CodingChallenge) => void;
  startCaseStudyChallenge: (challenge: CaseStudyChallenge) => void;
  endChallenge: () => void;
  updateUserCode: (code: string) => void;
  updateUserNotes: (notes: string) => void;
  togglePanelExpanded: () => void;
  setPanelExpanded: (expanded: boolean) => void;
}

const InterviewEventBusContext = createContext<InterviewEventBusContextValue | null>(null);

export function InterviewEventBusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InterviewEventBusState>({
    activeChallenge: 'none',
    codingChallenge: null,
    caseStudyChallenge: null,
    userCode: '',
    userNotes: '',
    challengeStartTime: null,
    isPanelExpanded: true,
  });

  const startCodingChallenge = useCallback((challenge: CodingChallenge) => {
    console.log('[InterviewEventBus] Starting coding challenge:', challenge.title);
    setState(prev => ({
      ...prev,
      activeChallenge: 'coding',
      codingChallenge: challenge,
      caseStudyChallenge: null,
      userCode: challenge.starterCode || '',
      userNotes: '',
      challengeStartTime: Date.now(),
      isPanelExpanded: true,
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

  return (
    <InterviewEventBusContext.Provider
      value={{
        ...state,
        startCodingChallenge,
        startCaseStudyChallenge,
        endChallenge,
        updateUserCode,
        updateUserNotes,
        togglePanelExpanded,
        setPanelExpanded,
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
