import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const benefits = [
  'AI schedule generation with fallback mock intelligence',
  'Task breakdown and prioritization across projects',
  'Clean analytics and overdue tracking for focus planning'
];

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 tf-grid-overlay">
      <div className="tf-orb absolute -left-14 top-20 h-72 w-72 rounded-full bg-cyan-400/35" />
      <div className="tf-orb tf-orb-delay absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-cyan-400/30" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
          <p className="tf-label text-teal-700">TaskFlow AI</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
            Build your day with <span className="text-teal-600">clarity</span> and AI momentum.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            A modern productivity SaaS for planning, execution, and measurable progress.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register" className="tf-btn-primary gap-2 px-5 py-3">
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="rounded-xl border border-slate-300 bg-white/70 px-5 py-3 font-semibold text-slate-800">
              Sign In
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="tf-panel rounded-3xl p-8"
        >
          <h2 className="text-xl font-bold text-slate-900">Why it stands out</h2>
          <div className="mt-6 space-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-teal-600" size={18} />
                <p className="text-sm text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
