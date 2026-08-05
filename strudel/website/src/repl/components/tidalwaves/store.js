import { persistentAtom } from '@nanostores/persistent';

// Tracks which saved tidalWaves project (if any) is currently loaded in the editor,
// so the Save/Record buttons (toolbar) and the ProjectsPanel (side tab) stay in sync
// even though they're far apart in the component tree.
export const currentProjectId = persistentAtom('tidalwaves-current-project-id', '');
export const currentProjectName = persistentAtom('tidalwaves-current-project-name', '');

export function setCurrentProject(id, name) {
  currentProjectId.set(id || '');
  currentProjectName.set(name || '');
}

// Whether the pattern should re-evaluate automatically shortly after the user
// stops typing, instead of requiring an explicit "update"/Ctrl+Enter.
export const autoEvaluateEnabled = persistentAtom('tidalwaves-auto-evaluate', 'false');

export const isAutoEvaluateEnabled = (value) => value === 'true';
