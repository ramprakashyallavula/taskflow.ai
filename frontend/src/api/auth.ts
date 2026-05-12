import { apiClient } from './client';
import type { AuthResponse, MessageResponse, User } from '../types';

export const register = async (payload: {
  email: string;
  full_name: string;
  mobile_number: string;
  password: string;
}): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/register', payload);
  return data;
};

export const verifyRegistration = async (payload: { email: string; code: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register/verify', payload);
  return data;
};

export const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const forgotPassword = async (payload: { email: string }): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/forgot-password', payload);
  return data;
};

export const resetPassword = async (payload: { token: string; new_password: string }): Promise<MessageResponse> => {
  const { data } = await apiClient.post<MessageResponse>('/auth/reset-password', payload);
  return data;
};

export const googleIdTokenSignIn = async (payload: { id_token: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/google', payload);
  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
};

export const getGoogleStartUrl = (nextPath: string = '/dashboard') => {
  const baseUrl = apiClient.defaults.baseURL || '';
  const encodedNext = encodeURIComponent(nextPath);
  return `${baseUrl}/auth/google/start?next=${encodedNext}`;
};
