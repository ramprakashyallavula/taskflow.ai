import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export const register = async (payload: {
  email: string;
  full_name: string;
  password: string;
}): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
};
