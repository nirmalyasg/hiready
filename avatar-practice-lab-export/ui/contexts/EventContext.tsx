import React, { createContext, useContext, useCallback, ReactNode } from 'react';

interface EventContextType {
  logClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
  logServerEvent: (eventObj: any, eventNameSuffix?: string) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const logClientEvent = useCallback((eventObj: any, eventNameSuffix = '') => {
    const eventName = eventNameSuffix || eventObj?.type || 'client_event';
    console.log(`[Client Event] ${eventName}:`, eventObj);
  }, []);

  const logServerEvent = useCallback((eventObj: any, eventNameSuffix = '') => {
    const eventName = eventNameSuffix || eventObj?.type || 'server_event';
    console.log(`[Server Event] ${eventName}:`, eventObj);
  }, []);

  return (
    <EventContext.Provider value={{ logClientEvent, logServerEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
