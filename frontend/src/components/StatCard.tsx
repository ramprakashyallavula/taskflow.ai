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
      className="tf-panel rounded-2xl p-5"
    >
      <p className="tf-label">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-600">{hint}</p>
    </motion.article>
  );
}
