import { useRef, useCallback } from 'react';
import { useTranscript } from '@/contexts/TranscriptContext';

export interface SessionHistoryHandlers {
  handleTranscriptionCompleted: (event: any) => void;
  handleTranscriptionDelta: (event: any) => void;
  handleAgentToolStart: (item: any) => void;
  handleAgentToolEnd: (item: any) => void;
  handleHistoryUpdated: (item: any) => void;
  handleHistoryAdded: (item: any) => void;
  handleGuardrailTripped: (item: any) => void;
}

function extractContentText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  
  if (Array.isArray(content)) {
    return content
      .map((part: any) => extractContentPartText(part))
      .filter(Boolean)
      .join('');
  }
  
  return extractContentPartText(content);
}

function extractContentPartText(part: any): string {
  if (!part) return '';
  if (typeof part === 'string') return part;
  
  if (part.text) {
    if (typeof part.text === 'string') return part.text;
    if (part.text.value) return part.text.value;
    return extractContentText(part.text);
  }
  
  if (part.transcript) {
    if (typeof part.transcript === 'string') return part.transcript;
    return extractContentText(part.transcript);
  }
  
  if (part.content) {
    return extractContentText(part.content);
  }
  
  if (part.audio_transcript) return part.audio_transcript;
  if (part.input_text) return part.input_text;
  if (part.output_text) return part.output_text;
  
  return '';
}

export function useHandleSessionHistory() {
  const { addTranscriptMessage, addTranscriptBreadcrumb, updateTranscriptItem } = useTranscript();
  const pendingTranscriptsRef = useRef<Map<string, string>>(new Map());
  const processedItemsRef = useRef<Set<string>>(new Set());

  const handleTranscriptionCompleted = useCallback((event: any) => {
    const itemId = event.item_id || event.event_id;
    if (!itemId) return;
    
    if (processedItemsRef.current.has(itemId)) return;
    
    const transcript = event.transcript || '';
    
    if (transcript) {
      processedItemsRef.current.add(itemId);
      const role = event.type?.includes('input') ? 'user' : 'assistant';
      addTranscriptMessage(itemId, role, transcript, false);
    }
  }, [addTranscriptMessage]);

  const handleTranscriptionDelta = useCallback((event: any) => {
    const itemId = event.item_id || event.event_id;
    const delta = event.delta || '';
    
    if (itemId && delta) {
      const current = pendingTranscriptsRef.current.get(itemId) || '';
      pendingTranscriptsRef.current.set(itemId, current + delta);
    }
  }, []);

  const handleAgentToolStart = useCallback((item: any) => {
    const toolName = item?.name || 'tool';
    addTranscriptBreadcrumb(`Tool started: ${toolName}`, { item });
  }, [addTranscriptBreadcrumb]);

  const handleAgentToolEnd = useCallback((item: any) => {
    const toolName = item?.name || 'tool';
    addTranscriptBreadcrumb(`Tool completed: ${toolName}`, { item });
  }, [addTranscriptBreadcrumb]);

  const handleHistoryUpdated = useCallback((item: any) => {
    if (item?.id) {
      const contentText = extractContentText(item.content) || item.title || '';
      updateTranscriptItem(item.id, { 
        status: item.status || 'DONE',
        title: contentText
      });
    }
  }, [updateTranscriptItem]);

  const handleHistoryAdded = useCallback((item: any) => {
    if (!item) return;
    
    const itemId = item.id || crypto.randomUUID();
    const role = item.role;
    const contentText = extractContentText(item.content);
    
    if (!role || !contentText) return;
    
    if (processedItemsRef.current.has(itemId)) {
      updateTranscriptItem(itemId, { title: contentText, status: 'DONE' });
    } else {
      processedItemsRef.current.add(itemId);
      addTranscriptMessage(itemId, role, contentText, false);
    }
  }, [addTranscriptMessage, updateTranscriptItem]);

  const handleGuardrailTripped = useCallback((item: any) => {
    addTranscriptBreadcrumb(`Guardrail tripped: ${item?.reason || 'content filtered'}`, { 
      guardrailResult: item 
    });
  }, [addTranscriptBreadcrumb]);

  const handlers: SessionHistoryHandlers = {
    handleTranscriptionCompleted,
    handleTranscriptionDelta,
    handleAgentToolStart,
    handleAgentToolEnd,
    handleHistoryUpdated,
    handleHistoryAdded,
    handleGuardrailTripped,
  };

  return useRef(handlers);
}

export default useHandleSessionHistory;
