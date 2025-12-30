import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

interface BottomToolbarProps {
  isConnected: boolean;
  isConnecting?: boolean;
  isMuted?: boolean;
  onToggleConnection: () => void;
  onToggleMute?: () => void;
  isPTTActive?: boolean;
  isPTTUserSpeaking?: boolean;
  onTalkButtonDown?: () => void;
  onTalkButtonUp?: () => void;
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  isConnected,
  isConnecting = false,
  isMuted = false,
  onToggleConnection,
  onToggleMute,
  isPTTActive = false,
  isPTTUserSpeaking = false,
  onTalkButtonDown,
  onTalkButtonUp,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-center gap-4 z-50">
      {isPTTActive && isConnected && onTalkButtonDown && onTalkButtonUp ? (
        <Button
          variant={isPTTUserSpeaking ? "default" : "outline"}
          size="lg"
          onMouseDown={onTalkButtonDown}
          onMouseUp={onTalkButtonUp}
          onMouseLeave={onTalkButtonUp}
          onTouchStart={onTalkButtonDown}
          onTouchEnd={onTalkButtonUp}
          className="rounded-full px-8"
        >
          {isPTTUserSpeaking ? (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Speaking...
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Hold to Talk
            </>
          )}
        </Button>
      ) : null}

      {onToggleMute && isConnected && !isPTTActive && (
        <Button
          variant="outline"
          size="lg"
          onClick={onToggleMute}
          className="rounded-full"
        >
          {isMuted ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      )}

      <Button
        variant={isConnected ? "destructive" : "default"}
        size="lg"
        onClick={onToggleConnection}
        disabled={isConnecting}
        className="rounded-full px-8"
      >
        {isConnecting ? (
          "Connecting..."
        ) : isConnected ? (
          <>
            <PhoneOff className="w-5 h-5 mr-2" />
            End Session
          </>
        ) : (
          <>
            <Phone className="w-5 h-5 mr-2" />
            Start Session
          </>
        )}
      </Button>
    </div>
  );
};

export default BottomToolbar;
