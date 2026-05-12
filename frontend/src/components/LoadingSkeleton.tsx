export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200/70 to-slate-100/90 ${className}`} />;
}
