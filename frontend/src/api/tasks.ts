import { apiClient } from './client';
import type { Task } from '../types';

export const listTasks = async (params?: Record<string, string>) => {
  const { data } = await apiClient.get<Task[]>('/tasks', { params });
  return data;
};

export const createTask = async (payload: Partial<Task>) => {
  const { data } = await apiClient.post<Task>('/tasks', payload);
  return data;
};

export const updateTask = async (id: number, payload: Partial<Task>) => {
  const { data } = await apiClient.patch<Task>(`/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id: number) => {
  await apiClient.delete(`/tasks/${id}`);
};
