import { createContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '../api/auth';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taskflow_token');
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem('taskflow_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      logout
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
