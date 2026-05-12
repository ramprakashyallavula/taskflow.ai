import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const nextPath = searchParams.get('next') || '/dashboard';
    if (!token) {
      toast.error('Google authentication failed.');
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('taskflow_token', token);
    getCurrentUser()
      .then((user) => {
        setUser(user);
        toast.success('Signed in with Google');
        navigate(nextPath, { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('taskflow_token');
        toast.error('Google authentication failed.');
        navigate('/login', { replace: true });
      });
  }, [navigate, searchParams, setUser]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tf-grid-overlay">
      <div className="tf-panel w-full max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Finishing Google sign-in...</h1>
        <p className="mt-2 text-sm text-slate-500">Please wait while we secure your session.</p>
      </div>
    </div>
  );
}
