import { useEffect, useState } from 'react';
import type { Project } from '../types';

export function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initial
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Project>) => Promise<void>;
  initial?: Project | null;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initial?.name || '');
    setDescription(initial?.description || '');
  }, [initial, open]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    await onSubmit({ name, description });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-soft">
        <h3 className="text-xl font-bold text-slate-900">{initial ? 'Edit Project' : 'Create Project'}</h3>
        <div className="mt-4 space-y-4">
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Project name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Description"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button type="submit" className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
            {loading ? 'Saving...' : initial ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </form>
    </div>
  );
}
