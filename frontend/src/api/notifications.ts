import { apiClient } from './client';
import type { Notification } from '../types';

export const listNotifications = async () => {
  const { data } = await apiClient.get<Notification[]>('/notifications');
  return data;
};

export const markNotificationRead = async (id: number) => {
  const { data } = await apiClient.patch<Notification>(`/notifications/${id}/read`);
  return data;
};
