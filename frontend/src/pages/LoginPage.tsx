import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getGoogleStartUrl, login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold shadow-sm">
      <span className="bg-[linear-gradient(90deg,#4285F4_0%,#34A853_38%,#FBBC05_68%,#EA4335_100%)] bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const googleError = useMemo(() => {
    const value = searchParams.get('google_error');
    if (!value) return '';
    return 'Google sign-in could not be completed. Please try again.';
  }, [searchParams]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setInlineError('');
    setShowForgotPassword(false);
    setLoading(true);
    try {
      const data = await login({ email, password });
      localStorage.setItem('taskflow_token', data.access_token);
      setUser(data.user);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      const detail = error?.response?.data?.detail as string | undefined;
      if ((error?.response?.status === 401 || error?.response?.status === 403) && detail) {
        setInlineError(detail);
        if (error?.response?.status === 401) {
          setShowForgotPassword(true);
        }
      } else {
        setInlineError('Could not sign in right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tf-grid-overlay">
      <form onSubmit={onSubmit} className="tf-panel w-full max-w-md rounded-3xl p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Continue to your productivity cockpit.</p>

        <a
          href={getGoogleStartUrl(from)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-blue-100"
        >
          <GoogleMark />
          Continue with Google
        </a>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />

          {(inlineError || googleError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {inlineError || googleError}
            </div>
          )}

          {showForgotPassword && (
            <p className="text-sm text-slate-600">
              Forgot password?{' '}
              <Link to="/forgot-password" className="font-semibold text-teal-600">
                Reset it here
              </Link>
            </p>
          )}

          <button disabled={loading} className="tf-btn-primary w-full disabled:opacity-60">
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
