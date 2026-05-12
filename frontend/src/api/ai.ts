import { apiClient } from './client';
import type { ScheduleItem, Task } from '../types';

export const parseTask = async (text: string) => {
  const { data } = await apiClient.post<{ task: Partial<Task>; source: string }>('/ai/parse-task', { text });
  return data;
};

export const breakdownTask = async (title: string, description?: string) => {
  const { data } = await apiClient.post<{ subtasks: string[]; source: string }>('/ai/breakdown-task', {
    title,
    description
  });
  return data;
};

export const generateSchedule = async (date: string) => {
  const { data } = await apiClient.post<{ schedule: ScheduleItem[]; source: string }>('/ai/generate-schedule', { date });
  return data;
};
