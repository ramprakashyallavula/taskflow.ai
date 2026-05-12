import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../api/auth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setInlineError('');

    if (!token) {
      setInlineError('Reset token is missing from the URL.');
      return;
    }
    if (password !== confirmPassword) {
      setInlineError('Password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({ token, new_password: password });
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (error: any) {
      setInlineError(error?.response?.data?.detail || 'Could not reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tf-grid-overlay">
      <form onSubmit={onSubmit} className="tf-panel w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your new password and confirm it.</p>
        <div className="mt-6 space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          {inlineError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{inlineError}</div>}
          <button disabled={loading} className="tf-btn-primary w-full disabled:opacity-60">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Back to{' '}
          <Link to="/login" className="font-semibold text-teal-600">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
