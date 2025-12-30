import { useEffect, useState } from "react";
import { AlertCircle, Clock, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QueueStatus {
  position: number;
  estimatedWaitSeconds: number;
  activeSessionCount: number;
  maxConcurrentSessions: number;
}

interface QueueStatusBannerProps {
  onReady?: () => void;
  onCancel?: () => void;
  autoRefreshInterval?: number;
}

export default function QueueStatusBanner({
  onReady,
  onCancel,
  autoRefreshInterval = 5000,
}: QueueStatusBannerProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const response = await fetch("/api/avatar/queue/status");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setQueueStatus(data.queue);
            setError(null);
            
            if (data.queue.position === 0 && onReady) {
              onReady();
            }
          }
        } else {
          setError("Failed to check queue status");
        }
      } catch (err) {
        setError("Network error checking queue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, onReady]);

  const formatWaitTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <Alert className="mb-4" data-testid="queue-status-loading">
        <Clock className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking availability...</AlertTitle>
        <AlertDescription>
          Please wait while we check session availability.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4" data-testid="queue-status-error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Queue Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!queueStatus) {
    return null;
  }

  if (queueStatus.position === 0) {
    return null;
  }

  const capacityPercentage = 
    (queueStatus.activeSessionCount / queueStatus.maxConcurrentSessions) * 100;

  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200" data-testid="queue-status-banner">
      <Users className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Session Queue</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-amber-700">
          You are <strong>#{queueStatus.position}</strong> in the queue.
          Estimated wait: <strong>{formatWaitTime(queueStatus.estimatedWaitSeconds)}</strong>
        </p>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-amber-600">
            <span>Server Capacity</span>
            <span>
              {queueStatus.activeSessionCount} / {queueStatus.maxConcurrentSessions} sessions
            </span>
          </div>
          <Progress 
            value={capacityPercentage} 
            className="h-2 bg-amber-200"
            data-testid="queue-capacity-progress"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            data-testid="button-cancel-queue"
          >
            Cancel & Return
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
