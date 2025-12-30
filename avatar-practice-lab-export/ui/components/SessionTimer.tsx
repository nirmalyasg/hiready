import { useEffect, useState, useCallback, useRef } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionTimerProps {
  sessionId?: number;
  heygenSessionId?: string;
  maxDurationSec?: number;
  onExpired?: () => void;
  onWarning?: (remainingSec: number) => void;
  className?: string;
}

export default function SessionTimer({
  sessionId,
  heygenSessionId,
  maxDurationSec = 360,
  onExpired,
  onWarning,
  className,
}: SessionTimerProps) {
  const [remainingSec, setRemainingSec] = useState<number>(maxDurationSec);
  const [isWarning, setIsWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledExpiredRef = useRef(false);
  const hasCalledWarningRef = useRef(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchSessionStatus = useCallback(async () => {
    if (!sessionId && !heygenSessionId) return;

    try {
      const params = new URLSearchParams();
      if (sessionId) params.set("sessionId", sessionId.toString());
      else if (heygenSessionId) params.set("heygenSessionId", heygenSessionId);

      const response = await fetch(`/api/avatar/session/status?${params}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.session) {
        setRemainingSec(data.session.remainingSec);
        
        if (data.session.isExpired && !hasCalledExpiredRef.current) {
          hasCalledExpiredRef.current = true;
          setIsExpired(true);
          onExpired?.();
        }
      }
    } catch (error) {
      console.error("Failed to fetch session status:", error);
    }
  }, [sessionId, heygenSessionId, onExpired]);

  const sendHeartbeat = useCallback(async () => {
    if (!sessionId && !heygenSessionId) return;

    try {
      const response = await fetch("/api/avatar/session/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, heygenSessionId }),
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        if (data.expired || data.shouldEnd) {
          if (!hasCalledExpiredRef.current) {
            hasCalledExpiredRef.current = true;
            setIsExpired(true);
            onExpired?.();
          }
        } else {
          setRemainingSec(data.remainingSec);
          
          if (data.warningActive && !hasCalledWarningRef.current) {
            hasCalledWarningRef.current = true;
            setIsWarning(true);
            onWarning?.(data.remainingSec);
          }
        }
      }
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }, [sessionId, heygenSessionId, onExpired, onWarning]);

  useEffect(() => {
    fetchSessionStatus();
    
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5000);
    
    countdownIntervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        const newValue = Math.max(0, prev - 1);
        
        if (newValue <= 60 && !hasCalledWarningRef.current) {
          hasCalledWarningRef.current = true;
          setIsWarning(true);
          onWarning?.(newValue);
        }
        
        if (newValue === 0 && !hasCalledExpiredRef.current) {
          hasCalledExpiredRef.current = true;
          setIsExpired(true);
          onExpired?.();
        }
        
        return newValue;
      });
    }, 1000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [fetchSessionStatus, sendHeartbeat, onExpired, onWarning]);

  const progressPercent = (remainingSec / maxDurationSec) * 100;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
        isExpired
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          : isWarning
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse"
          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        className
      )}
      data-testid="session-timer"
    >
      {isWarning ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      
      <div className="flex items-center gap-2">
        <span data-testid="timer-display">{formatTime(remainingSec)}</span>
        
        <div 
          className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
          data-testid="timer-progress"
        >
          <div
            className={cn(
              "h-full transition-all duration-1000 rounded-full",
              isExpired
                ? "bg-red-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-green-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isWarning && !isExpired && (
        <span className="text-xs" data-testid="timer-warning">
          Session ending soon!
        </span>
      )}
      
      {isExpired && (
        <span className="text-xs font-semibold" data-testid="timer-expired">
          Time's up!
        </span>
      )}
    </div>
  );
}
