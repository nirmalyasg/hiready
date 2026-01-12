import { useState, ReactNode } from 'react';
import { useAccessCheck } from '@/hooks/use-entitlements';
import { UpgradeModal } from './upgrade-modal';

interface AccessGateProps {
  children: ReactNode;
  interviewSetId?: number;
  interviewSetName?: string;
  onAccessGranted?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AccessGate({
  children,
  interviewSetId,
  interviewSetName,
  onAccessGranted,
  disabled = false,
  className = ''
}: AccessGateProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data: accessCheck, isLoading } = useAccessCheck(interviewSetId);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isLoading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (!accessCheck?.hasAccess) {
      e.preventDefault();
      e.stopPropagation();
      setShowUpgradeModal(true);
      return;
    }

    if (onAccessGranted) {
      onAccessGranted();
    }
  };

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        interviewSetId={interviewSetId}
        interviewSetName={interviewSetName}
        title="Unlock Interview Access"
        description={
          accessCheck?.freeInterviewsRemaining === 0
            ? "You've used your free interview. Upgrade to continue practicing."
            : "Subscribe or purchase access to start practicing."
        }
      />
    </>
  );
}

export type UpgradeContext = 'general' | 'role' | 'job';

interface UseAccessGateOptions {
  interviewSetId?: number;
  interviewSetName?: string;
  context?: UpgradeContext;
}

export function useAccessGate(options: UseAccessGateOptions = {}) {
  const { interviewSetId, interviewSetName, context = 'general' } = options;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data: accessCheck, isLoading, refetch } = useAccessCheck(interviewSetId);

  const checkAccess = (): boolean => {
    if (isLoading) return false;
    
    if (!accessCheck?.hasAccess) {
      setShowUpgradeModal(true);
      return false;
    }
    
    return true;
  };

  return {
    hasAccess: accessCheck?.hasAccess ?? false,
    isLoading,
    checkAccess,
    showUpgradeModal,
    setShowUpgradeModal,
    accessCheck,
    refetch,
    interviewSetId,
    interviewSetName,
    context
  };
}

export default AccessGate;
