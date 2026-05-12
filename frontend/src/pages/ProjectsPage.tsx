import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createProject, deleteProject, listProjects, updateProject } from '../api/projects';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ProjectFormModal } from '../components/ProjectFormModal';
import type { Project } from '../types';

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success('Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to create project')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Project> }) => updateProject(id, payload),
    onSuccess: () => {
      toast.success('Project updated');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to update project')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Failed to delete project')
  });

  if (projectsQuery.isLoading) {
    return <LoadingSkeleton className="h-32" />;
  }

  const projects = projectsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-slate-900">Projects</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="tf-btn-primary gap-2"
        >
          <FolderPlus size={16} /> New project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="tf-card rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{project.description || 'No description yet.'}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditing(project);
                  setOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => deleteMutation.mutate(project.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!projects.length && <EmptyState title="No projects yet" subtitle="Group tasks by project to improve focus and reporting." />}

      <ProjectFormModal
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, payload });
          } else {
            await createMutation.mutateAsync(payload as { name: string; description?: string });
          }
        }}
      />
    </div>
  );
}
