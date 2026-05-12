import { apiClient } from './client';
import type { Project } from '../types';

export const listProjects = async () => {
  const { data } = await apiClient.get<Project[]>('/projects');
  return data;
};

export const createProject = async (payload: { name: string; description?: string }) => {
  const { data } = await apiClient.post<Project>('/projects', payload);
  return data;
};

export const updateProject = async (id: number, payload: Partial<Project>) => {
  const { data } = await apiClient.patch<Project>(`/projects/${id}`, payload);
  return data;
};

export const deleteProject = async (id: number) => {
  await apiClient.delete(`/projects/${id}`);
};
