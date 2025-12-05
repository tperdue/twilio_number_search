import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  triggerSync,
  triggerRegulationsSync,
  getSyncJobs,
  getSyncJob,
  getCountries,
  getCountry,
  getRegulations,
  searchNumbers,
} from '@/lib/api';
import type {
  NumberSearchRequest,
} from '@/types/api';

// ============================================
// Sync hooks
// ============================================

export function useSyncJobs() {
  return useQuery({
    queryKey: ['syncJobs'],
    queryFn: getSyncJobs,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
}

export function useSyncJob(jobId: string | null) {
  return useQuery({
    queryKey: ['syncJob', jobId],
    queryFn: () => getSyncJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling if completed or failed
      if (status === 'completed' || status === 'failed') return false;
      return 2000; // Poll every 2 seconds while in progress
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => triggerSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncJobs'] });
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
}

export function useTriggerRegulationsSync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => triggerRegulationsSync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncJobs'] });
      queryClient.invalidateQueries({ queryKey: ['regulations'] });
    },
  });
}

// ============================================
// Countries hooks
// ============================================

export function useCountries(params?: {
  skip?: number;
  limit?: number;
  number_type?: string;
}) {
  return useQuery({
    queryKey: ['countries', params],
    queryFn: () => getCountries(params),
  });
}

export function useCountry(countryCode: string) {
  return useQuery({
    queryKey: ['country', countryCode],
    queryFn: () => getCountry(countryCode),
    enabled: !!countryCode,
  });
}

// ============================================
// Regulations hooks
// ============================================

export function useRegulations(countryCode: string, numberType?: string) {
  return useQuery({
    queryKey: ['regulations', countryCode, numberType],
    queryFn: () => getRegulations(countryCode, numberType),
    enabled: !!countryCode,
  });
}

// ============================================
// Number search hooks
// ============================================

export function useSearchNumbers() {
  return useMutation({
    mutationFn: (data: NumberSearchRequest) => searchNumbers(data),
  });
}

