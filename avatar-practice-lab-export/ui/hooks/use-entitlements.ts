import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EntitlementStatus {
  tier: 'free' | 'set_access' | 'subscriber';
  freeInterviewsRemaining: number;
  isSubscriber: boolean;
  subscriptionExpiresAt?: string;
  purchasedSets: { id: number; name: string }[];
  sharedAccessSets: { id: number; name: string }[];
}

export interface AccessCheckResult {
  hasAccess: boolean;
  accessType: 'free' | 'purchased' | 'company_shared' | 'subscription' | null;
  reason: string;
  freeInterviewsRemaining?: number;
  isSubscriber?: boolean;
  purchasedSetIds?: number[];
  sharedSetIds?: number[];
}

export function useEntitlements() {
  return useQuery<EntitlementStatus>({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const response = await fetch('/api/monetization/entitlements');
      if (!response.ok) {
        throw new Error('Failed to fetch entitlements');
      }
      return response.json();
    },
    staleTime: 30000,
    retry: 1
  });
}

export function useAccessCheck(interviewSetId?: number) {
  const params = new URLSearchParams();
  if (interviewSetId) {
    params.set('interviewSetId', interviewSetId.toString());
  }

  return useQuery<AccessCheckResult>({
    queryKey: ['accessCheck', interviewSetId],
    queryFn: async () => {
      const url = `/api/monetization/access-check${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to check access');
      }
      return response.json();
    },
    staleTime: 30000
  });
}

export function useUseFreeInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ interviewType, sessionId }: { interviewType?: string; sessionId?: number }) => {
      const response = await fetch('/api/monetization/use-free-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewType, sessionId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to use interview');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['accessCheck'] });
    }
  });
}

export function usePricing() {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const response = await fetch('/api/monetization/pricing');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      return response.json();
    },
    staleTime: 60000 * 60
  });
}

export function useValidateShareToken(token: string | null) {
  return useQuery({
    queryKey: ['shareToken', token],
    queryFn: async () => {
      if (!token) return null;
      const response = await fetch(`/api/monetization/share/validate/${token}`);
      if (!response.ok) {
        throw new Error('Invalid share token');
      }
      return response.json();
    },
    enabled: !!token,
    staleTime: 60000
  });
}

export function useClaimShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch(`/api/monetization/share/claim/${token}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.reason || 'Failed to claim access');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['accessCheck'] });
    }
  });
}
