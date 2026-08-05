import { useState } from 'react';
import { useStore } from '@nanostores/react';
import cx from '@src/cx.mjs';
import { createProject, updateProject } from './api-client';
import { currentProjectId, currentProjectName, setCurrentProject } from './store';

export function SaveButton({ context }) {
  const projectId = useStore(currentProjectId);
  const projectName = useStore(currentProjectName);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const code = context.editorRef.current?.code ?? '';
    setSaving(true);
    try {
      if (projectId) {
        await updateProject(projectId, { code });
      } else {
        const name = window.prompt('Project name:', 'Untitled');
        if (!name) return;
        const project = await createProject(name, code);
        setCurrentProject(project.id, project.name);
      }
    } catch (err) {
      console.error('[tidalwaves] save failed', err);
      window.alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      title="save project"
      className={cx('px-2 hover:opacity-50 flex items-center space-x-1', saving && 'opacity-50')}
    >
      <span>{saving ? 'saving…' : projectId ? `save "${projectName}"` : 'save'}</span>
    </button>
  );
}
