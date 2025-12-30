import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TranscriptItem as TranscriptItemType } from '@/types/avatar-roleplay-types';

export type TranscriptItem = TranscriptItemType;

interface TranscriptContextType {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (id: string, role: 'user' | 'assistant', content: string, isHidden?: boolean) => void;
  addTranscriptBreadcrumb: (content: string, data?: Record<string, any>) => void;
  updateTranscriptItem: (id: string, updates: Partial<TranscriptItem>) => void;
  clearTranscript: () => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export function TranscriptProvider({ children }: { children: ReactNode }) {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);

  const addTranscriptMessage = useCallback((
    id: string,
    role: 'user' | 'assistant',
    content: string,
    isHidden: boolean = false
  ) => {
    const now = Date.now();
    const newItem: TranscriptItem = {
      itemId: id,
      type: 'MESSAGE',
      role,
      title: content,
      data: {},
      expanded: false,
      timestamp: new Date(now).toISOString(),
      createdAtMs: now,
      status: 'DONE',
      isHidden,
    };
    setTranscriptItems(prev => [...prev, newItem]);
  }, []);

  const addTranscriptBreadcrumb = useCallback((content: string, data?: Record<string, any>) => {
    const now = Date.now();
    const newItem: TranscriptItem = {
      itemId: crypto.randomUUID(),
      type: 'BREADCRUMB',
      title: content,
      data: data || {},
      expanded: false,
      timestamp: new Date(now).toISOString(),
      createdAtMs: now,
      status: 'DONE',
      isHidden: false,
    };
    setTranscriptItems(prev => [...prev, newItem]);
  }, []);

  const updateTranscriptItem = useCallback((id: string, updates: Partial<TranscriptItem>) => {
    setTranscriptItems(prev =>
      prev.map(item => (item.itemId === id ? { ...item, ...updates } : item))
    );
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptItems([]);
  }, []);

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        addTranscriptBreadcrumb,
        updateTranscriptItem,
        clearTranscript,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
}

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (context === undefined) {
    throw new Error('useTranscript must be used within a TranscriptProvider');
  }
  return context;
}
