import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, CheckCircle, Presentation, Mic, Video } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  imageUrl: string;
  status: 'connecting' | 'connected' | 'ready';
}

interface MeetingLobbyProps {
  participants: Participant[];
  presentationTopic: string;
  onAllReady: () => void;
  isVisible: boolean;
}

const lobbyStages = [
  { id: 'init', message: 'Initializing meeting room...', duration: 2000 },
  { id: 'connecting', message: 'Connecting participants...', duration: 3000 },
  { id: 'audio', message: 'Setting up audio...', duration: 2000 },
  { id: 'video', message: 'Preparing video streams...', duration: 2500 },
  { id: 'ready', message: 'Almost ready to start...', duration: 1500 },
];

export default function MeetingLobby({
  participants,
  presentationTopic,
  onAllReady,
  isVisible
}: MeetingLobbyProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, 'connecting' | 'connected' | 'ready'>>({});
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const initialStatuses: Record<string, 'connecting' | 'connected' | 'ready'> = {};
    participants.forEach(p => {
      initialStatuses[p.id] = 'connecting';
    });
    setParticipantStatuses(initialStatuses);
  }, [participants]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (currentStageIndex < lobbyStages.length - 1) {
        setCurrentStageIndex(prev => prev + 1);
        
        const connectedCount = Math.min(
          Math.floor((currentStageIndex + 1) * participants.length / (lobbyStages.length - 1)),
          participants.length
        );
        
        setParticipantStatuses(prev => {
          const updated = { ...prev };
          participants.slice(0, connectedCount).forEach(p => {
            if (currentStageIndex >= lobbyStages.length - 2) {
              updated[p.id] = 'ready';
            } else {
              updated[p.id] = 'connected';
            }
          });
          return updated;
        });
      } else if (!isComplete) {
        setIsComplete(true);
        setParticipantStatuses(prev => {
          const updated = { ...prev };
          participants.forEach(p => {
            updated[p.id] = 'ready';
          });
          return updated;
        });
        
        setTimeout(() => {
          onAllReady();
        }, 800);
      }
    }, lobbyStages[currentStageIndex]?.duration || 2000);

    return () => clearTimeout(timer);
  }, [currentStageIndex, isVisible, participants, onAllReady, isComplete]);

  const currentStage = lobbyStages[currentStageIndex];
  const progress = ((currentStageIndex + 1) / lobbyStages.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        <div className="text-center max-w-lg px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500"
              />
              <Presentation className="w-8 h-8 text-blue-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Joining Meeting
            </h2>
            <p className="text-slate-400 text-sm mb-1">
              {presentationTopic}
            </p>
            
            <motion.p
              key={currentStage?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-blue-400 text-sm mt-4"
            >
              {currentStage?.message}
            </motion.p>
          </motion.div>

          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-8">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-4">
              <Users className="w-4 h-4" />
              <span>Participants joining...</span>
            </div>

            <div className="flex justify-center gap-3">
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-600 relative">
                    <img
                      src={participant.imageUrl}
                      alt={participant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${participant.name}&background=4a5568&color=fff`;
                      }}
                    />
                    
                    <AnimatePresence>
                      {participantStatuses[participant.id] === 'connecting' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        >
                          <Wifi className="w-4 h-4 text-white animate-pulse" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: participantStatuses[participant.id] === 'ready' ? 1 : 0 
                    }}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-3 h-3 text-white" />
                  </motion.div>
                  
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    {participant.name}
                  </p>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: participants.length * 0.2 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-orange-500 bg-gradient-to-br from-orange-500/20 to-orange-600/30 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-lg">You</span>
                </div>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
                
                <p className="text-xs text-orange-400 mt-2 text-center">
                  Presenter
                </p>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-6 text-slate-500 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" />
              <span>Camera ready</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
