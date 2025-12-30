
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

export default function SessionCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEndAllSessions = async () => {
    try {
      setIsLoading(true);
      setStatus(null);
      setError(null);

      const response = await fetch("/api/avatar/end-sessions", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("All sessions terminated successfully");

        // Clear local storage data related to sessions
        localStorage.removeItem('transcript');
        localStorage.removeItem('finalTranscript');
      } else {
        setError(data.message || "Failed to terminate sessions");
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900 text-white">
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-4">Session Management</h3>
        <p className="mb-4">
          HeyGen limits trial accounts to 3 concurrent sessions. If you're experiencing errors like "Concurrent limit reached", use this to terminate all existing sessions.
        </p>
        <div className="flex flex-col gap-2">
          <Button 
            color="danger" 
            onClick={handleEndAllSessions} 
            disabled={isLoading}
            className="mb-2"
          >
            {isLoading ? <Spinner size="sm" className="text-white" /> : "Terminate All Sessions"}
          </Button>

          {status && (
            <div className="p-2 bg-green-700 rounded-md text-white text-sm">
              {status}
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-700 rounded-md text-white text-sm">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
