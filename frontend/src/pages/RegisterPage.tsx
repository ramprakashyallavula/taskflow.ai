import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { register } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await register({ full_name: fullName, email, password });
      localStorage.setItem('taskflow_token', data.access_token);
      setUser(data.user);
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-extrabold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Start planning with AI in under a minute.</p>
        <div className="mt-6 space-y-4">
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
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
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-teal-600">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
