import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const benefits = [
  'AI schedule generation with fallback mock intelligence',
  'Task breakdown and prioritization across projects',
  'Clean analytics and overdue tracking for focus planning'
];

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 px-6">
      <div className="absolute -left-14 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">TaskFlow AI</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
            Build your day with <span className="text-teal-600">clarity</span> and AI momentum.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            A modern productivity SaaS for planning, execution, and measurable progress.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800">
              Sign In
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft backdrop-blur">
          <h2 className="text-xl font-bold text-slate-900">Why it stands out</h2>
          <div className="mt-6 space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-teal-600" size={18} />
                <p className="text-sm text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
