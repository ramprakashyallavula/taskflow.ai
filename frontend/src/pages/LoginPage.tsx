import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      localStorage.setItem('taskflow_token', data.access_token);
      setUser(data.user);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-extrabold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Continue to your productivity cockpit.</p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-teal-600">
            Create account
          </Link>
        </p>
      </form>
    </div>
  );
}
