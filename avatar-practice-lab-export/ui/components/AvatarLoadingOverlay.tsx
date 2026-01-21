import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, MessageCircle, Mic, CheckCircle } from "lucide-react";

interface LoadingStage {
  id: string;
  message: string;
  subMessage: string;
  icon: React.ReactNode;
  duration: number;
}

const loadingStages: LoadingStage[] = [
  {
    id: "connecting",
    message: "Connecting to AI",
    subMessage: "Establishing secure connection...",
    icon: <Sparkles className="w-6 h-6" />,
    duration: 3000,
  },
  {
    id: "preparing",
    message: "Preparing Your Practice Partner",
    subMessage: "Loading avatar and voice systems...",
    icon: <MessageCircle className="w-6 h-6" />,
    duration: 8000,
  },
  {
    id: "finalizing",
    message: "Almost Ready",
    subMessage: "Setting up your practice session...",
    icon: <Mic className="w-6 h-6" />,
    duration: 6000,
  },
  {
    id: "ready",
    message: "Ready to Begin",
    subMessage: "Your AI practice partner is here!",
    icon: <CheckCircle className="w-6 h-6" />,
    duration: 1000,
  },
];

interface AvatarLoadingOverlayProps {
  isLoading: boolean;
  status?: string;
  avatarName?: string;
  onCancel?: () => void;
}

export default function AvatarLoadingOverlay({
  isLoading,
  status,
  avatarName,
  onCancel,
}: AvatarLoadingOverlayProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStageIndex(0);
      setProgress(0);
      return;
    }

    let totalElapsed = 0;
    const interval = setInterval(() => {
      totalElapsed += 100;
      
      let cumulativeTime = 0;
      let newStageIndex = 0;
      
      for (let i = 0; i < loadingStages.length; i++) {
        cumulativeTime += loadingStages[i].duration;
        if (totalElapsed < cumulativeTime) {
          newStageIndex = i;
          break;
        }
        newStageIndex = i;
      }
      
      setCurrentStageIndex(newStageIndex);
      
      const totalDuration = loadingStages.reduce((acc, stage) => acc + stage.duration, 0);
      const newProgress = Math.min((totalElapsed / totalDuration) * 100, 95);
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  const currentStage = loadingStages[currentStageIndex];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          data-testid="avatar-loading-overlay"
        >
          <div className="text-center max-w-md px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#ee7e65] border-r-[#ee7e65]/30"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-4 border-transparent border-b-[#f5a594] border-l-[#f5a594]/30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={currentStage.id}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-white"
                  >
                    {currentStage.icon}
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  {avatarName ? `Meeting ${avatarName}` : "Starting Session"}
                </h2>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStage.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1"
                  >
                    <p className="text-lg font-medium text-[#ee7e65]">
                      {currentStage.message}
                    </p>
                    <p className="text-sm text-slate-400">
                      {currentStage.subMessage}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            <div className="w-full max-w-xs mx-auto mb-6">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#ee7e65] to-[#f5a594] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Initializing</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {loadingStages.slice(0, -1).map((stage, index) => (
                <motion.div
                  key={stage.id}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStageIndex
                      ? "bg-[#ee7e65]"
                      : "bg-slate-600"
                  }`}
                  animate={{
                    scale: index === currentStageIndex ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: index === currentStageIndex ? Infinity : 0,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>This may take up to 30 seconds</span>
              </div>
              
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline"
                  data-testid="button-cancel-loading"
                >
                  Cancel and return to practice
                </button>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1 }}
              className="mt-8 flex justify-center gap-4"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>AI Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-[#ee7e65] animate-pulse" />
                <span>Secure Connection</span>
              </div>
            </motion.div>
          </div>

          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-xs text-slate-600">
              Powered by A3cend AI Practice
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
