import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import cx from '@src/cx.mjs';
import { ActionButton } from '../button/action-button.jsx';
import {
  listProjects,
  getProject,
  deleteProject,
  createProject,
  listRecordings,
  deleteRecording,
  recordingDownloadUrl,
} from './api-client';
import { currentProjectId, setCurrentProject } from './store';

function RecordingRow({ recording, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const created = new Date(recording.created_at).toLocaleString();
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <audio className="h-8 grow" controls src={recordingDownloadUrl(recording.id)} />
      <span className="text-xs opacity-50 shrink-0">{created}</span>
      <ActionButton
        label="delete"
        labelIsHidden
        disabled={deleting}
        onClick={async () => {
          setDeleting(true);
          try {
            await deleteRecording(recording.id);
            onDeleted(recording.id);
          } finally {
            setDeleting(false);
          }
        }}
      >
        ✕
      </ActionButton>
    </div>
  );
}

function ProjectRow({ project, isActive, onLoad, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-2 px-2 py-1 rounded cursor-pointer hover:opacity-75',
        isActive && 'outline outline-1',
      )}
      onClick={() => onLoad(project)}
    >
      <span className="truncate">{project.name}</span>
      <ActionButton
        label="delete"
        labelIsHidden
        disabled={deleting}
        onClick={async (e) => {
          e.stopPropagation();
          setDeleting(true);
          try {
            await deleteProject(project.id);
            onDeleted(project.id);
          } finally {
            setDeleting(false);
          }
        }}
      >
        ✕
      </ActionButton>
    </div>
  );
}

export function ProjectsPanel({ context }) {
  const activeProjectId = useStore(currentProjectId);
  const [projects, setProjects] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    setProjects(await listProjects());
  }, []);

  const refreshRecordings = useCallback(async (projectId) => {
    setRecordings(projectId ? await listRecordings(projectId) : []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshProjects(), refreshRecordings(activeProjectId)]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshRecordings(activeProjectId);
  }, [activeProjectId, refreshRecordings]);

  const handleLoad = async (project) => {
    const full = await getProject(project.id);
    context.editorRef.current?.setCode(full.code);
    setCurrentProject(full.id, full.name);
  };

  const handleNew = async () => {
    const name = window.prompt('Project name:', 'Untitled');
    if (!name) return;
    const code = context.editorRef.current?.code ?? '';
    const project = await createProject(name, code);
    setCurrentProject(project.id, project.name);
    await refreshProjects();
  };

  if (loading) {
    return <div className="p-4 text-sm opacity-50">loading…</div>;
  }

  return (
    <div className="p-4 space-y-4 text-foreground text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base">Projects</h2>
        <ActionButton label="+ new" onClick={handleNew} />
      </div>
      <div className="space-y-1">
        {projects.length === 0 && <div className="opacity-50">No saved projects yet.</div>}
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            isActive={project.id === activeProjectId}
            onLoad={handleLoad}
            onDeleted={(id) => {
              setProjects((prev) => prev.filter((p) => p.id !== id));
              if (id === activeProjectId) setCurrentProject('', '');
            }}
          />
        ))}
      </div>
      {activeProjectId && (
        <div>
          <h3 className="text-base mb-1">Recordings</h3>
          {recordings.length === 0 && <div className="opacity-50">No recordings for this project yet.</div>}
          <div className="space-y-1">
            {recordings.map((recording) => (
              <RecordingRow
                key={recording.id}
                recording={recording}
                onDeleted={(id) => setRecordings((prev) => prev.filter((r) => r.id !== id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
