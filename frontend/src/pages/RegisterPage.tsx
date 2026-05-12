import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { getGoogleStartUrl, register, verifyRegistration } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

function isoToFlag(isoCode: string) {
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

const countryOptions = getCountries()
  .map((country) => ({
    iso: country,
    code: `+${getCountryCallingCode(country)}`,
    flag: isoToFlag(country)
  }))
  .sort((a, b) => {
    if (a.code === b.code) return a.iso.localeCompare(b.iso);
    return Number(a.code.slice(1)) - Number(b.code.slice(1));
  });

function GoogleMark() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold shadow-sm">
      <span className="bg-[linear-gradient(90deg,#4285F4_0%,#34A853_38%,#FBBC05_68%,#EA4335_100%)] bg-clip-text text-transparent">
        G
      </span>
    </span>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const selectedCountry = countryOptions.find((country) => country.code === countryCode);

  const submitDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setInlineError('');
    if (!firstName.trim() || !lastName.trim()) {
      setInlineError('Please enter both first name and last name.');
      return;
    }
    if (password !== confirmPassword) {
      setInlineError('Password and confirm password must match.');
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const normalizedCode = `+${countryCode.replace(/\D/g, '')}`;
    if (normalizedCode.length < 2) {
      setInlineError('Please enter a valid country code (example: +1, +91).');
      return;
    }
    const normalizedMobile = `${normalizedCode}${mobileNumber.replace(/\D/g, '')}`;

    setLoading(true);
    try {
      const data = await register({ full_name: fullName, email, mobile_number: normalizedMobile, password });
      setDebugCode(data.debug_code || null);
      setStep('verify');
      toast.success('Verification code sent to your email.');
    } catch (error: any) {
      setInlineError(error?.response?.data?.detail || 'Could not create verification request.');
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    setInlineError('');
    setLoading(true);
    try {
      const data = await verifyRegistration({ email, code });
      localStorage.setItem('taskflow_token', data.access_token);
      setUser(data.user);
      toast.success('Account verified and created.');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setInlineError(error?.response?.data?.detail || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 tf-grid-overlay">
      <form
        onSubmit={step === 'details' ? submitDetails : submitVerification}
        className="tf-panel w-full max-w-md rounded-3xl p-8"
      >
        <h1 className="text-3xl font-extrabold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">
          {step === 'details'
            ? 'Start planning with AI in under a minute.'
            : `Enter the verification code sent to ${email}.`}
        </p>

        {step === 'details' && (
          <>
            <a
              href={getGoogleStartUrl('/dashboard')}
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
          </>
        )}

        <div className="space-y-4">
          {step === 'details' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
                />
                <input
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
                />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
              <div className="flex gap-2">
                <div className="flex w-[42%] items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-3">
                  <span className="text-base">{selectedCountry?.flag || '🌐'}</span>
                  <input
                    required
                    list="country-code-options"
                    value={countryCode}
                    onChange={(event) => {
                      const raw = event.target.value;
                      const digits = raw.replace(/\D/g, '');
                      setCountryCode(digits ? `+${digits}` : '+');
                    }}
                    placeholder="+1"
                    className="w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
                <datalist id="country-code-options">
                  {countryOptions.map((country) => (
                    <option key={`${country.iso}-${country.code}`} value={country.code} label={`${country.flag} ${country.iso}`} />
                  ))}
                </datalist>
                <input
                  required
                  value={mobileNumber}
                  onChange={(event) => setMobileNumber(event.target.value)}
                  placeholder="Mobile number"
                  className="w-[58%] rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
                />
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
            </>
          ) : (
            <>
              <input
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Verification code"
                className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />
              {debugCode && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                  Dev code (since SMTP is not configured): <strong>{debugCode}</strong>
                </div>
              )}
            </>
          )}

          {inlineError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{inlineError}</div>}

          <button disabled={loading} className="tf-btn-primary w-full disabled:opacity-60">
            {loading
              ? step === 'details'
                ? 'Sending code...'
                : 'Verifying...'
              : step === 'details'
                ? 'Send verification code'
                : 'Verify and create account'}
          </button>

          {step === 'verify' && (
            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Edit details
            </button>
          )}
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
