import { apiClient } from './client';
import type { AnalyticsSummary } from '../types';

export const getAnalyticsSummary = async () => {
  const { data } = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return data;
};
