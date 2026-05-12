import { motion } from 'framer-motion';

export function StatCard({
  title,
  value,
  hint
}: {
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
    >
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </motion.article>
  );
}
