import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPassword } from '../api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugResetLink, setDebugResetLink] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await forgotPassword({ email });
      setMessage(data.message);
      setDebugResetLink(data.debug_reset_link || null);
      toast.success('If the account exists, reset instructions are sent.');
    } catch {
      toast.error('Could not process this request right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tf-grid-overlay">
      <form onSubmit={onSubmit} autoComplete="off" className="tf-panel w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">We will send a password reset link to your registered email.</p>
        <div className="mt-6 space-y-4">
          <input
            type="text"
            required
            name="recovery_email"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Registered email"
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <button disabled={loading} className="tf-btn-primary w-full disabled:opacity-60">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </div>

        {message && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        {debugResetLink && (
          <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800 break-all">
            Dev reset link (SMTP not configured): <a href={debugResetLink} className="underline">{debugResetLink}</a>
          </div>
        )}

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
