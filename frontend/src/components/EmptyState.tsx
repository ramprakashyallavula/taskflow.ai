export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="tf-panel border-dashed p-10 text-center">
      <h3 className="text-xl font-extrabold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
